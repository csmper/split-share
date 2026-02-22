import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import {join} from 'node:path';
import { MongoClient, Db, ObjectId } from 'mongodb';

const browserDistFolder = join(import.meta.dirname, '../browser');

const app = express();
app.use(express.json());

const angularApp = new AngularNodeAppEngine();

// MongoDB Lazy Initialization
let db: Db | null = null;
async function getDb(): Promise<Db> {
  if (!db) {
    const uri = process.env['MONGODB_URI'];
    if (!uri) {
      throw new Error('MONGODB_URI environment variable is required');
    }
    const client = new MongoClient(uri);
    await client.connect();
    db = client.db('data-db');
    console.log('Connected to MongoDB (data-db)');
  }
  return db;
}

/**
 * API Endpoints
 */
app.get('/api/state', async (req, res) => {
  try {
    const database = await getDb();
    
    const rawPeople = await database.collection('user').find({}).toArray();
    const people = rawPeople.map(p => ({
      ...p,
      id: p['id'] || p['_id']?.toString()
    }));

    const rawGroups = await database.collection('groups').find({}).toArray();
    const groups = rawGroups.map(g => ({
      ...g,
      id: g['id'] || g['_id']?.toString()
    }));

    const rawExpenses = await database.collection('expenses').find({}).toArray();
    const expenses = rawExpenses.map(e => ({
      ...e,
      id: e['id'] || e['_id']?.toString()
    }));

    res.json({ people, groups, expenses });
  } catch (error) {
    console.error('Failed to fetch state:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/api/people', async (req, res) => {
  try {
    const database = await getDb();
    const person = req.body;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query: any = { $or: [{ id: person.id }] };
    if (ObjectId.isValid(person.id)) {
      query.$or.push({ _id: new ObjectId(person.id) });
    } else {
      query.$or.push({ _id: person.id });
    }

    await database.collection('user').updateOne(
      query, 
      { $set: person }, 
      { upsert: true }
    );
    res.json({ success: true });
  } catch (error) {
    console.error('Failed to save person:', error);
    res.status(500).json({ error: 'Failed to save person' });
  }
});

app.delete('/api/people/:id', async (req, res) => {
  try {
    const database = await getDb();
    const id = req.params['id'];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query: any = { $or: [{ id: id }] };
    if (ObjectId.isValid(id)) {
      query.$or.push({ _id: new ObjectId(id) });
    } else {
      query.$or.push({ _id: id });
    }

    await database.collection('user').deleteOne(query);
    res.json({ success: true });
  } catch (error) {
    console.error('Failed to delete person:', error);
    res.status(500).json({ error: 'Failed to delete person' });
  }
});

app.post('/api/groups', async (req, res) => {
  try {
    const database = await getDb();
    const group = req.body;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query: any = { $or: [{ id: group.id }] };
    if (ObjectId.isValid(group.id)) {
      query.$or.push({ _id: new ObjectId(group.id) });
    } else {
      query.$or.push({ _id: group.id });
    }

    await database.collection('groups').updateOne(
      query, 
      { $set: group }, 
      { upsert: true }
    );
    res.json({ success: true });
  } catch (error) {
    console.error('Failed to save group:', error);
    res.status(500).json({ error: 'Failed to save group' });
  }
});

app.delete('/api/groups/:id', async (req, res) => {
  try {
    const database = await getDb();
    const id = req.params['id'];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query: any = { $or: [{ id: id }] };
    if (ObjectId.isValid(id)) {
      query.$or.push({ _id: new ObjectId(id) });
    } else {
      query.$or.push({ _id: id });
    }

    await database.collection('groups').deleteOne(query);
    res.json({ success: true });
  } catch (error) {
    console.error('Failed to delete group:', error);
    res.status(500).json({ error: 'Failed to delete group' });
  }
});

app.post('/api/expenses', async (req, res) => {
  try {
    const database = await getDb();
    const expense = req.body;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query: any = { $or: [{ id: expense.id }] };
    if (ObjectId.isValid(expense.id)) {
      query.$or.push({ _id: new ObjectId(expense.id) });
    } else {
      query.$or.push({ _id: expense.id });
    }

    await database.collection('expenses').updateOne(
      query, 
      { $set: expense }, 
      { upsert: true }
    );
    res.json({ success: true });
  } catch (error) {
    console.error('Failed to save expense:', error);
    res.status(500).json({ error: 'Failed to save expense' });
  }
});

app.delete('/api/expenses/:id', async (req, res) => {
  try {
    const database = await getDb();
    const id = req.params['id'];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query: any = { $or: [{ id: id }] };
    if (ObjectId.isValid(id)) {
      query.$or.push({ _id: new ObjectId(id) });
    } else {
      query.$or.push({ _id: id });
    }

    await database.collection('expenses').deleteOne(query);
    res.json({ success: true });
  } catch (error) {
    console.error('Failed to delete expense:', error);
    res.status(500).json({ error: 'Failed to delete expense' });
  }
});

/**
 * Serve static files from /browser
 */
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

/**
 * Handle all other requests by rendering the Angular application.
 */
app.use((req, res, next) => {
  angularApp
    .handle(req)
    .then((response) =>
      response ? writeResponseToNodeResponse(response, res) : next(),
    )
    .catch(next);
});

/**
 * Start the server if this module is the main entry point, or it is ran via PM2.
 * The server listens on the port defined by the `PORT` environment variable, or defaults to 4000.
 */
if (isMainModule(import.meta.url) || process.env['pm_id']) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, (error) => {
    if (error) {
      throw error;
    }

    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

/**
 * Request handler used by the Angular CLI (for dev-server and during build) or Firebase Cloud Functions.
 */
export const reqHandler = createNodeRequestHandler(app);
