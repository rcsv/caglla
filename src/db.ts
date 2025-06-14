import { createPool, Pool } from 'mysql2/promise';

export interface Page { id: string; title: string; content: string; }
export interface Album { id: string; title: string; pages: Page[]; }

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
 * Initializes the database by creating the `albums` and `pages` tables if they do not already exist.
 *
 * @remark
 * This function is idempotent and can be safely called multiple times; it will not overwrite existing tables.
 */
export async function initDb() {
  const p = getPool();
  await p.query(`CREATE TABLE IF NOT EXISTS albums (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255),
    title VARCHAR(255)
  )`);

  await p.query(`CREATE TABLE IF NOT EXISTS pages (
    id VARCHAR(255) PRIMARY KEY,
    album_id VARCHAR(255),
    title VARCHAR(255),
    content TEXT
  )`);
}

/**
 * Retrieves all albums for a specified user, including their associated pages.
 *
 * @param userId - The ID of the user whose albums are to be fetched.
 * @returns A promise that resolves to an array of albums, each containing its pages.
 */
export async function getAlbums(userId: string): Promise<Album[]> {
  const p = getPool();
  const [rows] = await p.query<any[]>(
    'SELECT id, title FROM albums WHERE user_id = ?',
    [userId]
  );
  const albums: Album[] = [];
  for (const row of rows) {
    const [pages] = await p.query<any[]>(
      'SELECT id, title, content FROM pages WHERE album_id = ?',
      [row.id]
    );
    albums.push({ id: row.id, title: row.title, pages });
  }
  return albums;
}

/**
 * Retrieves a specific album and its pages for a given user.
 *
 * @param userId - The ID of the user who owns the album.
 * @param albumId - The ID of the album to retrieve.
 * @returns The album with its pages, or `undefined` if not found.
 */
export async function getAlbum(userId: string, albumId: string): Promise<Album | undefined> {
  const p = getPool();
  const [rows] = await p.query<any[]>(
    'SELECT id, title FROM albums WHERE user_id = ? AND id = ?',
    [userId, albumId]
  );
  const albumRow = rows[0];
  if (!albumRow) return undefined;
  const [pages] = await p.query<any[]>(
    'SELECT id, title, content FROM pages WHERE album_id = ?',
    [albumId]
  );
  return { id: albumRow.id, title: albumRow.title, pages };
}

/**
 * Creates a new album for the specified user with the given title.
 *
 * @param userId - The ID of the user who owns the album.
 * @param title - The title of the new album.
 * @returns The created album object with an empty pages array.
 */
export async function createAlbum(userId: string, title: string): Promise<Album> {
  const p = getPool();
  const id = Date.now().toString();
  await p.query('INSERT INTO albums (id, user_id, title) VALUES (?, ?, ?)', [id, userId, title]);
  return { id, title, pages: [] };
}

/**
 * Updates the title of an album identified by its ID.
 *
 * @param albumId - The unique identifier of the album to update.
 * @param title - The new title for the album.
 */
export async function updateAlbumTitle(albumId: string, title: string) {
  const p = getPool();
  await p.query('UPDATE albums SET title = ? WHERE id = ?', [title, albumId]);
}

/**
 * Deletes an album and all its associated pages from the database.
 *
 * @param albumId - The ID of the album to delete.
 */
export async function deleteAlbum(albumId: string) {
  const p = getPool();
  await p.query('DELETE FROM pages WHERE album_id = ?', [albumId]);
  await p.query('DELETE FROM albums WHERE id = ?', [albumId]);
}

/**
 * Creates a new page in the specified album and returns the created page.
 *
 * @param albumId - The ID of the album to which the page will be added.
 * @param title - The title of the new page.
 * @param content - The content of the new page.
 * @returns The created {@link Page} object.
 */
export async function createPage(albumId: string, title: string, content: string): Promise<Page> {
  const p = getPool();
  const id = Date.now().toString();
  await p.query('INSERT INTO pages (id, album_id, title, content) VALUES (?, ?, ?, ?)', [id, albumId, title, content]);
  return { id, title, content };
}

/**
 * Retrieves a page by album ID and page ID.
 *
 * @param albumId - The ID of the album containing the page.
 * @param pageId - The ID of the page to retrieve.
 * @returns The page if found, or `undefined` if no matching page exists.
 */
export async function getPage(albumId: string, pageId: string): Promise<Page | undefined> {
  const p = getPool();
  const [rows] = await p.query<any[]>(
    'SELECT id, title, content FROM pages WHERE album_id = ? AND id = ?',
    [albumId, pageId]
  );
  return rows[0];
}

/**
 * Updates the title and content of a page identified by its ID.
 *
 * @param pageId - The unique identifier of the page to update.
 * @param title - The new title for the page.
 * @param content - The new content for the page.
 */
export async function updatePage(pageId: string, title: string, content: string) {
  const p = getPool();
  await p.query('UPDATE pages SET title = ?, content = ? WHERE id = ?', [title, content, pageId]);
}

/**
 * Deletes a page from the database by its ID.
 *
 * @param pageId - The unique identifier of the page to delete.
 */
export async function deletePage(pageId: string) {
  const p = getPool();
  await p.query('DELETE FROM pages WHERE id = ?', [pageId]);
}
