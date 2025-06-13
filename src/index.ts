require('dotenv').config(); // Ensure to install dotenv package if not already installed

import express from 'express';
import session from 'express-session';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import bodyParser from 'body-parser';
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
  deletePage
} from './db';

interface Store { users: Record<string, any>; }
const app = express();
const PORT = process.env.PORT || 3000;
const store: Store = {
  users: {}
};

passport.use(new GoogleStrategy({
  clientID:     process.env.GOOGLE_CLIENT_ID!, // Ensure to set GOOGLE_CLIENT_ID in your .env file
  clientSecret: process.env.GOOGLE_CLIENT_SECRET!, // || 'your_client_secret',
  callbackURL:  '/auth/google/callback'
}, (accessToken, refreshToken, profile, cb) => {  
  // store.users[profile.id] = profile;
  store.users[profile.id] = {
    profile,
    accessToken,
    refreshToken: refreshToken || store.users[profile.id]?.refreshToken
  };

  return cb(null, profile);
}));

passport.serializeUser((user: any, cb)    => cb(null, user.id));
//passport.deserializeUser((id: string, cb) => cb(null, store.users[id]));
passport.deserializeUser((id: string, cb) => {
  const userData = store.users[id];
  if (!userData) return cb(new Error('User not found'));
  cb(null, userData.profile);
});

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({ secret: 'secret', resave: false, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());

function ensureAuth(req: any, res: any, next: any) {
  if (req.isAuthenticated()) return next();
  res.redirect('/');
}

app.get('/', (req: any, res: any) => {
  res.render('index', { user: req.user });
});

app.get('/auth/google',
  passport.authenticate('google', {
    scope: ['profile'],
    accessType: 'offline', // Request offline access to get refresh token
    prompt: 'consent' // Ensure consent screen is shown to get refresh token
    }));

app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/' }),
  (req: any, res: any) => {
    res.redirect('/albums');
  });

app.get('/logout', (req: any, res: any) => {
  req.logout(() => {
    res.redirect('/');
  });
});

app.get('/albums', ensureAuth, (req: any, res: any) => {
  const albums = getAlbums(req.user.id);
  res.render('albums', { user: req.user, albums });
});

app.get('/albums/new', ensureAuth, (req: any, res: any) => {
  res.render('album_new');
});

app.post('/albums', ensureAuth, (req: any, res: any) => {
  createAlbum(req.user.id, req.body.title);
  res.redirect('/albums');
});

app.get('/albums/:id', ensureAuth, (req: any, res: any) => {
  const album = getAlbum(req.user.id, req.params.id);
  if (!album) return res.sendStatus(404);
  res.render('album_show', { album });
});

app.get('/albums/:id/edit', ensureAuth, (req: any, res: any) => {
  const album = getAlbum(req.user.id, req.params.id);
  if (!album) return res.sendStatus(404);
  res.render('album_edit', { album });
});

app.post('/albums/:id/edit', ensureAuth, (req: any, res: any) => {
  const album = getAlbum(req.user.id, req.params.id);
  if (!album) return res.sendStatus(404);
  updateAlbumTitle(album.id, req.body.title);
  res.redirect('/albums/' + album.id);
});

app.post('/albums/:id/delete', ensureAuth, (req: any, res: any) => {
  deleteAlbum(req.params.id);
  res.redirect('/albums');
});

// Pages
app.get('/albums/:albumId/pages/new', ensureAuth, (req: any, res: any) => {
  const album = getAlbum(req.user.id, req.params.albumId);
  if (!album) return res.sendStatus(404);
  res.render('page_new', { albumId: req.params.albumId });
});

app.post('/albums/:albumId/pages', ensureAuth, (req: any, res: any) => {
  const album = getAlbum(req.user.id, req.params.albumId);
  if (!album) return res.sendStatus(404);
  createPage(album.id, req.body.title, req.body.content);
  res.redirect('/albums/' + album.id);
});

app.get('/albums/:albumId/pages/:pageId', ensureAuth, (req: any, res: any) => {
  const album = getAlbum(req.user.id, req.params.albumId);
  if (!album) return res.sendStatus(404);
  const page = getPage(album.id, req.params.pageId);
  if (!page) return res.sendStatus(404);
  res.render('page_show', { album, page });
});

app.get('/albums/:albumId/pages/:pageId/edit', ensureAuth, (req: any, res: any) => {
  const album = getAlbum(req.user.id, req.params.albumId);
  if (!album) return res.sendStatus(404);
  const page = getPage(album.id, req.params.pageId);
  if (!page) return res.sendStatus(404);
  res.render('page_edit', { albumId: album.id, page });
});

app.post('/albums/:albumId/pages/:pageId/edit', ensureAuth, (req: any, res: any) => {
  const album = getAlbum(req.user.id, req.params.albumId);
  if (!album) return res.sendStatus(404);
  const page = getPage(album.id, req.params.pageId);
  if (!page) return res.sendStatus(404);
  updatePage(page.id, req.body.title, req.body.content);
  res.redirect('/albums/' + album.id + '/pages/' + page.id);
});

app.post('/albums/:albumId/pages/:pageId/delete', ensureAuth, (req: any, res: any) => {
  const album = getAlbum(req.user.id, req.params.albumId);
  if (!album) return res.sendStatus(404);
  deletePage(req.params.pageId);
  res.redirect('/albums/' + album.id);
});

app.listen(PORT, () => {
  console.log(`Listening on http://localhost:${PORT}`);
});

