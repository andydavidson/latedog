import type { LevelDefinition } from '../types';

// Level 4 — The Full Morning
// Most complex maze, all tasks, fast dog
const MAZE: number[][] = [
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1],
  [1, 0, 1, 1, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 1, 1, 0, 1],
  [1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 1],
  [1, 0, 1, 0, 0, 1, 1, 0, 1, 0, 0, 1, 0, 0, 1, 1, 1, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 1, 1, 0, 0, 1, 1, 0, 0, 0, 0, 1, 1, 0, 0, 1, 1, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 1, 1, 0, 1, 0, 1, 1, 0, 0, 0, 0, 1, 1, 0, 1, 0, 1, 1, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
];

export const level4: LevelDefinition = {
  id: 4,
  name: 'The Full Morning',
  maze: MAZE,
  playerStart: { col: 1, row: 2 },
  dogStart: { col: 18, row: 13 },
  gate: { col: 10, row: 13 },
  tasks: [
    { id: 'toilet',          label: 'Toilet',         emoji: '\u{1F6BD}', col: 1,  row: 1  },
    { id: 'wash',            label: 'Have a wash',    emoji: '\u{1F9FC}', col: 14, row: 1  },
    { id: 'get-dressed',     label: 'Get dressed',    emoji: '\u{1F455}', col: 1,  row: 8  },
    { id: 'brush-teeth',     label: 'Brush teeth',    emoji: '\u{1FAA5}', col: 18, row: 4  },
    { id: 'make-breakfast',  label: 'Make breakfast', emoji: '\u{1F373}', col: 1,  row: 10 },
    { id: 'eat-breakfast',   label: 'Eat breakfast',  emoji: '\u{1F963}', col: 5,  row: 10 },
    { id: 'pack-school-bag', label: 'Pack bag',       emoji: '\u{1F392}', col: 14, row: 10 },
    { id: 'put-on-shoes',    label: 'Shoes on',       emoji: '\u{1F45F}', col: 18, row: 8  },
  ],
  startingTimeSeconds: 45,
  dogStepMs: 330,
};
