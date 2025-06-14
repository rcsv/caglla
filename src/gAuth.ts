import express from 'express';
import session from 'express-session';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';

interface Store { users: Record<string, any>; }
const store: Store = { users: {} };

export function configureGoogleAuth(app: express.Express) {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    callbackURL: '/auth/google/callback'
  }, (accessToken, refreshToken, profile, cb) => {
    store.users[profile.id] = {
      profile,
      accessToken,
      refreshToken: refreshToken || store.users[profile.id]?.refreshToken
    };
    return cb(null, profile);
  }));

  passport.serializeUser((user: any, cb) => cb(null, (user as any).id));
  passport.deserializeUser((id: string, cb) => {
    const userData = store.users[id];
    if (!userData) return cb(new Error('User not found'));
    cb(null, userData.profile);
  });

  app.use(session({ secret: 'secret', resave: false, saveUninitialized: false }));
  app.use(passport.initialize());
  app.use(passport.session());
}

export function ensureAuth(req: any, res: any, next: any) {
  if (req.isAuthenticated()) return next();
  res.redirect('/');
}

export const authRouter = express.Router();

authRouter.get('/auth/google', passport.authenticate('google', {
  scope: ['profile'],
  accessType: 'offline',
  prompt: 'consent'
}));

authRouter.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/' }),
  (req: any, res: any) => {
    res.redirect('/travels');
  });

authRouter.get('/logout', (req: any, res: any) => {
  req.logout(() => {
    res.redirect('/');
  });
});
