import type { LevelDefinition, TaskDefinition, GridPos } from '../types';

const COLS = 20;
const ROWS = 15;
export const MAX_LEVEL = 13;

const ALL_TASK_DEFS: Omit<TaskDefinition, 'col' | 'row'>[] = [
  { id: 'toilet',          label: 'Toilet',         emoji: '\u{1F6BD}' },
  { id: 'wash',            label: 'Have a wash',    emoji: '\u{1F9FC}' },
  { id: 'get-dressed',     label: 'Get dressed',    emoji: '\u{1F455}' },
  { id: 'brush-teeth',     label: 'Brush teeth',    emoji: '\u{1FAA5}' },
  { id: 'make-breakfast',  label: 'Make breakfast', emoji: '\u{1F373}' },
  { id: 'eat-breakfast',   label: 'Eat breakfast',  emoji: '\u{1F963}' },
  { id: 'pack-school-bag', label: 'Pack bag',       emoji: '\u{1F392}' },
  { id: 'put-on-shoes',    label: 'Shoes on',       emoji: '\u{1F45F}' },
];

function posKey(p: GridPos): string {
  return `${p.col},${p.row}`;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// BFS from `start` — returns true if every position in `targets` is reachable.
function allReachable(maze: number[][], targets: GridPos[], start: GridPos): boolean {
  if (maze[start.row][start.col] === 1) return false;

  const visited = new Set<string>([posKey(start)]);
  const queue: GridPos[] = [start];
  const dirs: GridPos[] = [
    { col: 1, row: 0 }, { col: -1, row: 0 },
    { col: 0, row: 1 }, { col: 0, row: -1 },
  ];

  while (queue.length > 0) {
    const pos = queue.shift()!;
    for (const d of dirs) {
      const next: GridPos = { col: pos.col + d.col, row: pos.row + d.row };
      const key = posKey(next);
      if (
        next.col >= 0 && next.col < COLS &&
        next.row >= 0 && next.row < ROWS &&
        maze[next.row][next.col] !== 1 &&
        !visited.has(key)
      ) {
        visited.add(key);
        queue.push(next);
      }
    }
  }

  return targets.every(t => visited.has(posKey(t)));
}

// Pick `count` spread-out interior positions, avoiding `forbidden` keys.
function pickSpreadPositions(count: number, forbidden: Set<string>): GridPos[] {
  const positions: GridPos[] = [];
  const used = new Set<string>(forbidden);

  // Build shuffled pool of interior positions (leave a 1-tile gap from border
  // so tasks don't sit right against the wall — looks nicer).
  const pool: GridPos[] = [];
  for (let r = 2; r < ROWS - 2; r++) {
    for (let c = 2; c < COLS - 2; c++) {
      if (!used.has(`${c},${r}`)) pool.push({ col: c, row: r });
    }
  }
  const shuffled = shuffle(pool);

  // First pass: enforce Manhattan distance ≥ 4 between tasks.
  for (const pos of shuffled) {
    if (positions.length >= count) break;
    if (used.has(posKey(pos))) continue;
    const tooClose = positions.some(
      p => Math.abs(p.col - pos.col) + Math.abs(p.row - pos.row) < 4
    );
    if (!tooClose) {
      used.add(posKey(pos));
      positions.push(pos);
    }
  }

  // Fallback: fill remaining slots ignoring spread constraint.
  if (positions.length < count) {
    for (const pos of shuffled) {
      if (positions.length >= count) break;
      if (!used.has(posKey(pos))) {
        used.add(posKey(pos));
        positions.push(pos);
      }
    }
  }

  return positions;
}

export function generateLevel(levelNumber: number): LevelDefinition {
  const playerStart: GridPos = { col: 1, row: 1 };
  const gate: GridPos        = { col: 18, row: 13 };
  const dogStart: GridPos    = { col: 18, row: 1 };

  const protectedKeys = new Set([posKey(playerStart), posKey(gate), posKey(dogStart)]);

  // Place all 8 task positions randomly.
  const taskPositions = pickSpreadPositions(8, protectedKeys);
  const tasks: TaskDefinition[] = ALL_TASK_DEFS.map((def, i) => ({
    ...def,
    col: taskPositions[i]?.col ?? 2 + i,
    row: taskPositions[i]?.row ?? 2,
  }));

  // All positions that must remain mutually reachable.
  const important: GridPos[] = [playerStart, gate, dogStart, ...taskPositions];

  // Start with an open grid (only border walls).
  const maze: number[][] = Array.from({ length: ROWS }, (_, r) =>
    Array.from({ length: COLS }, (_, c) =>
      r === 0 || r === ROWS - 1 || c === 0 || c === COLS - 1 ? 1 : 0
    )
  );

  // Wall density rises with level.
  // Level 4 (hand-crafted) is roughly 23% interior walls; level 5 starts just
  // above that so there is no backward step in complexity.
  const density = Math.min(0.52, 0.27 + (levelNumber - 5) * 0.03);

  // Build candidate list: interior tiles that aren't protected or task positions.
  const taskKeys = new Set(taskPositions.map(posKey));
  const candidates: GridPos[] = [];
  for (let r = 1; r < ROWS - 1; r++) {
    for (let c = 1; c < COLS - 1; c++) {
      const key = `${c},${r}`;
      if (!protectedKeys.has(key) && !taskKeys.has(key)) {
        candidates.push({ col: c, row: r });
      }
    }
  }

  const wallTarget = Math.floor(candidates.length * density);
  let placed = 0;

  for (const pos of shuffle(candidates)) {
    if (placed >= wallTarget) break;
    maze[pos.row][pos.col] = 1;
    if (allReachable(maze, important, playerStart)) {
      placed++;
    } else {
      maze[pos.row][pos.col] = 0; // revert — connectivity would break
    }
  }

  const startingTimeSeconds = Math.max(15, 45 - (levelNumber - 5) * 3);
  const dogStepMs           = Math.max(180, 330 - (levelNumber - 4) * 18);

  const levelName =
    levelNumber === MAX_LEVEL ? 'The Final Morning!' : `Day ${levelNumber}`;

  return {
    id: levelNumber,
    name: levelName,
    maze,
    playerStart,
    dogStart,
    gate,
    tasks,
    startingTimeSeconds,
    dogStepMs,
  };
}
