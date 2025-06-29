import * as mysql from 'mysql2';
import { createPool, Pool } from 'mysql2/promise';

export interface Itinerary { id: string; title: string; content: string; }
export interface Travel {
  id: string;
  name: string;
  description: string | null;
  destination: string | null;
  start_date: Date | null;
  end_date: Date | null;
  created_at: Date;
  updated_at: Date;
  itineraries: Itinerary[];
}
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
    destination VARCHAR(255),
    name VARCHAR(255),
    description TEXT,
    start_date DATE,
    end_date DATE,
    created_at DATETIME,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
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
    `SELECT id, name, description, destination, start_date, end_date, created_at, updated_at
     FROM travels WHERE user_id = ?`,
    [userId]
  );
  const travels: Travel[] = [];
  for (const row of rows) {
    const [itineraries] = await p.query<any[]>(
      'SELECT id, title, content FROM itineraries WHERE travel_id = ?',
      [row.id]
    );
    travels.push({
      id: row.id,
      name: row.name,
      description: row.description,
      destination: row.destination,
      start_date: row.start_date,
      end_date: row.end_date,
      created_at: row.created_at,
      updated_at: row.updated_at,
      itineraries,
    });
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
    `SELECT id, name, description, destination, date_start, date_end, created_at, updated_at
     FROM travels WHERE user_id = ? AND id = ?`,
    [userId, travelId]
  );
  const travelRow = rows[0];
  if (!travelRow) return undefined;
  const [itineraries] = await p.query<any[]>(
    'SELECT id, title, content FROM itineraries WHERE travel_id = ?',
    [travelId]
  );
  return {
    id: travelRow.id,
    name: travelRow.name,
    description: travelRow.description,
    destination: travelRow.destination,
    start_date: travelRow.start_date,
    end_date: travelRow.end_date,
    created_at: travelRow.created_at,
    updated_at: travelRow.updated_at,
    itineraries,
  };
}

/**
 * Creates a new travel for the specified user with the given title.
 *
 * @param userId - The ID of the user who owns the travel.
 * @param title - The title of the new travel.
 * @returns The created travel object with an empty itineraries array.
 */
export async function createTravel(
  userId: string,
  name: string,
  description: string,
  destination: string | null,
  start_date: Date | null,
  end_date: Date | null
): Promise<Travel> {
  const p = getPool();
  const id = Date.now().toString();
  const now = new Date();

  // create param
  const str_sql = `
    INSERT INTO travels (
      id, user_id, destination, name, description,
      start_date, end_date, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const params = [
    id, userId, destination,
    name, description,
    start_date, end_date,
    now, now
  ];
  // ① mysql2.format で完全に置換された SQL を作ってログに出す
  const escaped = mysql.format(str_sql, params);
  console.log('▶︎ Executing SQL:', escaped);

  // ② そのまま実行
  await p.query(str_sql, params);
  return {
    id,
    name,
    description,
    destination,
    start_date: start_date,
    end_date: end_date,
    created_at: now,
    updated_at: now,
    itineraries: [],
  };
}

/**
 * Updates the title of a travel identified by its ID.
 *
 * @param travelId - The unique identifier of the travel to update.
 * @param title - The new title for the travel.
 */
export async function updateTravel(
  travelId: string,
  name: string,
  description: string,
  destination: string | null,
  start_date: Date | null,
  end_date: Date | null
) {
  const p = getPool();
  await p.query(
    'UPDATE travels SET name = ?, description = ?, destination = ?, start_date = ?, end_date = ?, updated_at = ? WHERE id = ?',
    [name, description, destination, start_date, end_date, new Date(), travelId]
  );
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
