import Database from 'better-sqlite3';

export interface Page { id: string; title: string; content: string; }
export interface Album { id: string; title: string; pages: Page[]; }

const db = new Database('store.db');

db.exec(`
CREATE TABLE IF NOT EXISTS albums (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  title TEXT
);
`);

db.exec(`
CREATE TABLE IF NOT EXISTS pages (
  id TEXT PRIMARY KEY,
  album_id TEXT,
  title TEXT,
  content TEXT
);
`);

export function getAlbums(userId: string): Album[] {
  const albums = db
    .prepare<[string], { id: string; title: string }>('SELECT id, title FROM albums WHERE user_id = ?')
    .all(userId);
  return albums.map(a => ({
    id: a.id,
    title: a.title,
    pages: db
      .prepare<[string], Page>('SELECT id, title, content FROM pages WHERE album_id = ?')
      .all(a.id)
  }));
}

export function getAlbum(userId: string, albumId: string): Album | undefined {
  const album = db
    .prepare<[string, string], { id: string; title: string }>('SELECT id, title FROM albums WHERE user_id = ? AND id = ?')
    .get(userId, albumId);
  if (!album) return undefined;
  const pages = db
    .prepare<[string], Page>('SELECT id, title, content FROM pages WHERE album_id = ?')
    .all(albumId);
  return { id: album.id, title: album.title, pages };
}

export function createAlbum(userId: string, title: string): Album {
  const id = Date.now().toString();
  db.prepare('INSERT INTO albums (id, user_id, title) VALUES (?, ?, ?)').run(id, userId, title);
  return { id, title, pages: [] };
}

export function updateAlbumTitle(albumId: string, title: string) {
  db.prepare('UPDATE albums SET title = ? WHERE id = ?').run(title, albumId);
}

export function deleteAlbum(albumId: string) {
  db.prepare('DELETE FROM pages WHERE album_id = ?').run(albumId);
  db.prepare('DELETE FROM albums WHERE id = ?').run(albumId);
}

export function createPage(albumId: string, title: string, content: string): Page {
  const id = Date.now().toString();
  db.prepare('INSERT INTO pages (id, album_id, title, content) VALUES (?, ?, ?, ?)').run(id, albumId, title, content);
  return { id, title, content };
}

export function getPage(albumId: string, pageId: string): Page | undefined {
  return db
    .prepare<[string, string], Page>('SELECT id, title, content FROM pages WHERE album_id = ? AND id = ?')
    .get(albumId, pageId);
}

export function updatePage(pageId: string, title: string, content: string) {
  db.prepare('UPDATE pages SET title = ?, content = ? WHERE id = ?').run(title, content, pageId);
}

export function deletePage(pageId: string) {
  db.prepare('DELETE FROM pages WHERE id = ?').run(pageId);
}
