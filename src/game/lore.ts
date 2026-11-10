import { Landmark } from './types';

export const ISLAND_LANDMARKS: Landmark[] = [
  {
    id: 'dock-note',
    title: 'Pelican Cove Pier',
    subtitle: 'Where the gentle harbor tide meets weathered timber',
    x: 0,
    z: 50,
    radius: 3.8,
    actionType: 'read',
    promptLabel: 'Read Drift Journal',
    noteContent: {
      header: 'The Salted Ledger',
      body: `The ocean carries quiet moments here.\n\n` +
            `We stepped ashore as the morning sea mist was just lifting. ` +
            `The air smells of fresh cedar, mountain spruce, and sunlit sea salt. ` +
            `There are no deadlines on this shore, only the sound of waves washing against the stones. ` +
            `Take your time, wander the hillside paths, and listen to the horizon.`,
      author: 'Alistair, Wayfarer',
      date: 'Autumn Equinox',
    },
  },
  {
    id: 'shrine-note',
    title: 'The Whisper Shrine',
    subtitle: 'A serene mossy sanctuary in the wildflower glade',
    x: -22,
    z: 12,
    radius: 3.8,
    actionType: 'read',
    promptLabel: 'Contemplate Shrine',
    noteContent: {
      header: 'Echoes of the Valley',
      body: `Listen closely when the breeze sweeps through the archway.\n\n` +
            `Centuries ago, travelers stopped here simply to sit among the bluebells and ferns. ` +
            `The azure crystal caught the light of the setting sun, glowing like a piece of the sky brought down to earth. ` +
            `Rest your feet for a moment before following the stream up toward the cliffs.`,
      author: 'Ancient Inscription',
      date: 'Times Long Past',
    },
  },
  {
    id: 'waterfall-note',
    title: 'Emerald Cascade',
    subtitle: 'Pure freshwater rushing over cliffs into the turquoise sea',
    x: 42,
    z: 11,
    radius: 4.2,
    actionType: 'read',
    promptLabel: 'Listen to the Cascade',
    noteContent: {
      header: 'Song of the Mountain Spring',
      body: `The water here begins in the high inland springs, ` +
            `meanders through mossy gravel, and leaps out into the open sky. ` +
            `In the evening golden hour, tiny rainbows dance in the rising mist. ` +
            `The coolness in the air refreshes the mind like nothing else.`,
      author: 'Elena, Naturalist',
      date: 'Midsummer',
    },
  },
  {
    id: 'sunset-note',
    title: "Falcon's Perch",
    subtitle: 'A quiet cedar bench and campfire facing the endless western horizon',
    x: -16,
    z: -26,
    radius: 4.0,
    actionType: 'sit',
    promptLabel: 'Sit & Watch Sunset',
    noteContent: {
      header: "Horizon Watcher's Reflections",
      body: `There is no sight on earth quite like the ocean at sunset.\n\n` +
            `The golden light stretches across the water like molten copper, ` +
            `softening every edge and bringing peace to anyone who pauses to watch. ` +
            `Warm yourself by the fire, watch the gulls soar along the cliff drafts, ` +
            `and let the rhythm of the tide wash away the noise of the world.`,
      author: 'Theron, Keeper of the Perch',
      date: 'Golden Hour',
    },
  },
  {
    id: 'lighthouse-note',
    title: 'The Summit Lighthouse',
    subtitle: 'The timeless guiding beacon atop the island peak',
    x: 18,
    z: -27,
    radius: 4.5,
    actionType: 'read',
    promptLabel: 'Read Beacon Log',
    noteContent: {
      header: 'The Keeper’s Musings',
      body: `From this high gallery, you can see the entire curve of the world.\n\n` +
            `Below lies the quiet cove, the winding dirt path, the emerald cascade, ` +
            `and the endless, breathing ocean stretching to the stars. ` +
            `As dusk descends, the rotating golden beam cuts through the twilight haze, ` +
            `a steadfast beacon of warmth in the quiet night.`,
      author: 'Jonathan, Beacon Keeper',
      date: 'Evening Watch',
    },
  },
];
