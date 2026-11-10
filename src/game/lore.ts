import { Landmark } from './types';

export const ISLAND_LANDMARKS: Landmark[] = [
  {
    id: 'dock-note',
    title: 'Pelican Cove Pier',
    subtitle: 'Where travelers first set foot upon the island',
    x: 0,
    z: 48,
    radius: 3.5,
    unlocked: false,
    noteContent: {
      header: 'The Salted Ledger — Entry I',
      body: `May the tides carry this message safely to who follows.\n\n` +
            `We moored our vessel at the sheltered southern cove at sunrise. ` +
            `The air smells vividly of wild thyme, spruce needles, and cool sea spray. ` +
            `High above the central ridge, the white tower of the beacon stands sentinel. ` +
            `Follow the carved cobblestone path up the slope—it will keep your footing sure across the hillside.`,
      author: 'Captain Alistair Graves',
      date: '14th of Harvest Tide',
    },
  },
  {
    id: 'shrine-note',
    title: 'The Whisper Shrine',
    subtitle: 'Ancient stone monoliths humming with coastal resonance',
    x: -18,
    z: 8,
    radius: 3.5,
    unlocked: false,
    noteContent: {
      header: 'Rune of the Whispering Tide',
      body: `The island was named Whispering Horizons not for the wind alone, ` +
            `but for the echoes caught within this hollow valley. ` +
            `When twilight settles, the floating azure crystal reflects the distant lighthouse beam. ` +
            `The elders spoke of a peaceful sanctuary where wanderers find clarity. Take a breath here before continuing upward.`,
      author: 'Scholar Vaelin',
      date: 'Antiquity',
    },
  },
  {
    id: 'waterfall-note',
    title: 'Emerald Cascade',
    subtitle: 'A freshwater torrent plunging dramatically into the sea',
    x: 42,
    z: 9,
    radius: 4.0,
    unlocked: false,
    noteContent: {
      header: 'The Hidden Spring',
      body: `The freshwater spring carves through the eastern granite cliffs, ` +
            `tumbling fifty paces down into the emerald sea. ` +
            `Rainbows arch in the rising mist during golden hour. ` +
            `Many sailors believe bathing in the upper mountain pool grants good fortune upon long ocean voyages.`,
      author: 'Elena Vance, Cartographer',
      date: 'Summer Solstice',
    },
  },
  {
    id: 'sunset-note',
    title: "Falcon's Perch",
    subtitle: 'A quiet cedar bench overlooking the boundless western horizon',
    x: -15,
    z: -25,
    radius: 3.5,
    unlocked: false,
    noteContent: {
      header: "Horizon Watcher's Journal",
      body: `If you sit here as the sun dips below the ocean line, ` +
            `the world transforms into ribbons of amber, rose, and violet velvet. ` +
            `No storms can reach the soul from this cliff. ` +
            `I have watched migrating sea birds pass westward for forty years, and every evening feels like a rebirth.`,
      author: 'Theron the Watcher',
      date: 'Autumn Equinox',
    },
  },
  {
    id: 'lighthouse-note',
    title: 'The Summit Lighthouse',
    subtitle: 'The grand guiding flame atop the island peak',
    x: 18,
    z: -26,
    radius: 4.2,
    unlocked: false,
    noteContent: {
      header: "The Keeper's Final Log",
      body: `The brass gears are oiled, the lens polished to perfection. ` +
            `Its sweeping golden beam now cuts through fifty leagues of ocean darkness. ` +
            `To you who climbed the switchbacks and reached the island's pinnacle: ` +
            `you are now a guardian of Whispering Horizons. Never let the flame extinguish.`,
      author: 'Master Keeper Jonathan Oakes',
      date: 'First Light',
    },
  },
];

const STORAGE_KEY = 'whispering_horizons_discovered_notes_v1';

export function loadDiscoveredNotes(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn('Could not load saved notes:', e);
  }
  return [];
}

export function saveDiscoveredNotes(notes: string[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
  } catch (e) {
    console.warn('Could not save notes:', e);
  }
}

export function resetDiscoveredNotes() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.warn('Could not reset notes:', e);
  }
}
