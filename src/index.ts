require('dotenv').config(); // Ensure to install dotenv package if not already installed

import express from 'express';
import bodyParser from 'body-parser';
import { configureGoogleAuth, authRouter, ensureAuth } from './gAuth';
import {
  Travel,
  Itinerary,
  getTravels,
  getTravel,
  createTravel,
  updateTravel,
  deleteTravel,
  createItinerary,
  getItinerary,
  updateItinerary,
  deleteItinerary,
  initDb
} from './db';
import { getAutocompleteSuggestions } from './places';

const app = express();
const PORT = process.env.PORT || 3000;

configureGoogleAuth(app);

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(authRouter);

app.post('/places/autocomplete', ensureAuth, async (req: any, res: any) => {
  const { input, languageCode } = req.body;
  if (!input) return res.json([]);
  try {
    const predictions = await getAutocompleteSuggestions(String(input), languageCode);
    res.json(predictions);
  } catch (err: any) {
    console.error('autocomplete error', err.response?.data || err);
    res.status(500).json({ error: 'Failed to fetch predictions' });
  }
});

app.get('/', (req: any, res: any) => {
  res.render('index', { user: req.user });
});


app.get('/travels', ensureAuth, async (req: any, res: any) => {
  const travels = await getTravels(req.user.id);
  res.render('travels', { user: req.user, travels });
});

app.get('/travels/new', ensureAuth, (req: any, res: any) => {
  res.render('travel_new');
});

app.post('/travels', ensureAuth, async (req: any, res: any) => {
  // ...
  console.log('Creating travel with body:', req.body);
  const destination: string | null = req.body.destination || null;
  const travel = await createTravel(
    req.user.id,
    req.body.name,
    req.body.description || '',
    destination,
    req.body.start_date || null,
    req.body.end_date || null
  );
  if (req.headers.accept && req.headers.accept.includes('application/json')) {
    res.json(travel);
  } else {
    res.redirect('/travels');
  }
});

app.get('/travels/:id', ensureAuth, async (req: any, res: any) => {
  const travel = await getTravel(req.user.id, req.params.id);
  if (!travel) return res.sendStatus(404);
  res.render('travel_show', { travel });
});

app.get('/travels/:id/edit', ensureAuth, async (req: any, res: any) => {
  const travel = await getTravel(req.user.id, req.params.id);
  if (!travel) return res.sendStatus(404);
  res.render('travel_edit', { travel });
});

app.post('/travels/:id/edit', ensureAuth, async (req: any, res: any) => {
  const travel = await getTravel(req.user.id, req.params.id);
  if (!travel) return res.sendStatus(404);
  const destination: string | null = req.body.destination || null;
  await updateTravel(
    travel.id,
    req.body.name,
    req.body.description || '',
    destination,
    req.body.start_date || null,
    req.body.end_date || null
  );
  res.redirect('/travels/' + travel.id);
});

app.post('/travels/:id/delete', ensureAuth, async (req: any, res: any) => {
  await deleteTravel(req.params.id);
  res.redirect('/travels');
});

// Itineraries
app.get('/travels/:travelId/itineraries/new', ensureAuth, async (req: any, res: any) => {
  const travel = await getTravel(req.user.id, req.params.travelId);
  if (!travel) return res.sendStatus(404);
  res.render('itinerary_new', { travelId: req.params.travelId });
});

app.post('/travels/:travelId/itineraries', ensureAuth, async (req: any, res: any) => {
  const travel = await getTravel(req.user.id, req.params.travelId);
  if (!travel) return res.sendStatus(404);
  const itinerary = await createItinerary(travel.id, req.body.title, req.body.content);

  if (req.headers.accept && req.headers.accept.includes('application/json')) {
    res.json(itinerary);
  } else {
    res.redirect('/travels/' + travel.id);
  }
});

app.get('/travels/:travelId/itineraries/:itineraryId', ensureAuth, async (req: any, res: any) => {
  const travel = await getTravel(req.user.id, req.params.travelId);
  if (!travel) return res.sendStatus(404);
  const itinerary = await getItinerary(travel.id, req.params.itineraryId);
  if (!itinerary) return res.sendStatus(404);
  if (req.headers.accept && req.headers.accept.includes('application/json')) {
    res.json(itinerary);
  } else {
    res.render('itinerary_show', { travel, itinerary });
  }
});

app.get('/travels/:travelId/itineraries/:itineraryId/edit', ensureAuth, async (req: any, res: any) => {
  const travel = await getTravel(req.user.id, req.params.travelId);
  if (!travel) return res.sendStatus(404);
  const itinerary = await getItinerary(travel.id, req.params.itineraryId);
  if (!itinerary) return res.sendStatus(404);
  res.render('itinerary_edit', { travelId: travel.id, itinerary });
});

app.post('/travels/:travelId/itineraries/:itineraryId/edit', ensureAuth, async (req: any, res: any) => {
  const travel = await getTravel(req.user.id, req.params.travelId);
  if (!travel) return res.sendStatus(404);
  const itinerary = await getItinerary(travel.id, req.params.itineraryId);
  if (!itinerary) return res.sendStatus(404);
  await updateItinerary(itinerary.id, req.body.title, req.body.content);

  if (req.headers.accept && req.headers.accept.includes('application/json')) {
    res.json({ id: itinerary.id, title: req.body.title, content: req.body.content });
  } else {
    res.redirect('/travels/' + travel.id + '/itineraries/' + itinerary.id);
  }
});

app.post('/travels/:travelId/itineraries/:itineraryId/delete', ensureAuth, async (req: any, res: any) => {
  const travel = await getTravel(req.user.id, req.params.travelId);
  if (!travel) return res.sendStatus(404);
  await deleteItinerary(req.params.itineraryId);
  if (req.headers.accept && req.headers.accept.includes('application/json')) {
    res.json({ success: true });
  } else {
    res.redirect('/travels/' + travel.id);
  }
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

