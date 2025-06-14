require('dotenv').config(); // Ensure to install dotenv package if not already installed

import express from 'express';
import bodyParser from 'body-parser';
import { configureGoogleAuth, authRouter, ensureAuth } from './gAuth';
import {
  Album,
  Page,
  getAlbums,
  getAlbum,
  createAlbum,
  updateAlbumTitle,
  deleteAlbum,
  createPage,
  getPage,
  updatePage,
  deletePage,
  initDb
} from './db';

const app = express();
const PORT = process.env.PORT || 3000;

configureGoogleAuth(app);

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(authRouter);

app.get('/', (req: any, res: any) => {
  res.render('index', { user: req.user });
});


app.get('/albums', ensureAuth, async (req: any, res: any) => {
  const albums = await getAlbums(req.user.id);
  res.render('albums', { user: req.user, albums });
});

app.get('/albums/new', ensureAuth, (req: any, res: any) => {
  res.render('album_new');
});

app.post('/albums', ensureAuth, async (req: any, res: any) => {
  const album = await createAlbum(req.user.id, req.body.title);
  if (req.headers.accept && req.headers.accept.includes('application/json')) {
    res.json(album);
  } else {
    res.redirect('/albums');
  }
});

app.get('/albums/:id', ensureAuth, async (req: any, res: any) => {
  const album = await getAlbum(req.user.id, req.params.id);
  if (!album) return res.sendStatus(404);
  res.render('album_show', { album });
});

app.get('/albums/:id/edit', ensureAuth, async (req: any, res: any) => {
  const album = await getAlbum(req.user.id, req.params.id);
  if (!album) return res.sendStatus(404);
  res.render('album_edit', { album });
});

app.post('/albums/:id/edit', ensureAuth, async (req: any, res: any) => {
  const album = await getAlbum(req.user.id, req.params.id);
  if (!album) return res.sendStatus(404);
  await updateAlbumTitle(album.id, req.body.title);
  res.redirect('/albums/' + album.id);
});

app.post('/albums/:id/delete', ensureAuth, async (req: any, res: any) => {
  await deleteAlbum(req.params.id);
  res.redirect('/albums');
});

// Pages
app.get('/albums/:albumId/pages/new', ensureAuth, async (req: any, res: any) => {
  const album = await getAlbum(req.user.id, req.params.albumId);
  if (!album) return res.sendStatus(404);
  res.render('page_new', { albumId: req.params.albumId });
});

app.post('/albums/:albumId/pages', ensureAuth, async (req: any, res: any) => {
  const album = await getAlbum(req.user.id, req.params.albumId);
  if (!album) return res.sendStatus(404);
  await createPage(album.id, req.body.title, req.body.content);
  res.redirect('/albums/' + album.id);
});

app.get('/albums/:albumId/pages/:pageId', ensureAuth, async (req: any, res: any) => {
  const album = await getAlbum(req.user.id, req.params.albumId);
  if (!album) return res.sendStatus(404);
  const page = await getPage(album.id, req.params.pageId);
  if (!page) return res.sendStatus(404);
  res.render('page_show', { album, page });
});

app.get('/albums/:albumId/pages/:pageId/edit', ensureAuth, async (req: any, res: any) => {
  const album = await getAlbum(req.user.id, req.params.albumId);
  if (!album) return res.sendStatus(404);
  const page = await getPage(album.id, req.params.pageId);
  if (!page) return res.sendStatus(404);
  res.render('page_edit', { albumId: album.id, page });
});

app.post('/albums/:albumId/pages/:pageId/edit', ensureAuth, async (req: any, res: any) => {
  const album = await getAlbum(req.user.id, req.params.albumId);
  if (!album) return res.sendStatus(404);
  const page = await getPage(album.id, req.params.pageId);
  if (!page) return res.sendStatus(404);
  await updatePage(page.id, req.body.title, req.body.content);
  res.redirect('/albums/' + album.id + '/pages/' + page.id);
});

app.post('/albums/:albumId/pages/:pageId/delete', ensureAuth, async (req: any, res: any) => {
  const album = await getAlbum(req.user.id, req.params.albumId);
  if (!album) return res.sendStatus(404);
  await deletePage(req.params.pageId);
  res.redirect('/albums/' + album.id);
});

/**
 * Initializes the database and starts the Express server.
 *
 * The server begins listening for incoming requests only after the database has been successfully initialized.
 */
async function start() {
  await initDb();
  app.listen(PORT, () => {
    console.log(`Listening on http://localhost:${PORT}`);
  });
}

start();

