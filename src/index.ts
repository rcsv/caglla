import express from 'express';
import session from 'express-session';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import bodyParser from 'body-parser';

interface Page { id: string; title: string; content: string; }
interface Album { id: string; title: string; pages: Page[]; }
interface Store { users: Record<string, any>; albums: Record<string, Album[]>; }
const app = express();
const PORT = process.env.PORT || 3000;
const store: Store = {
  users: {},
  albums: {}
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

passport.serializeUser((user: any, cb) => cb(null, user.id));
passport.deserializeUser((id: string, cb) => cb(null, store.users[id]));

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({ secret: 'secret', resave: false, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());

function ensureAuth(req: any, res: any, next) {
  if (req.isAuthenticated()) return next();
  res.redirect('/');
}

app.get('/', (req: any, res: any) => {
  res.render('index', { user: req.user });
});

app.get('/auth/google', passport.authenticate('google', { scope: ['profile'] }));
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
  const albums = store.albums[req.user.id];
  res.render('albums', { user: req.user, albums });
});

app.get('/albums/new', ensureAuth, (req: any, res: any) => {
  res.render('album_new');
});

app.post('/albums', ensureAuth, (req: any, res: any) => {
  const albums = store.albums[req.user.id];
  const newAlbum = { id: Date.now().toString(), title: req.body.title, pages: [] };
  albums.push(newAlbum);
  res.redirect('/albums');
});

app.get('/albums/:id', ensureAuth, (req: any, res: any) => {
  const album = store.albums[req.user.id].find(a => a.id === req.params.id);
  if (!album) return res.sendStatus(404);
  res.render('album_show', { album });
});

app.get('/albums/:id/edit', ensureAuth, (req: any, res: any) => {
  const album = store.albums[req.user.id].find(a => a.id === req.params.id);
  if (!album) return res.sendStatus(404);
  res.render('album_edit', { album });
});

app.post('/albums/:id/edit', ensureAuth, (req: any, res: any) => {
  const albums = store.albums[req.user.id];
  const album = albums.find(a => a.id === req.params.id);
  if (!album) return res.sendStatus(404);
  album.title = req.body.title;
  res.redirect('/albums/' + album.id);
});

app.post('/albums/:id/delete', ensureAuth, (req: any, res: any) => {
  let albums = store.albums[req.user.id];
  store.albums[req.user.id] = albums.filter(a => a.id !== req.params.id);
  res.redirect('/albums');
});

// Pages
app.get('/albums/:albumId/pages/new', ensureAuth, (req: any, res: any) => {
  res.render('page_new', { albumId: req.params.albumId });
});

app.post('/albums/:albumId/pages', ensureAuth, (req: any, res: any) => {
  const album = store.albums[req.user.id].find(a => a.id === req.params.albumId);
  if (!album) return res.sendStatus(404);
  const newPage = { id: Date.now().toString(), title: req.body.title, content: req.body.content };
  album.pages.push(newPage);
  res.redirect('/albums/' + album.id);
});

app.get('/albums/:albumId/pages/:pageId', ensureAuth, (req: any, res: any) => {
  const album = store.albums[req.user.id].find(a => a.id === req.params.albumId);
  if (!album) return res.sendStatus(404);
  const page = album.pages.find(p => p.id === req.params.pageId);
  if (!page) return res.sendStatus(404);
  res.render('page_show', { album, page });
});

app.get('/albums/:albumId/pages/:pageId/edit', ensureAuth, (req: any, res: any) => {
  const album = store.albums[req.user.id].find(a => a.id === req.params.albumId);
  if (!album) return res.sendStatus(404);
  const page = album.pages.find(p => p.id === req.params.pageId);
  if (!page) return res.sendStatus(404);
  res.render('page_edit', { albumId: album.id, page });
});

app.post('/albums/:albumId/pages/:pageId/edit', ensureAuth, (req: any, res: any) => {
  const album = store.albums[req.user.id].find(a => a.id === req.params.albumId);
  if (!album) return res.sendStatus(404);
  const page = album.pages.find(p => p.id === req.params.pageId);
  if (!page) return res.sendStatus(404);
  page.title = req.body.title;
  page.content = req.body.content;
  res.redirect('/albums/' + album.id + '/pages/' + page.id);
});

app.post('/albums/:albumId/pages/:pageId/delete', ensureAuth, (req: any, res: any) => {
  const album = store.albums[req.user.id].find(a => a.id === req.params.albumId);
  if (!album) return res.sendStatus(404);
  album.pages = album.pages.filter(p => p.id !== req.params.pageId);
  res.redirect('/albums/' + album.id);
});

app.listen(PORT, () => {
  console.log(`Listening on http://localhost:${PORT}`);
});

