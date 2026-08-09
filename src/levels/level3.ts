import type { LevelDefinition } from '../types';

// Level 3 — School Uniform
// More rooms, tighter corridors
const MAZE: number[][] = [
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 1, 0, 0, 1, 1, 1, 0, 0, 1, 0, 0, 1, 1, 1, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1],
  [1, 1, 1, 0, 1, 1, 0, 0, 0, 1, 0, 1, 0, 0, 1, 1, 0, 1, 1, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 1, 1, 1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 1, 1, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 1, 0, 1, 1, 1, 0, 1, 0, 0, 0, 0, 1, 0, 1, 1, 1, 0, 1, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
];

export const level3: LevelDefinition = {
  id: 3,
  name: 'School Uniform',
  maze: MAZE,
  playerStart: { col: 1, row: 2 },
  dogStart: { col: 18, row: 2 },
  gate: { col: 10, row: 13 },
  tasks: [
    { id: 'get-dressed',     label: 'Get dressed',    emoji: '\u{1F455}', col: 3,  row: 1  },
    { id: 'brush-teeth',     label: 'Brush teeth',    emoji: '\u{1FAA5}', col: 17, row: 1  },
    { id: 'make-breakfast',  label: 'Make breakfast', emoji: '\u{1F373}', col: 1,  row: 9  },
    { id: 'eat-breakfast',   label: 'Eat breakfast',  emoji: '\u{1F963}', col: 5,  row: 9  },
    { id: 'pack-school-bag', label: 'Pack bag',       emoji: '\u{1F392}', col: 13, row: 9  },
    { id: 'put-on-shoes',    label: 'Shoes on',       emoji: '\u{1F45F}', col: 17, row: 12 },
  ],
  startingTimeSeconds: 50,
  dogStepMs: 460,
};
