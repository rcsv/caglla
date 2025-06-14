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

export async function getPlacePredictions(input: string) {
  try {
    const response = await axios.get(
      'https://maps.googleapis.com/maps/api/place/autocomplete/json',
      {
        params: {
          input,
          key: process.env.GOOGLE_API_KEY,
        },
      }
    );
    return response.data.predictions;
  } catch (err: any) {
    console.error('Error fetching place predictions:', err.response?.data || err);
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

// Sample usage
(async () => {
  await upsertPlacePrediction({
    place_id: 'ChIJ...kqX',
    description: '東京タワー, 東京都, 日本',
    structured_formatting: {
      main_text: '東京タワー',
      secondary_text: '東京都, 日本',
    },
    types: ['tourist_attraction', 'point_of_interest'],
    matched_substrings: [{ length: 2, offset: 0 }],
  });

  await updatePlaceDetails('ChIJ...kqX');
})();

