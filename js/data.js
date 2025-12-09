/**
 * What Nature Says - Content Data
 * All 12 elements with their properties
 */

const ELEMENTS = [
  {
    id: 'dragonfly',
    name: 'Dragonfly',
    adjective: 'dashing',
    verbs: ['flits', 'flutters', 'floats'],
    question: 'When Dragonfly flits, flutters, and floats... what does dashing Dragonfly say?',
    funFact: 'Dragonflies are more successful at catching their prey than lions or sharks!',
    color: '#4fc3f7',
    colorLight: '#b3e5fc',
    emoji: '🪰'
  },
  {
    id: 'river',
    name: 'River',
    adjective: 'rambly',
    verbs: ['burbles', 'gurgles', 'prattles'],
    question: 'As River burbles, gurgles, and prattles... what does rambly River say?',
    funFact: 'Rivers are like the veins in our body. They circulate nutrients and carry living organisms.',
    color: '#4dd0e1',
    colorLight: '#b2ebf2',
    emoji: '🏞️'
  },
  {
    id: 'mushroom',
    name: 'Mushroom',
    adjective: 'miraculous',
    verbs: ['links', 'feeds', 'heals'],
    question: 'When Mushroom links, feeds, and heals... what does miraculous Mushroom say?',
    funFact: 'Mushrooms connect trees underground in a network called the "wood wide web" so they can share food and messages!',
    color: '#a1887f',
    colorLight: '#d7ccc8',
    emoji: '🍄'
  },
  {
    id: 'frog',
    name: 'Frog',
    adjective: 'frolicking',
    verbs: ['croaks', 'grunts', 'ribbits'],
    question: 'As Frog croaks, grunts, and ribbits... what does frolicking Frog say?',
    funFact: 'Frogs press food down their throats with their bulgy eyes and absorb water through their skin!',
    color: '#81c784',
    colorLight: '#c8e6c9',
    emoji: '🐸'
  },
  {
    id: 'ocean',
    name: 'Ocean',
    adjective: 'opulent',
    verbs: ['laps', 'slaps', 'roars'],
    question: 'When Ocean laps, slaps, and roars... what does opulent Ocean say?',
    funFact: 'Ocean alters the weather all around the world!',
    color: '#0288d1',
    colorLight: '#81d4fa',
    emoji: '🌊'
  },
  {
    id: 'hummingbird',
    name: 'Hummingbird',
    adjective: 'hovering',
    verbs: ['beats', 'darts', 'shakes'],
    question: 'When Hummingbird beats, darts, and shakes... what does hovering Hummingbird say?',
    funFact: 'Hummingbirds are the only bird who can fly backwards!',
    color: '#e91e63',
    colorLight: '#f8bbd9',
    emoji: '🐦'
  },
  {
    id: 'sun',
    name: 'Sun',
    adjective: 'shining',
    verbs: ['shimmers', 'glimmers', 'glistens'],
    question: 'As Sun shimmers, glimmers, and glistens... what does shining Sun say?',
    funFact: 'Sun brings planets, comets, and asteroids with it as it orbits the center of the Milky Way!',
    color: '#ffb300',
    colorLight: '#ffe082',
    emoji: '☀️'
  },
  {
    id: 'waterfall',
    name: 'Waterfall',
    adjective: 'wonderous',
    verbs: ['spurts', 'splashes', 'pools'],
    question: 'When Waterfall spurts, splashes, and pools... what does wonderous Waterfall say?',
    funFact: 'Angel Waterfall is so high that when the weather turns warm, the water turns to mist before reaching the pool below!',
    color: '#00bcd4',
    colorLight: '#80deea',
    emoji: '💧'
  },
  {
    id: 'dolphin',
    name: 'Dolphin',
    adjective: 'dancing',
    verbs: ['jumps', 'swims', 'plays'],
    question: 'As Dolphin jumps, swims, and plays... what does dancing Dolphin say?',
    funFact: 'Pink dolphins dance in the Amazon River!',
    color: '#7986cb',
    colorLight: '#c5cae9',
    emoji: '🐬'
  },
  {
    id: 'star',
    name: 'Star',
    adjective: 'sparkly',
    verbs: ['twinkles', 'blinks', 'shines'],
    question: 'When Star twinkles, blinks, and shines... what does sparkly Star say?',
    funFact: "Stars appear to twinkle as their light passes through the many differing densities in the layers of Earth's atmosphere.",
    color: '#ffd54f',
    colorLight: '#fff9c4',
    emoji: '⭐'
  },
  {
    id: 'tree',
    name: 'Tree',
    adjective: 'towering',
    verbs: ['stretches', 'breathes', 'sways'],
    question: 'When Tree stretches, breathes, and sways... what does towering Tree say?',
    funFact: 'Trees use the wood wide web to talk to each other underground!',
    color: '#558b2f',
    colorLight: '#aed581',
    emoji: '🌳'
  },
  {
    id: 'you',
    name: 'You',
    adjective: 'amazing',
    verbs: ['cry', 'laugh', 'tumble'],
    question: 'When You cry, laugh, and tumble... what does amazing You say?',
    funFact: 'Children can learn to speak other languages faster than adults do!',
    color: '#9b87c7',
    colorLight: '#c4b8db',
    emoji: '✨'
  }
];

// Drawing colors for the canvas
const DRAWING_COLORS = [
  { name: 'Green', value: '#7cb342' },
  { name: 'Blue', value: '#64b5f6' },
  { name: 'Purple', value: '#9b87c7' },
  { name: 'Gold', value: '#ffd54f' },
  { name: 'Pink', value: '#f48fb1' },
  { name: 'Brown', value: '#8d6e63' }
];

// Export for use in app.js
window.ELEMENTS = ELEMENTS;
window.DRAWING_COLORS = DRAWING_COLORS;
