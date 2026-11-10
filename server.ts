import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface VisitorNote {
  id: string;
  author: string;
  message: string;
  location: string;
  timestamp: number;
}

interface PlayerPresence {
  id: string;
  name: string;
  x: number;
  z: number;
  lastSeen: number;
}

// In-memory persistent state for island explorers
const visitorNotes: VisitorNote[] = [
  {
    id: 'note-1',
    author: 'Captain Alistair',
    message: 'The lighthouse beacon shines bright even through the thickest coastal fog. Keep moving inland toward the high cliffs.',
    location: 'Coastal Dock',
    timestamp: Date.now() - 3600000 * 24,
  },
  {
    id: 'note-2',
    author: 'Elena Vance',
    message: 'The waterfall feeds a secret freshwater spring behind the rock arch. The air smells of wild pine and salt.',
    location: 'Misty Cascade',
    timestamp: Date.now() - 3600000 * 12,
  },
  {
    id: 'note-3',
    author: 'Wayfarer Jonas',
    message: 'Stood here at twilight. The horizon looks like molten gold. May whoever finds this note find peace.',
    location: 'Sunset Outlook',
    timestamp: Date.now() - 3600000 * 3,
  },
];

const activePresences = new Map<string, PlayerPresence>();

// Clean up stale sessions every 30 seconds
setInterval(() => {
  const cutoff = Date.now() - 45000;
  for (const [id, player] of activePresences.entries()) {
    if (player.lastSeen < cutoff) {
      activePresences.delete(id);
    }
  }
}, 15000);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;
  app.use(express.json());

  // Health check endpoint
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({
      status: 'online',
      game: 'Whispering Horizons',
      version: '1.0.0-prototype',
      timestamp: Date.now(),
      activeExplorers: activePresences.size,
    });
  });

  // Visitor log / drift bottle notes API
  app.get('/api/island/notes', (_req: Request, res: Response) => {
    res.json({ notes: visitorNotes });
  });

  app.post('/api/island/notes', (req: Request, res: Response) => {
    const { author, message, location } = req.body;
    if (!message || typeof message !== 'string') {
      res.status(400).json({ error: 'Message is required' });
      return;
    }
    const newNote: VisitorNote = {
      id: `note-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      author: (author && String(author).trim()) || 'Nameless Wanderer',
      message: message.trim().slice(0, 300),
      location: (location && String(location).trim()) || 'Whispering Coast',
      timestamp: Date.now(),
    };
    visitorNotes.unshift(newNote);
    if (visitorNotes.length > 50) visitorNotes.pop();
    res.status(201).json({ success: true, note: newNote });
  });

  // Player presence heartbeat API for future multiplayer
  app.post('/api/island/presence', (req: Request, res: Response) => {
    const { id, name, x, z } = req.body;
    if (!id) {
      res.status(400).json({ error: 'Player ID required' });
      return;
    }
    const presence: PlayerPresence = {
      id: String(id),
      name: (name && String(name).slice(0, 24)) || 'Explorer',
      x: typeof x === 'number' ? x : 0,
      z: typeof z === 'number' ? z : 0,
      lastSeen: Date.now(),
    };
    activePresences.set(presence.id, presence);

    const otherPlayers = Array.from(activePresences.values()).filter(p => p.id !== id);
    res.json({
      success: true,
      playersOnline: activePresences.size,
      otherPlayers,
    });
  });

  // Mount Vite or serve production build
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Whispering Horizons server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
