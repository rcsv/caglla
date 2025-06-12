const express = require('express');
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;

// Simple in-memory store
const store = {
  users: {}, // userId -> profile
  albums: {}, // userId -> [{id, title, pages:[{id, title, content}]}]
};

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID || 'your_client_id',
  clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'your_client_secret',
  callbackURL: '/auth/google/callback'
}, (accessToken, refreshToken, profile, cb) => {
  store.users[profile.id] = profile;
  if (!store.albums[profile.id]) {
    store.albums[profile.id] = [];
  }
  return cb(null, profile);
}));

passport.serializeUser((user, cb) => cb(null, user.id));
passport.deserializeUser((id, cb) => cb(null, store.users[id]));

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({ secret: 'secret', resave: false, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());

function ensureAuth(req, res, next) {
  if (req.isAuthenticated()) return next();
  res.redirect('/');
}

app.get('/', (req, res) => {
  res.render('index', { user: req.user });
});

app.get('/auth/google', passport.authenticate('google', { scope: ['profile'] }));
app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/' }),
  (req, res) => {
    res.redirect('/albums');
  });

app.get('/logout', (req, res) => {
  req.logout(() => {
    res.redirect('/');
  });
});

app.get('/albums', ensureAuth, (req, res) => {
  const albums = store.albums[req.user.id];
  res.render('albums', { user: req.user, albums });
});

app.get('/albums/new', ensureAuth, (req, res) => {
  res.render('album_new');
});

app.post('/albums', ensureAuth, (req, res) => {
  const albums = store.albums[req.user.id];
  const newAlbum = { id: Date.now().toString(), title: req.body.title, pages: [] };
  albums.push(newAlbum);
  res.redirect('/albums');
});

app.get('/albums/:id', ensureAuth, (req, res) => {
  const album = store.albums[req.user.id].find(a => a.id === req.params.id);
  if (!album) return res.sendStatus(404);
  res.render('album_show', { album });
});

app.get('/albums/:id/edit', ensureAuth, (req, res) => {
  const album = store.albums[req.user.id].find(a => a.id === req.params.id);
  if (!album) return res.sendStatus(404);
  res.render('album_edit', { album });
});

app.post('/albums/:id/edit', ensureAuth, (req, res) => {
  const albums = store.albums[req.user.id];
  const album = albums.find(a => a.id === req.params.id);
  if (!album) return res.sendStatus(404);
  album.title = req.body.title;
  res.redirect('/albums/' + album.id);
});

app.post('/albums/:id/delete', ensureAuth, (req, res) => {
  let albums = store.albums[req.user.id];
  store.albums[req.user.id] = albums.filter(a => a.id !== req.params.id);
  res.redirect('/albums');
});

// Pages
app.get('/albums/:albumId/pages/new', ensureAuth, (req, res) => {
  res.render('page_new', { albumId: req.params.albumId });
});

app.post('/albums/:albumId/pages', ensureAuth, (req, res) => {
  const album = store.albums[req.user.id].find(a => a.id === req.params.albumId);
  if (!album) return res.sendStatus(404);
  const newPage = { id: Date.now().toString(), title: req.body.title, content: req.body.content };
  album.pages.push(newPage);
  res.redirect('/albums/' + album.id);
});

app.get('/albums/:albumId/pages/:pageId', ensureAuth, (req, res) => {
  const album = store.albums[req.user.id].find(a => a.id === req.params.albumId);
  if (!album) return res.sendStatus(404);
  const page = album.pages.find(p => p.id === req.params.pageId);
  if (!page) return res.sendStatus(404);
  res.render('page_show', { album, page });
});

app.get('/albums/:albumId/pages/:pageId/edit', ensureAuth, (req, res) => {
  const album = store.albums[req.user.id].find(a => a.id === req.params.albumId);
  if (!album) return res.sendStatus(404);
  const page = album.pages.find(p => p.id === req.params.pageId);
  if (!page) return res.sendStatus(404);
  res.render('page_edit', { albumId: album.id, page });
});

app.post('/albums/:albumId/pages/:pageId/edit', ensureAuth, (req, res) => {
  const album = store.albums[req.user.id].find(a => a.id === req.params.albumId);
  if (!album) return res.sendStatus(404);
  const page = album.pages.find(p => p.id === req.params.pageId);
  if (!page) return res.sendStatus(404);
  page.title = req.body.title;
  page.content = req.body.content;
  res.redirect('/albums/' + album.id + '/pages/' + page.id);
});

app.post('/albums/:albumId/pages/:pageId/delete', ensureAuth, (req, res) => {
  const album = store.albums[req.user.id].find(a => a.id === req.params.albumId);
  if (!album) return res.sendStatus(404);
  album.pages = album.pages.filter(p => p.id !== req.params.pageId);
  res.redirect('/albums/' + album.id);
});

app.listen(PORT, () => {
  console.log(`Listening on http://localhost:${PORT}`);
});

