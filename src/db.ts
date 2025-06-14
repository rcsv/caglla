import { createPool, Pool } from 'mysql2/promise';

export interface Itinerary { id: string; title: string; content: string; }
export interface Travel { id: string; title: string; itineraries: Itinerary[]; }
export interface UserSettings {
  google_id: string;
  preferred_currency: string | null;
  skip_confirm_delete: boolean;
}

let pool: Pool;

/**
 * Returns a singleton MySQL connection pool, initializing it with environment variables if it does not already exist.
 *
 * @returns The MySQL connection pool instance.
 */
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
 * Initializes the database by creating the `travels` and `itineraries` tables if they do not already exist.
 *
 * @remark
 * This function is idempotent and can be safely called multiple times; it will not overwrite existing tables.
 */
export async function initDb() {
  const p = getPool();
  await p.query(`CREATE TABLE IF NOT EXISTS travels (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255),
    title VARCHAR(255)
  )`);

  await p.query(`CREATE TABLE IF NOT EXISTS itineraries (
    id VARCHAR(255) PRIMARY KEY,
    travel_id VARCHAR(255),
    title VARCHAR(255),
    content TEXT
  )`);

  await p.query(`CREATE TABLE IF NOT EXISTS users (
    google_id VARCHAR(255) PRIMARY KEY,
    preferred_currency VARCHAR(10),
    skip_confirm_delete BOOLEAN DEFAULT FALSE
  )`);

  await p.query(`CREATE TABLE IF NOT EXISTS places (
    id INT AUTO_INCREMENT PRIMARY KEY,
    google_place_id VARCHAR(255) NOT NULL UNIQUE,
    description TEXT NOT NULL,
    main_text VARCHAR(255) NOT NULL,
    secondary_text VARCHAR(255),
    types JSON,
    matched_substrings JSON,
    formatted_address VARCHAR(255),
    latitude DECIMAL(9,6),
    longitude DECIMAL(9,6),
    name VARCHAR(255),
    rating DECIMAL(2,1),
    international_phone_number VARCHAR(50),
    website VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )`);
}

/**
 * Retrieves all travels for a specified user, including their associated itineraries.
 *
 * @param userId - The ID of the user whose travels are to be fetched.
 * @returns A promise that resolves to an array of travels, each containing its itineraries.
 */
export async function getTravels(userId: string): Promise<Travel[]> {
  const p = getPool();
  const [rows] = await p.query<any[]>(
    'SELECT id, title FROM travels WHERE user_id = ?',
    [userId]
  );
  const travels: Travel[] = [];
  for (const row of rows) {
    const [itineraries] = await p.query<any[]>(
      'SELECT id, title, content FROM itineraries WHERE travel_id = ?',
      [row.id]
    );
    travels.push({ id: row.id, title: row.title, itineraries });
  }
  return travels;
}

/**
 * Retrieves a specific travel and its itineraries for a given user.
 *
 * @param userId - The ID of the user who owns the travel.
 * @param travelId - The ID of the travel to retrieve.
 * @returns The travel with its itineraries, or `undefined` if not found.
 */
export async function getTravel(userId: string, travelId: string): Promise<Travel | undefined> {
  const p = getPool();
  const [rows] = await p.query<any[]>(
    'SELECT id, title FROM travels WHERE user_id = ? AND id = ?',
    [userId, travelId]
  );
  const travelRow = rows[0];
  if (!travelRow) return undefined;
  const [itineraries] = await p.query<any[]>(
    'SELECT id, title, content FROM itineraries WHERE travel_id = ?',
    [travelId]
  );
  return { id: travelRow.id, title: travelRow.title, itineraries };
}

/**
 * Creates a new travel for the specified user with the given title.
 *
 * @param userId - The ID of the user who owns the travel.
 * @param title - The title of the new travel.
 * @returns The created travel object with an empty itineraries array.
 */
export async function createTravel(userId: string, title: string): Promise<Travel> {
  const p = getPool();
  const id = Date.now().toString();
  await p.query('INSERT INTO travels (id, user_id, title) VALUES (?, ?, ?)', [id, userId, title]);
  return { id, title, itineraries: [] };
}

/**
 * Updates the title of a travel identified by its ID.
 *
 * @param travelId - The unique identifier of the travel to update.
 * @param title - The new title for the travel.
 */
export async function updateTravelTitle(travelId: string, title: string) {
  const p = getPool();
  await p.query('UPDATE travels SET title = ? WHERE id = ?', [title, travelId]);
}

/**
 * Deletes a travel and all its associated itineraries from the database.
 *
 * @param travelId - The ID of the travel to delete.
 */
export async function deleteTravel(travelId: string) {
  const p = getPool();
  await p.query('DELETE FROM itineraries WHERE travel_id = ?', [travelId]);
  await p.query('DELETE FROM travels WHERE id = ?', [travelId]);
}

/**
 * Creates a new itinerary in the specified travel and returns the created itinerary.
 *
 * @param travelId - The ID of the travel to which the itinerary will be added.
 * @param title - The title of the new itinerary.
 * @param content - The content of the new itinerary.
 * @returns The created {@link Itinerary} object.
 */
export async function createItinerary(travelId: string, title: string, content: string): Promise<Itinerary> {
  const p = getPool();
  const id = Date.now().toString();
  await p.query('INSERT INTO itineraries (id, travel_id, title, content) VALUES (?, ?, ?, ?)', [id, travelId, title, content]);
  return { id, title, content };
}

/**
 * Retrieves a itinerary by travel ID and itinerary ID.
 *
 * @param travelId - The ID of the travel containing the itinerary.
 * @param itineraryId - The ID of the itinerary to retrieve.
 * @returns The itinerary if found, or `undefined` if no matching itinerary exists.
 */
export async function getItinerary(travelId: string, itineraryId: string): Promise<Itinerary | undefined> {
  const p = getPool();
  const [rows] = await p.query<any[]>(
    'SELECT id, title, content FROM itineraries WHERE travel_id = ? AND id = ?',
    [travelId, itineraryId]
  );
  return rows[0];
}

/**
 * Updates the title and content of a itinerary identified by its ID.
 *
 * @param itineraryId - The unique identifier of the itinerary to update.
 * @param title - The new title for the itinerary.
 * @param content - The new content for the itinerary.
 */
export async function updateItinerary(itineraryId: string, title: string, content: string) {
  const p = getPool();
  await p.query('UPDATE itineraries SET title = ?, content = ? WHERE id = ?', [title, content, itineraryId]);
}

/**
 * Deletes a itinerary from the database by its ID.
 *
 * @param itineraryId - The unique identifier of the itinerary to delete.
 */
export async function deleteItinerary(itineraryId: string) {
  const p = getPool();
  await p.query('DELETE FROM itineraries WHERE id = ?', [itineraryId]);
}

/**
 * Creates a user record if it does not already exist.
 *
 * @param googleId - The Google account ID for the user.
 */
export async function createUserIfNotExists(googleId: string) {
  const p = getPool();
  await p.query(
    'INSERT IGNORE INTO users (google_id, preferred_currency, skip_confirm_delete) VALUES (?, NULL, FALSE)',
    [googleId]
  );
}

/**
 * Retrieves settings for a user by Google ID.
 *
 * @param googleId - The Google account ID of the user.
 * @returns The user settings or `undefined` if not found.
 */
export async function getUserSettings(googleId: string): Promise<UserSettings | undefined> {
  const p = getPool();
  const [rows] = await p.query<any[]>(
    'SELECT google_id, preferred_currency, skip_confirm_delete FROM users WHERE google_id = ?',
    [googleId]
  );
  const row = rows[0];
  if (!row) return undefined;
  return {
    google_id: row.google_id,
    preferred_currency: row.preferred_currency,
    skip_confirm_delete: !!row.skip_confirm_delete,
  };
}

export async function setUserCurrency(googleId: string, currency: string) {
  const p = getPool();
  await p.query('UPDATE users SET preferred_currency = ? WHERE google_id = ?', [currency, googleId]);
}

export async function setSkipConfirmDelete(googleId: string, skip: boolean) {
  const p = getPool();
  await p.query('UPDATE users SET skip_confirm_delete = ? WHERE google_id = ?', [skip, googleId]);
}
