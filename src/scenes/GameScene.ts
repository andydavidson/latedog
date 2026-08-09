import Phaser from 'phaser';
import type { LevelDefinition, GameState, GridPos, TaskDefinition } from '../types';
import { ALL_LEVELS } from '../levels/index';
import { playBark } from '../audio/bark';

const TILE = 40;
const HEADER_H = 70;
const COLS = 20;
const ROWS = 15;
const MOVE_COOLDOWN_MS = 140;

const C_FLOOR     = 0xfff5dc;
const C_WALL      = 0x3d2b1f;
const C_WALL_TOP  = 0x5c4033;
const C_TASK_GLOW = 0xffee88;
const C_GATE_GLOW = 0x88ffaa;
const C_BED_GLOW  = 0xffccee;
const C_HEADER_BG = 0x1a1040;

function tileToPixel(col: number, row: number): { x: number; y: number } {
  return {
    x: col * TILE + TILE / 2,
    y: HEADER_H + row * TILE + TILE / 2,
  };
}

function bfsPath(maze: number[][], from: GridPos, to: GridPos): GridPos[] {
  const rows = maze.length;
  const cols = maze[0].length;
  const key = (p: GridPos) => `${p.col},${p.row}`;
  const visited = new Set<string>([key(from)]);
  const queue: Array<{ pos: GridPos; path: GridPos[] }> = [{ pos: from, path: [from] }];
  const dirs: GridPos[] = [
    { col: 1, row: 0 }, { col: -1, row: 0 },
    { col: 0, row: 1 }, { col: 0, row: -1 },
  ];
  while (queue.length > 0) {
    const { pos, path } = queue.shift()!;
    if (pos.col === to.col && pos.row === to.row) return path;
    for (const d of dirs) {
      const next: GridPos = { col: pos.col + d.col, row: pos.row + d.row };
      if (
        next.col >= 0 && next.col < cols &&
        next.row >= 0 && next.row < rows &&
        maze[next.row][next.col] !== 1 &&
        !visited.has(key(next))
      ) {
        visited.add(key(next));
        queue.push({ pos: next, path: [...path, next] });
      }
    }
  }
  return [];
}

export class GameScene extends Phaser.Scene {
  private level!: LevelDefinition;
  private levelNumber = 1;
  private gameState: GameState = 'playing';
  private completedTasks: Set<string> = new Set();
  private timeRemaining = 0;

  private playerCol = 0;
  private playerRow = 0;
  private dogCol = 0;
  private dogRow = 0;
  private isMoving = false;
  private moveCooldown = 0;

  private playerSprite!: Phaser.GameObjects.Text;
  private dogSprite!: Phaser.GameObjects.Text;
  private dogZzz!: Phaser.GameObjects.Text;
  private dogZzzTween!: Phaser.Tweens.Tween;
  private taskMarkers: Map<string, Phaser.GameObjects.Container> = new Map();

  private timerText!: Phaser.GameObjects.Text;
  private timerIcon!: Phaser.GameObjects.Text;
  private taskListItems: Phaser.GameObjects.Text[] = [];
  private dogStatusText!: Phaser.GameObjects.Text;

  // Overlay elements stored separately (Container depth issue workaround)
  private overlayBg!: Phaser.GameObjects.Rectangle;
  private overlayTitle!: Phaser.GameObjects.Text;
  private overlaySubtitle!: Phaser.GameObjects.Text;
  private overlayBtnBg!: Phaser.GameObjects.Rectangle;
  private overlayBtnLabel!: Phaser.GameObjects.Text;

  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keyW!: Phaser.Input.Keyboard.Key;
  private keyA!: Phaser.Input.Keyboard.Key;
  private keyS!: Phaser.Input.Keyboard.Key;
  private keyD!: Phaser.Input.Keyboard.Key;

  private countdownEvent!: Phaser.Time.TimerEvent;
  private dogMoveEvent!: Phaser.Time.TimerEvent;
  private periodicBarkEvent!: Phaser.Time.TimerEvent;

  private dpadDx = 0;
  private dpadDy = 0;

  constructor() {
    super({ key: 'GameScene' });
  }

  init(data: { levelNumber?: number }) {
    this.levelNumber = data.levelNumber ?? 1;
  }

  create() {
    this.level = ALL_LEVELS[this.levelNumber - 1] ?? ALL_LEVELS[0];
    this.gameState = 'playing';
    this.completedTasks = new Set();
    this.timeRemaining = this.level.startingTimeSeconds;
    this.playerCol = this.level.playerStart.col;
    this.playerRow = this.level.playerStart.row;
    this.dogCol = this.level.dogStart.col;
    this.dogRow = this.level.dogStart.row;
    this.isMoving = false;
    this.moveCooldown = 0;
    this.dpadDx = 0;
    this.dpadDy = 0;
    this.taskMarkers = new Map();

    this.drawMaze();
    this.createGateMarker();
    this.createTaskMarkers();
    this.createBedIndicator();
    this.createDog();
    this.createPlayer();
    this.createHeader();
    this.createDpad();
    this.createOverlay();
    this.setupInput();
    this.startCountdown();
    this.startDogMovement();
  }

  update(_time: number, delta: number) {
    if (this.gameState !== 'playing' && this.gameState !== 'dog_awake') return;
    if (this.isMoving) return;

    this.moveCooldown -= delta;
    if (this.moveCooldown > 0) return;

    let dx = 0;
    let dy = 0;

    if      (this.cursors.left.isDown  || this.keyA.isDown) dx = -1;
    else if (this.cursors.right.isDown || this.keyD.isDown) dx =  1;
    else if (this.cursors.up.isDown    || this.keyW.isDown) dy = -1;
    else if (this.cursors.down.isDown  || this.keyS.isDown) dy =  1;
    else if (this.dpadDx !== 0) dx = this.dpadDx;
    else if (this.dpadDy !== 0) dy = this.dpadDy;

    if (dx !== 0 || dy !== 0) this.tryMovePlayer(dx, dy);
  }

  // ─── Maze ────────────────────────────────────────────────────────────────

  private drawMaze() {
    const maze = this.level.maze;
    const gfx = this.add.graphics();
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        const px = col * TILE;
        const py = HEADER_H + row * TILE;
        if (maze[row][col] === 1) {
          gfx.fillStyle(C_WALL, 1);
          gfx.fillRect(px, py, TILE, TILE);
          gfx.fillStyle(C_WALL_TOP, 1);
          gfx.fillRect(px, py, TILE, 5);
        } else {
          gfx.fillStyle(C_FLOOR, 1);
          gfx.fillRect(px, py, TILE, TILE);
          gfx.lineStyle(1, 0xe8ddc8, 0.35);
          gfx.strokeRect(px, py, TILE, TILE);
        }
      }
    }
  }

  private createBedIndicator() {
    const { x, y } = tileToPixel(this.level.playerStart.col, this.level.playerStart.row);
    const gfx = this.add.graphics();
    gfx.fillStyle(C_BED_GLOW, 1);
    gfx.fillRoundedRect(x - TILE / 2 + 2, y - TILE / 2 + 2, TILE - 4, TILE - 4, 6);
    this.add.text(x, y, '\u{1F6CF}', { fontSize: '26px' }).setOrigin(0.5);
  }

  private createGateMarker() {
    const { x, y } = tileToPixel(this.level.gate.col, this.level.gate.row);
    const gfx = this.add.graphics();
    gfx.fillStyle(C_GATE_GLOW, 1);
    gfx.fillRoundedRect(x - TILE / 2 + 2, y - TILE / 2 + 2, TILE - 4, TILE - 4, 6);
    const icon = this.add.text(x, y, '\u{1F3EB}', { fontSize: '26px' }).setOrigin(0.5);
    this.tweens.add({
      targets: icon, scaleX: 1.15, scaleY: 1.15,
      duration: 700, yoyo: true, repeat: -1,
    });
  }

  private createTaskMarkers() {
    for (const task of this.level.tasks) {
      const { x, y } = tileToPixel(task.col, task.row);
      const gfx = this.add.graphics();
      gfx.fillStyle(C_TASK_GLOW, 1);
      gfx.fillRoundedRect(x - TILE / 2 + 2, y - TILE / 2 + 2, TILE - 4, TILE - 4, 6);
      const icon = this.add.text(x, y, task.emoji, { fontSize: '26px' }).setOrigin(0.5);
      const container = this.add.container(0, 0, [gfx, icon]);
      this.taskMarkers.set(task.id, container);
    }
  }

  // ─── Entities ────────────────────────────────────────────────────────────

  private createPlayer() {
    const { x, y } = tileToPixel(this.playerCol, this.playerRow);
    this.playerSprite = this.add.text(x, y, '\u{1F9D2}', { fontSize: '30px' })
      .setOrigin(0.5).setDepth(10);
  }

  private createDog() {
    const { x, y } = tileToPixel(this.dogCol, this.dogRow);
    this.dogSprite = this.add.text(x, y, '\u{1F415}', { fontSize: '30px' })
      .setOrigin(0.5).setDepth(10);

    this.dogZzz = this.add.text(x + 16, y - 16, 'z z z', {
      fontSize: '11px', color: '#aaaaee', fontStyle: 'italic',
    }).setOrigin(0.5).setDepth(11);

    this.dogZzzTween = this.tweens.add({
      targets: this.dogZzz, alpha: 0, duration: 800, yoyo: true, repeat: -1,
    });
  }

  // ─── Header ──────────────────────────────────────────────────────────────

  private createHeader() {
    const W = COLS * TILE;
    this.add.rectangle(0, 0, W, HEADER_H, C_HEADER_BG).setOrigin(0, 0).setDepth(20);
    this.add.rectangle(0, HEADER_H - 3, W, 3, 0xff8c00).setOrigin(0, 0).setDepth(21);

    // Level label — left
    this.add.text(12, HEADER_H / 2, `LVL ${this.levelNumber}`, {
      fontSize: '14px', fontStyle: 'bold',
      color: '#ffaa00', fontFamily: 'monospace',
    }).setOrigin(0, 0.5).setDepth(21);

    // Timer — next to level
    this.timerIcon = this.add.text(72, HEADER_H / 2, '\u{1F550}', { fontSize: '24px' })
      .setOrigin(0, 0.5).setDepth(21);

    this.timerText = this.add.text(104, HEADER_H / 2, this.formatTime(this.timeRemaining), {
      fontSize: '26px', fontFamily: 'monospace', color: '#ffffff', fontStyle: 'bold',
    }).setOrigin(0, 0.5).setDepth(21);

    // Dog status — right
    this.dogStatusText = this.add.text(W - 12, HEADER_H / 2, '\u{1F4A4} Sleeping', {
      fontSize: '17px', color: '#aaaaee',
    }).setOrigin(1, 0.5).setDepth(21);

    this.rebuildTaskListUI();
  }

  private rebuildTaskListUI() {
    for (const t of this.taskListItems) t.destroy();
    this.taskListItems = [];

    // Task list centred — but with many tasks in level 4, use smaller font
    const maxTasks = this.level.tasks.length;
    const fontSize = maxTasks <= 4 ? '20px' : maxTasks <= 6 ? '18px' : '15px';
    const spacing  = maxTasks <= 4 ? 16    : maxTasks <= 6 ? 12    : 8;

    let totalWidth = 0;
    const labels: string[] = this.level.tasks.map(task => {
      const done = this.completedTasks.has(task.id);
      return `${task.emoji}${done ? '\u2705' : '\u25A1'}`;
    });

    // Measure first
    const tempText = this.add.text(-1000, -1000, labels[0] ?? '', { fontSize }).setVisible(false);
    const itemWidth = tempText.width + spacing;
    tempText.destroy();
    totalWidth = labels.length * itemWidth;

    let x = (COLS * TILE) / 2 - totalWidth / 2 + 30;

    for (let i = 0; i < this.level.tasks.length; i++) {
      const task = this.level.tasks[i];
      const done = this.completedTasks.has(task.id);
      const item = this.add.text(x, HEADER_H / 2, labels[i], {
        fontSize,
        color: done ? '#88ffaa' : '#ffffff',
      }).setOrigin(0, 0.5).setDepth(21);
      this.taskListItems.push(item);
      x += item.width + spacing;
    }
  }

  private formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60).toString();
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  private updateTimerDisplay() {
    this.timerText.setText(this.formatTime(this.timeRemaining));
    if (this.timeRemaining <= 10)      this.timerText.setColor('#ff4444');
    else if (this.timeRemaining <= 20) this.timerText.setColor('#ffaa44');
    else                               this.timerText.setColor('#ffffff');
  }

  // ─── D-pad ───────────────────────────────────────────────────────────────

  private createDpad() {
    const btnSize = 62;
    const gap = 4;
    const cx = COLS * TILE - btnSize * 1.5 - gap * 2 - 6;
    const cy = HEADER_H + ROWS * TILE - btnSize * 1.5 - gap * 2 - 6;

    const dirs = [
      { dx:  0, dy: -1, label: '\u25B2', ox: 0,           oy: -(btnSize + gap) },
      { dx:  0, dy:  1, label: '\u25BC', ox: 0,           oy:  (btnSize + gap) },
      { dx: -1, dy:  0, label: '\u25C4', ox: -(btnSize + gap), oy: 0 },
      { dx:  1, dy:  0, label: '\u25BA', ox:  (btnSize + gap), oy: 0 },
    ];

    for (const dir of dirs) {
      const bx = cx + dir.ox;
      const by = cy + dir.oy;
      const bg = this.add.rectangle(bx, by, btnSize, btnSize, 0x000000, 0.42)
        .setOrigin(0.5).setDepth(30).setInteractive({ useHandCursor: true });
      this.add.text(bx, by, dir.label, { fontSize: '26px', color: '#ffffff' })
        .setOrigin(0.5).setDepth(31);

      bg.on('pointerdown', () => { this.dpadDx = dir.dx; this.dpadDy = dir.dy; bg.setFillStyle(0xffffff, 0.22); });
      bg.on('pointerup',   () => { this.dpadDx = 0;      this.dpadDy = 0;      bg.setFillStyle(0x000000, 0.42); });
      bg.on('pointerout',  () => { this.dpadDx = 0;      this.dpadDy = 0;      bg.setFillStyle(0x000000, 0.42); });
    }
  }

  // ─── Overlay ─────────────────────────────────────────────────────────────

  private createOverlay() {
    const W = COLS * TILE;
    const H = HEADER_H + ROWS * TILE;
    const cx = W / 2;
    const cy = H / 2;

    this.overlayBg = this.add.rectangle(cx, cy, W, H, 0x000000, 0.72)
      .setDepth(50).setVisible(false);

    this.overlayTitle = this.add.text(cx, cy - 70, '', {
      fontSize: '46px', fontStyle: 'bold', color: '#ffffff',
      stroke: '#000000', strokeThickness: 6,
      align: 'center', wordWrap: { width: W - 60 },
    }).setOrigin(0.5).setDepth(51).setVisible(false);

    this.overlaySubtitle = this.add.text(cx, cy + 10, '', {
      fontSize: '22px', color: '#dddddd', align: 'center',
      wordWrap: { width: W - 80 },
    }).setOrigin(0.5).setDepth(51).setVisible(false);

    this.overlayBtnBg = this.add.rectangle(cx, cy + 110, 280, 62, 0xff6600)
      .setDepth(51).setVisible(false).setInteractive({ useHandCursor: true });
    this.overlayBtnBg.on('pointerover', () => this.overlayBtnBg.setFillStyle(0xffaa00));
    this.overlayBtnBg.on('pointerout',  () => this.overlayBtnBg.setFillStyle(0xff6600));
    this.overlayBtnBg.on('pointerdown', () => this.handleOverlayButton());

    this.overlayBtnLabel = this.add.text(cx, cy + 110, '', {
      fontSize: '24px', fontStyle: 'bold', color: '#ffffff',
    }).setOrigin(0.5).setDepth(52).setVisible(false);
  }

  private showOverlay(title: string, subtitle: string, btnLabel: string) {
    this.overlayBg.setVisible(true);
    this.overlayTitle.setText(title).setVisible(true);
    this.overlaySubtitle.setText(subtitle).setVisible(true);
    this.overlayBtnBg.setVisible(true);
    this.overlayBtnLabel.setText(btnLabel).setVisible(true);
  }

  private handleOverlayButton() {
    if (this.gameState === 'won') {
      const nextLevel = this.levelNumber + 1;
      if (nextLevel <= ALL_LEVELS.length) {
        this.scene.start('GameScene', { levelNumber: nextLevel });
      } else {
        this.scene.start('MenuScene');
      }
    } else {
      // lost — retry same level
      this.scene.start('GameScene', { levelNumber: this.levelNumber });
    }
  }

  // ─── Input ───────────────────────────────────────────────────────────────

  private setupInput() {
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.keyW = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W);
    this.keyA = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.keyS = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S);
    this.keyD = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D);
  }

  // ─── Player movement ─────────────────────────────────────────────────────

  private tryMovePlayer(dx: number, dy: number) {
    if (this.isMoving) return;
    const newCol = this.playerCol + dx;
    const newRow = this.playerRow + dy;
    if (this.isWall(newCol, newRow)) return;

    this.isMoving = true;
    this.moveCooldown = MOVE_COOLDOWN_MS;
    this.playerCol = newCol;
    this.playerRow = newRow;

    const { x, y } = tileToPixel(newCol, newRow);
    this.tweens.add({
      targets: this.playerSprite, x, y, duration: 100, ease: 'Linear',
      onComplete: () => { this.isMoving = false; this.checkPlayerTile(); },
    });
  }

  private isWall(col: number, row: number): boolean {
    const maze = this.level.maze;
    if (col < 0 || col >= COLS || row < 0 || row >= ROWS) return true;
    return maze[row][col] === 1;
  }

  private checkPlayerTile() {
    for (const task of this.level.tasks) {
      if (
        !this.completedTasks.has(task.id) &&
        this.playerCol === task.col &&
        this.playerRow === task.row
      ) {
        this.collectTask(task);
      }
    }

    if (
      this.playerCol === this.level.gate.col &&
      this.playerRow === this.level.gate.row
    ) {
      if (this.completedTasks.size >= this.level.tasks.length) {
        this.onPlayerWon();
      } else {
        this.cameras.main.shake(150, 0.006);
      }
    }

    if (this.playerCol === this.dogCol && this.playerRow === this.dogRow) {
      this.onPlayerCaught();
    }
  }

  private collectTask(task: TaskDefinition) {
    this.completedTasks.add(task.id);

    const marker = this.taskMarkers.get(task.id);
    if (marker) {
      this.tweens.add({
        targets: marker, scaleX: 1.6, scaleY: 1.6, alpha: 0, duration: 280, ease: 'Power2',
        onComplete: () => marker.destroy(),
      });
    }

    this.rebuildTaskListUI();

    const { x, y } = tileToPixel(this.playerCol, this.playerRow);
    const flash = this.add.text(x, y - 20, '\u2B50', { fontSize: '28px' })
      .setOrigin(0.5).setDepth(40);
    this.tweens.add({
      targets: flash, y: y - 64, alpha: 0, duration: 600,
      onComplete: () => flash.destroy(),
    });
  }

  // ─── Timer ───────────────────────────────────────────────────────────────

  private startCountdown() {
    this.countdownEvent = this.time.addEvent({
      delay: 1000,
      repeat: this.level.startingTimeSeconds - 1,
      callback: () => {
        if (this.gameState !== 'playing') return;
        this.timeRemaining = Math.max(0, this.timeRemaining - 1);
        this.updateTimerDisplay();
        if (this.timeRemaining === 0) this.wakeLateDog();
      },
    });
  }

  // ─── Late Dog ────────────────────────────────────────────────────────────

  private startDogMovement() {
    this.dogMoveEvent = this.time.addEvent({
      delay: this.level.dogStepMs,
      loop: true,
      callback: () => {
        if (this.gameState === 'dog_awake') this.stepDogTowardPlayer();
      },
    });
  }

  private wakeLateDog() {
    if (this.gameState !== 'playing') return;
    this.gameState = 'dog_awake';

    // Stop sleeping zzz
    this.dogZzzTween.stop();
    this.dogZzz.setVisible(false);

    this.dogStatusText.setText('\u{1F415} WOOF! WOOF!').setColor('#ff3300');
    this.timerText.setText('LATE!').setColor('#ff2200');
    this.timerIcon.setText('\u{1F6A8}');

    this.cameras.main.shake(450, 0.014);
    this.cameras.main.flash(250, 255, 60, 0);

    // Dog rage animation
    this.tweens.add({
      targets: this.dogSprite,
      scaleX: 1.5, scaleY: 1.5,
      duration: 200, yoyo: true, repeat: 3,
    });

    // Make dog larger when awake
    this.time.delayedCall(800, () => {
      this.tweens.add({
        targets: this.dogSprite, fontSize: '38px',
        scaleX: 1.2, scaleY: 1.2, duration: 400,
      });
    });

    playBark(2);

    // Periodic chase barks every 4 seconds
    this.periodicBarkEvent = this.time.addEvent({
      delay: 4000,
      loop: true,
      callback: () => {
        if (this.gameState === 'dog_awake') playBark(1);
      },
    });
  }

  private stepDogTowardPlayer() {
    if (this.gameState !== 'dog_awake') return;

    const path = bfsPath(
      this.level.maze,
      { col: this.dogCol, row: this.dogRow },
      { col: this.playerCol, row: this.playerRow }
    );
    if (path.length < 2) return;

    const next = path[1];
    this.dogCol = next.col;
    this.dogRow = next.row;

    const { x, y } = tileToPixel(next.col, next.row);
    this.tweens.add({
      targets: this.dogSprite, x, y,
      duration: this.level.dogStepMs * 0.82, ease: 'Linear',
      onComplete: () => {
        if (this.dogCol === this.playerCol && this.dogRow === this.playerRow) {
          this.onPlayerCaught();
        }
      },
    });

    this.dogZzz.setPosition(x + 18, y - 18);

    // Bark if the dog gets really close (within 2 tiles)
    const dist = Math.abs(this.dogCol - this.playerCol) + Math.abs(this.dogRow - this.playerRow);
    if (dist <= 2) {
      playBark(1);
    }
  }

  // ─── Win / Lose ──────────────────────────────────────────────────────────

  private onPlayerWon() {
    if (this.gameState === 'won' || this.gameState === 'lost') return;
    this.gameState = 'won';
    this.countdownEvent?.remove();
    this.dogMoveEvent?.remove();
    this.periodicBarkEvent?.remove();

    this.cameras.main.flash(300, 100, 255, 100);

    // Dog skids to halt
    this.tweens.add({
      targets: this.dogSprite, scaleX: 1.6, scaleY: 0.6, duration: 200, yoyo: true,
    });

    const isLastLevel = this.levelNumber >= ALL_LEVELS.length;
    const btnLabel = isLastLevel ? 'BACK TO MENU' : 'NEXT LEVEL \u25BA';
    const title = isLastLevel
      ? '\u{1F3C6} ALL DONE!'
      : `\u{1F3EB} LEVEL ${this.levelNumber} COMPLETE!`;
    const subtitle = isLastLevel
      ? 'You finished every level!\nYou are a morning champion!'
      : `Amazing! You made it to school!\nReady for Level ${this.levelNumber + 1}?`;

    this.time.delayedCall(500, () => this.showOverlay(title, subtitle, btnLabel));
  }

  private onPlayerCaught() {
    if (this.gameState === 'won' || this.gameState === 'lost') return;
    this.gameState = 'lost';
    this.countdownEvent?.remove();
    this.dogMoveEvent?.remove();
    this.periodicBarkEvent?.remove();

    playBark(3);

    this.cameras.main.shake(600, 0.022);
    this.cameras.main.flash(200, 255, 0, 0);

    this.tweens.add({
      targets: this.playerSprite,
      y: this.playerSprite.y - 40, angle: 360,
      duration: 250, yoyo: true,
    });

    this.time.delayedCall(600, () => {
      this.showOverlay(
        '\u{1F415} THE LATE DOG GOT YOU!',
        'Woof woof!\nGet those morning jobs done a bit quicker!',
        'TRY AGAIN'
      );
    });
  }
}
