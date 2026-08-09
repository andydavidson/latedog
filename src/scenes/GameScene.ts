import Phaser from 'phaser';
import type { LevelDefinition, GameState, GridPos, TaskDefinition } from '../types';
import { level1 } from '../levels/level1';

const TILE = 40;
const HEADER_H = 70;
const COLS = 20;
const ROWS = 15;
const MOVE_COOLDOWN_MS = 140;

// Colours
const C_FLOOR      = 0xfff5dc;
const C_WALL       = 0x3d2b1f;
const C_WALL_TOP   = 0x5c4033;
const C_TASK_GLOW  = 0xffee88;
const C_GATE_GLOW  = 0x88ffaa;
const C_BED_GLOW   = 0xffccee;
const C_HEADER_BG  = 0x1a1040;
const C_DOG_AWAKE  = 0xff4400;

function tileToPixel(col: number, row: number): { x: number; y: number } {
  return {
    x: col * TILE + TILE / 2,
    y: HEADER_H + row * TILE + TILE / 2,
  };
}

// BFS — returns the full path from `from` to `to`, or [] if unreachable.
function bfsPath(maze: number[][], from: GridPos, to: GridPos): GridPos[] {
  const rows = maze.length;
  const cols = maze[0].length;
  const key = (p: GridPos) => `${p.col},${p.row}`;
  const visited = new Set<string>([key(from)]);
  const queue: Array<{ pos: GridPos; path: GridPos[] }> = [
    { pos: from, path: [from] },
  ];
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
  private taskMarkers: Map<string, Phaser.GameObjects.Container> = new Map();

  private timerText!: Phaser.GameObjects.Text;
  private timerIcon!: Phaser.GameObjects.Text;
  private taskListItems: Phaser.GameObjects.Text[] = [];
  private dogStatusText!: Phaser.GameObjects.Text;

  private overlayBg!: Phaser.GameObjects.Rectangle;
  private overlayTitle!: Phaser.GameObjects.Text;
  private overlaySubtitle!: Phaser.GameObjects.Text;
  private retryButton!: Phaser.GameObjects.Container;

  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keyW!: Phaser.Input.Keyboard.Key;
  private keyA!: Phaser.Input.Keyboard.Key;
  private keyS!: Phaser.Input.Keyboard.Key;
  private keyD!: Phaser.Input.Keyboard.Key;

  private countdownEvent!: Phaser.Time.TimerEvent;
  private dogMoveEvent!: Phaser.Time.TimerEvent;

  // D-pad touch state
  private dpadDx = 0;
  private dpadDy = 0;

  constructor() {
    super({ key: 'GameScene' });
  }

  create() {
    this.level = level1;
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

    if (this.cursors.left.isDown  || this.keyA.isDown) dx = -1;
    else if (this.cursors.right.isDown || this.keyD.isDown) dx = 1;
    else if (this.cursors.up.isDown   || this.keyW.isDown) dy = -1;
    else if (this.cursors.down.isDown  || this.keyS.isDown) dy = 1;
    else if (this.dpadDx !== 0) dx = this.dpadDx;
    else if (this.dpadDy !== 0) dy = this.dpadDy;

    if (dx !== 0 || dy !== 0) {
      this.tryMovePlayer(dx, dy);
    }
  }

  // ─── Maze rendering ──────────────────────────────────────────────────────

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
          gfx.fillRect(px, py, TILE, 4);
        } else {
          gfx.fillStyle(C_FLOOR, 1);
          gfx.fillRect(px, py, TILE, TILE);
          // subtle grid lines
          gfx.lineStyle(1, 0xe8ddc8, 0.4);
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

    // pulse the gate gently
    this.tweens.add({
      targets: icon,
      scaleX: 1.15,
      scaleY: 1.15,
      duration: 700,
      yoyo: true,
      repeat: -1,
    });
  }

  private createTaskMarkers() {
    for (const task of this.level.tasks) {
      this.createTaskMarker(task);
    }
  }

  private createTaskMarker(task: TaskDefinition) {
    const { x, y } = tileToPixel(task.col, task.row);
    const gfx = this.add.graphics();
    gfx.fillStyle(C_TASK_GLOW, 1);
    gfx.fillRoundedRect(x - TILE / 2 + 2, y - TILE / 2 + 2, TILE - 4, TILE - 4, 6);
    const icon = this.add.text(x, y, task.emoji, { fontSize: '26px' }).setOrigin(0.5);
    const container = this.add.container(0, 0, [gfx, icon]);
    this.taskMarkers.set(task.id, container);
  }

  // ─── Entities ────────────────────────────────────────────────────────────

  private createPlayer() {
    const { x, y } = tileToPixel(this.playerCol, this.playerRow);
    this.playerSprite = this.add.text(x, y, '\u{1F9D2}', {
      fontSize: '30px',
    }).setOrigin(0.5).setDepth(10);
  }

  private createDog() {
    const { x, y } = tileToPixel(this.dogCol, this.dogRow);
    this.dogSprite = this.add.text(x, y, '\u{1F415}', {
      fontSize: '30px',
    }).setOrigin(0.5).setDepth(10);

    this.dogZzz = this.add.text(x + 16, y - 16, 'z z z', {
      fontSize: '11px',
      color: '#aaaaee',
      fontStyle: 'italic',
    }).setOrigin(0.5).setDepth(11);

    this.tweens.add({
      targets: this.dogZzz,
      alpha: 0,
      duration: 800,
      yoyo: true,
      repeat: -1,
    });
  }

  // ─── Header UI ───────────────────────────────────────────────────────────

  private createHeader() {
    const canvasWidth = COLS * TILE;

    const bg = this.add.rectangle(0, 0, canvasWidth, HEADER_H, C_HEADER_BG).setOrigin(0, 0).setDepth(20);

    // Timer icon and text
    this.timerIcon = this.add.text(14, HEADER_H / 2, '\u{1F550}', {
      fontSize: '28px',
    }).setOrigin(0, 0.5).setDepth(21);

    this.timerText = this.add.text(50, HEADER_H / 2, this.formatTime(this.timeRemaining), {
      fontSize: '26px',
      fontFamily: 'monospace',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0, 0.5).setDepth(21);

    // Dog status (right side)
    this.dogStatusText = this.add.text(canvasWidth - 14, HEADER_H / 2, '\u{1F4A4} Sleeping', {
      fontSize: '18px',
      color: '#aaaaee',
    }).setOrigin(1, 0.5).setDepth(21);

    // Task list (center)
    this.rebuildTaskListUI();

    // Thin border under header
    const border = this.add.rectangle(0, HEADER_H - 2, canvasWidth, 3, 0xff8c00).setOrigin(0, 0).setDepth(21);

    // keep bg reference so it renders
    void bg;
    void border;
  }

  private rebuildTaskListUI() {
    for (const t of this.taskListItems) t.destroy();
    this.taskListItems = [];

    const startX = 180;
    let x = startX;

    for (const task of this.level.tasks) {
      const done = this.completedTasks.has(task.id);
      const label = `${task.emoji} ${done ? '\u2705' : '\u25A1'}`;
      const item = this.add.text(x, HEADER_H / 2, label, {
        fontSize: '20px',
        color: done ? '#88ffaa' : '#ffffff',
      }).setOrigin(0, 0.5).setDepth(21);
      this.taskListItems.push(item);
      x += item.width + 16;
    }
  }

  private formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60).toString().padStart(1, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  private updateTimerDisplay() {
    this.timerText.setText(this.formatTime(this.timeRemaining));

    if (this.timeRemaining <= 10) {
      this.timerText.setColor('#ff4444');
      this.timerIcon.setText('\u23F0'); // alarm clock
    } else if (this.timeRemaining <= 20) {
      this.timerText.setColor('#ffaa44');
    } else {
      this.timerText.setColor('#ffffff');
    }
  }

  // ─── D-pad ───────────────────────────────────────────────────────────────

  private createDpad() {
    const btnSize = 64;
    const gap = 4;
    const centerX = COLS * TILE - (btnSize + gap) * 1.5 - 8;
    const centerY = HEADER_H + ROWS * TILE - (btnSize + gap) * 1.5 - 8;

    const dirs: Array<{ dx: number; dy: number; label: string; offX: number; offY: number }> = [
      { dx:  0, dy: -1, label: '\u25B2', offX: 0,          offY: -(btnSize + gap) },
      { dx:  0, dy:  1, label: '\u25BC', offX: 0,          offY:  (btnSize + gap) },
      { dx: -1, dy:  0, label: '\u25C4', offX: -(btnSize + gap), offY: 0 },
      { dx:  1, dy:  0, label: '\u25BA', offX:  (btnSize + gap), offY: 0 },
    ];

    for (const dir of dirs) {
      const bx = centerX + dir.offX;
      const by = centerY + dir.offY;

      const bg = this.add.rectangle(bx, by, btnSize, btnSize, 0x000000, 0.45)
        .setOrigin(0.5)
        .setDepth(30)
        .setInteractive({ useHandCursor: true });

      const label = this.add.text(bx, by, dir.label, {
        fontSize: '28px',
        color: '#ffffff',
      }).setOrigin(0.5).setDepth(31);

      bg.on('pointerdown', () => {
        this.dpadDx = dir.dx;
        this.dpadDy = dir.dy;
        bg.setFillStyle(0xffffff, 0.25);
      });
      bg.on('pointerup', () => {
        this.dpadDx = 0;
        this.dpadDy = 0;
        bg.setFillStyle(0x000000, 0.45);
      });
      bg.on('pointerout', () => {
        this.dpadDx = 0;
        this.dpadDy = 0;
        bg.setFillStyle(0x000000, 0.45);
      });

      void label;
    }
  }

  // ─── End-state overlay ───────────────────────────────────────────────────

  private createOverlay() {
    const canvasWidth = COLS * TILE;
    const canvasHeight = HEADER_H + ROWS * TILE;

    this.overlayBg = this.add
      .rectangle(canvasWidth / 2, canvasHeight / 2, canvasWidth, canvasHeight, 0x000000, 0.7)
      .setDepth(50)
      .setVisible(false);

    this.overlayTitle = this.add
      .text(canvasWidth / 2, canvasHeight / 2 - 60, '', {
        fontSize: '48px',
        fontStyle: 'bold',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 6,
        align: 'center',
        wordWrap: { width: canvasWidth - 80 },
      })
      .setOrigin(0.5)
      .setDepth(51)
      .setVisible(false);

    this.overlaySubtitle = this.add
      .text(canvasWidth / 2, canvasHeight / 2 + 20, '', {
        fontSize: '24px',
        color: '#eeeeee',
        align: 'center',
        wordWrap: { width: canvasWidth - 80 },
      })
      .setOrigin(0.5)
      .setDepth(51)
      .setVisible(false);

    // Retry / Play again button
    const btnW = 260;
    const btnH = 60;
    const btnY = canvasHeight / 2 + 100;

    const btnBg = this.add
      .rectangle(canvasWidth / 2, btnY, btnW, btnH, 0xff8c00)
      .setDepth(51)
      .setVisible(false)
      .setInteractive({ useHandCursor: true });

    const btnLabel = this.add
      .text(canvasWidth / 2, btnY, 'TRY AGAIN', {
        fontSize: '26px',
        fontStyle: 'bold',
        color: '#ffffff',
      })
      .setOrigin(0.5)
      .setDepth(52)
      .setVisible(false);

    btnBg.on('pointerdown', () => {
      this.scene.restart();
    });
    btnBg.on('pointerover', () => btnBg.setFillStyle(0xffaa00));
    btnBg.on('pointerout',  () => btnBg.setFillStyle(0xff8c00));

    this.retryButton = this.add.container(0, 0, [btnBg, btnLabel]).setDepth(51).setVisible(false);

    // Store button children separately for visibility toggling
    this.retryButton.setData('bg', btnBg);
    this.retryButton.setData('label', btnLabel);
  }

  private showOverlay(title: string, subtitle: string) {
    this.overlayBg.setVisible(true);
    this.overlayTitle.setText(title).setVisible(true);
    this.overlaySubtitle.setText(subtitle).setVisible(true);

    const btnBg    = this.retryButton.getData('bg') as Phaser.GameObjects.Rectangle;
    const btnLabel = this.retryButton.getData('label') as Phaser.GameObjects.Text;
    btnBg.setVisible(true);
    btnLabel.setVisible(true);
  }

  // ─── Input ───────────────────────────────────────────────────────────────

  private setupInput() {
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.keyW = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W);
    this.keyA = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.keyS = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S);
    this.keyD = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D);
  }

  // ─── Movement ────────────────────────────────────────────────────────────

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
      targets: this.playerSprite,
      x, y,
      duration: 100,
      ease: 'Linear',
      onComplete: () => {
        this.isMoving = false;
        this.checkPlayerTile();
      },
    });
  }

  private isWall(col: number, row: number): boolean {
    const maze = this.level.maze;
    if (col < 0 || col >= COLS || row < 0 || row >= ROWS) return true;
    return maze[row][col] === 1;
  }

  private checkPlayerTile() {
    // Check tasks
    for (const task of this.level.tasks) {
      if (
        !this.completedTasks.has(task.id) &&
        this.playerCol === task.col &&
        this.playerRow === task.row
      ) {
        this.collectTask(task.id);
      }
    }

    // Check gate
    if (
      this.playerCol === this.level.gate.col &&
      this.playerRow === this.level.gate.row
    ) {
      if (this.completedTasks.size >= this.level.tasks.length) {
        this.onPlayerWon();
      } else {
        // Flash gate to indicate tasks remaining
        this.cameras.main.shake(150, 0.005);
      }
    }

    // Check dog catch
    if (this.playerCol === this.dogCol && this.playerRow === this.dogRow) {
      this.onPlayerCaught();
    }
  }

  private collectTask(taskId: string) {
    this.completedTasks.add(taskId);

    // Hide the task marker with a pop animation
    const marker = this.taskMarkers.get(taskId);
    if (marker) {
      this.tweens.add({
        targets: marker,
        scaleX: 1.5,
        scaleY: 1.5,
        alpha: 0,
        duration: 300,
        ease: 'Power2',
        onComplete: () => marker.destroy(),
      });
    }

    this.rebuildTaskListUI();

    // Flash a positive indicator
    const { x, y } = tileToPixel(this.playerCol, this.playerRow);
    const flash = this.add.text(x, y - 20, '\u2b50', {
      fontSize: '28px',
    }).setOrigin(0.5).setDepth(40);
    this.tweens.add({
      targets: flash,
      y: y - 60,
      alpha: 0,
      duration: 600,
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
        if (this.timeRemaining === 0) {
          this.wakeLateDog();
        }
      },
    });
  }

  // ─── Late Dog ────────────────────────────────────────────────────────────

  private startDogMovement() {
    this.dogMoveEvent = this.time.addEvent({
      delay: this.level.dogStepMs,
      loop: true,
      callback: () => {
        if (this.gameState === 'dog_awake') {
          this.stepDogTowardPlayer();
        }
      },
    });
  }

  private wakeLateDog() {
    if (this.gameState !== 'playing') return;
    this.gameState = 'dog_awake';

    this.dogZzz.setVisible(false);
    this.dogStatusText.setText('\u{1F415} WOOF!').setColor('#ff4444');

    this.cameras.main.shake(400, 0.012);
    this.cameras.main.flash(200, 255, 80, 0);

    // Make timer text show LATE!
    this.timerText.setText('LATE!').setColor('#ff2200');
    this.timerIcon.setText('\u{1F6A8}');

    // Flash dog sprite red
    this.tweens.add({
      targets: this.dogSprite,
      tint: C_DOG_AWAKE,
      duration: 200,
      yoyo: true,
      repeat: 3,
    });
  }

  private stepDogTowardPlayer() {
    if (this.gameState !== 'dog_awake') return;

    const playerPos: GridPos = { col: this.playerCol, row: this.playerRow };
    const dogPos: GridPos    = { col: this.dogCol,    row: this.dogRow };
    const path = bfsPath(this.level.maze, dogPos, playerPos);

    if (path.length < 2) return; // already on same tile or no path

    const nextStep = path[1];
    this.dogCol = nextStep.col;
    this.dogRow = nextStep.row;

    const { x, y } = tileToPixel(nextStep.col, nextStep.row);
    this.tweens.add({
      targets: this.dogSprite,
      x, y,
      duration: this.level.dogStepMs * 0.85,
      ease: 'Linear',
      onComplete: () => {
        // Check if dog caught player
        if (this.dogCol === this.playerCol && this.dogRow === this.playerRow) {
          this.onPlayerCaught();
        }
      },
    });

    // Keep zzz positioned near dog
    this.dogZzz.setPosition(x + 16, y - 16);
  }

  // ─── Win / Lose ──────────────────────────────────────────────────────────

  private onPlayerWon() {
    if (this.gameState === 'won' || this.gameState === 'lost') return;
    this.gameState = 'won';

    this.countdownEvent?.remove();
    this.dogMoveEvent?.remove();

    this.cameras.main.flash(300, 100, 255, 100);

    // Comical dog skid to halt
    this.tweens.add({
      targets: this.dogSprite,
      scaleX: 1.4,
      scaleY: 0.7,
      duration: 200,
      yoyo: true,
    });

    this.time.delayedCall(400, () => {
      this.showOverlay(
        '\u{1F3EB} Made it!',
        'You got to school before The Late Dog caught you!\n\nWell done!'
      );
    });
  }

  private onPlayerCaught() {
    if (this.gameState === 'won' || this.gameState === 'lost') return;
    this.gameState = 'lost';

    this.countdownEvent?.remove();
    this.dogMoveEvent?.remove();

    this.cameras.main.shake(500, 0.02);
    this.cameras.main.flash(200, 255, 0, 0);

    // Bounce player
    this.tweens.add({
      targets: this.playerSprite,
      y: this.playerSprite.y - 30,
      duration: 150,
      yoyo: true,
    });

    this.time.delayedCall(500, () => {
      this.showOverlay(
        '\u{1F415} THE LATE DOG GOT YOU!',
        'Woof! So close!\nTry getting ready a bit quicker next time!'
      );
    });
  }
}
