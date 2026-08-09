export type MorningTask =
  | 'get-out-of-bed'
  | 'toilet'
  | 'wash'
  | 'brush-teeth'
  | 'get-dressed'
  | 'make-breakfast'
  | 'eat-breakfast'
  | 'pack-school-bag'
  | 'put-on-shoes';

export type GameState = 'playing' | 'dog_awake' | 'won' | 'lost';

export interface GridPos {
  col: number;
  row: number;
}

export interface TaskDefinition {
  id: MorningTask;
  label: string;
  emoji: string;
  col: number;
  row: number;
}

export interface LevelDefinition {
  id: number;
  name: string;
  maze: number[][];
  playerStart: GridPos;
  dogStart: GridPos;
  gate: GridPos;
  tasks: TaskDefinition[];
  startingTimeSeconds: number;
  dogStepMs: number;
}
