import { createPool, Pool } from 'mysql2/promise';

export interface Page { id: string; title: string; content: string; }
export interface Album { id: string; title: string; pages: Page[]; }

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

export async function createAlbum(userId: string, title: string): Promise<Album> {
  const p = getPool();
  const id = Date.now().toString();
  await p.query('INSERT INTO albums (id, user_id, title) VALUES (?, ?, ?)', [id, userId, title]);
  return { id, title, pages: [] };
}

export async function updateAlbumTitle(albumId: string, title: string) {
  const p = getPool();
  await p.query('UPDATE albums SET title = ? WHERE id = ?', [title, albumId]);
}

export async function deleteAlbum(albumId: string) {
  const p = getPool();
  await p.query('DELETE FROM pages WHERE album_id = ?', [albumId]);
  await p.query('DELETE FROM albums WHERE id = ?', [albumId]);
}

export async function createPage(albumId: string, title: string, content: string): Promise<Page> {
  const p = getPool();
  const id = Date.now().toString();
  await p.query('INSERT INTO pages (id, album_id, title, content) VALUES (?, ?, ?, ?)', [id, albumId, title, content]);
  return { id, title, content };
}

export async function getPage(albumId: string, pageId: string): Promise<Page | undefined> {
  const p = getPool();
  const [rows] = await p.query<any[]>(
    'SELECT id, title, content FROM pages WHERE album_id = ? AND id = ?',
    [albumId, pageId]
  );
  return rows[0];
}

export async function updatePage(pageId: string, title: string, content: string) {
  const p = getPool();
  await p.query('UPDATE pages SET title = ?, content = ? WHERE id = ?', [title, content, pageId]);
}

export async function deletePage(pageId: string) {
  const p = getPool();
  await p.query('DELETE FROM pages WHERE id = ?', [pageId]);
}
