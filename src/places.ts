import { createPool, Pool } from 'mysql2/promise';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

let pool: Pool;

function getPool(): Pool {
  if (!pool) {
    pool = createPool({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });
  }
  return pool;
}


/**
 * Fetches place autocomplete suggestions using the Places API (New).
 *
 * @param input The text input from the user.
 * @param languageCode Optional IETF language code (e.g. "en").
 * @returns Array of objects containing place_id and description.
 */
export async function getAutocompleteSuggestions(
  input: string,
  languageCode?: string
) {
  try {
    const response = await axios.post(
      'https://places.googleapis.com/v1/places:autocomplete',
      {
        input,
        ...(languageCode ? { languageCode } : {}),
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': process.env.GOOGLE_API_KEY || '',
          'X-Goog-FieldMask': '*',
        },
      }
    );

    const suggestions = response.data.suggestions || [];

    return suggestions
      .filter(
        (s: any) =>
          s?.placePrediction?.placeId &&
          s?.placePrediction?.displayName?.text
      )
      .map((s: any) => ({
        place_id: s.placePrediction.placeId,
        description: s.placePrediction.displayName.text,
      }));
  } catch (err: any) {
    console.error('Error fetching place autocomplete:', err.response?.data || err);
    throw err;
  }
}

export async function upsertPlacePrediction(place: any) {
  const p = getPool();
  try {
    await p.query(
      `INSERT INTO places (google_place_id, description, main_text, secondary_text, types, matched_substrings)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         description = VALUES(description),
         main_text = VALUES(main_text),
         secondary_text = VALUES(secondary_text),
         types = VALUES(types),
         matched_substrings = VALUES(matched_substrings)`,
      [
        place.place_id,
        place.description,
        place.structured_formatting?.main_text || '',
        place.structured_formatting?.secondary_text || '',
        JSON.stringify(place.types || []),
        JSON.stringify(place.matched_substrings || []),
      ]
    );
  } catch (err) {
    console.error('Error saving place prediction:', err);
    throw err;
  }
}

export async function updatePlaceDetails(placeId: string) {
  const p = getPool();
  try {
    const response = await axios.get(
      'https://maps.googleapis.com/maps/api/place/details/json',
      {
        params: {
          place_id: placeId,
          key: process.env.GOOGLE_API_KEY,
        },
      }
    );
    const r = response.data.result;
    await p.query(
      `UPDATE places SET
         formatted_address = ?,
         latitude = ?,
         longitude = ?,
         name = ?,
         rating = ?,
         international_phone_number = ?,
         website = ?
       WHERE google_place_id = ?`,
      [
        r.formatted_address,
        r.geometry?.location?.lat || null,
        r.geometry?.location?.lng || null,
        r.name,
        r.rating,
        r.international_phone_number,
        r.website,
        placeId,
      ]
    );
  } catch (err: any) {
    console.error('Error updating place details:', err.response?.data || err);
    throw err;
  }
}

export async function findOrCreatePlace(placeId: string): Promise<number> {
  const p = getPool();
  const [rows] = await p.query<any[]>(
    'SELECT id FROM places WHERE google_place_id = ?',
    [placeId]
  );
  if (rows.length > 0) return rows[0].id;

  try {
    const response = await axios.get(
      'https://maps.googleapis.com/maps/api/place/details/json',
      {
        params: {
          place_id: placeId,
          key: process.env.GOOGLE_API_KEY,
        },
      }
    );
    const r = response.data.result;
    const description = r.name && r.formatted_address
      ? `${r.name}, ${r.formatted_address}`
      : r.name || r.formatted_address || '';
    const [result] = await p.query<any>(
      `INSERT INTO places (
         google_place_id,
         description,
         main_text,
         secondary_text,
         types,
         matched_substrings,
         formatted_address,
         latitude,
         longitude,
         name,
         rating,
         international_phone_number,
         website
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        placeId,
        description,
        r.name || '',
        r.formatted_address || '',
        JSON.stringify(r.types || []),
        '[]',
        r.formatted_address || '',
        r.geometry?.location?.lat || null,
        r.geometry?.location?.lng || null,
        r.name || '',
        r.rating || null,
        r.international_phone_number || null,
        r.website || null,
      ]
    );
    return result.insertId as number;
  } catch (err: any) {
    console.error('Error creating place from id:', err.response?.data || err);
    throw err;
  }
}

