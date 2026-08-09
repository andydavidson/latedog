import Phaser from 'phaser';
import { primeAudio } from '../audio/bark';

const CANVAS_W = 800;
const CANVAS_H = 670;

export class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  create() {
    // Background
    this.add.rectangle(0, 0, CANVAS_W, CANVAS_H, 0x0d0a1f).setOrigin(0, 0);

    // Subtle floor lines for depth
    const lineGfx = this.add.graphics();
    lineGfx.lineStyle(1, 0x2a2060, 0.6);
    for (let y = 80; y < CANVAS_H; y += 40) {
      lineGfx.lineBetween(0, y, CANVAS_W, y);
    }
    for (let x = 0; x < CANVAS_W; x += 40) {
      lineGfx.lineBetween(x, 80, x, CANVAS_H);
    }

    // Studio credit — top
    this.add.text(CANVAS_W / 2, 36, 'AN ELECTRO-MAGNETIC STUDIOS GAME', {
      fontSize: '14px',
      fontStyle: 'bold',
      color: '#ffaa00',
      letterSpacing: 6,
    }).setOrigin(0.5);

    // Title
    this.add.text(CANVAS_W / 2, 120, 'THE', {
      fontSize: '36px',
      fontStyle: 'bold',
      color: '#ffaa00',
      letterSpacing: 14,
    }).setOrigin(0.5);

    this.add.text(CANVAS_W / 2, 185, 'LATE DOG', {
      fontSize: '88px',
      fontStyle: 'bold',
      color: '#ffffff',
      stroke: '#ff6600',
      strokeThickness: 8,
      shadow: { blur: 20, color: '#ff4400', fill: true },
    }).setOrigin(0.5);

    // Dog character — large animated emoji
    const dog = this.add.text(CANVAS_W / 2, 320, '\u{1F415}', {
      fontSize: '90px',
    }).setOrigin(0.5);

    this.tweens.add({
      targets: dog,
      y: 310,
      scaleX: 1.08,
      scaleY: 0.94,
      duration: 700,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Zzz (dog is still sleeping on the menu)
    const zzz = this.add.text(CANVAS_W / 2 + 60, 275, 'z z z', {
      fontSize: '18px',
      color: '#8888cc',
      fontStyle: 'italic',
    }).setOrigin(0.5);
    this.tweens.add({
      targets: zzz,
      alpha: 0,
      y: 250,
      duration: 1200,
      yoyo: true,
      repeat: -1,
    });

    // Instructions
    const instructions = [
      '\u{1F6CF} Wake up  \u2192  \u{1FAA5}\u{1F45F}\u{1F392} Do your jobs  \u2192  \u{1F3EB} School gate',
      '',
      'Move with  ARROW KEYS / WASD  or  the on-screen D-pad',
      '',
      'Hurry! If time runs out \u2014 The Late Dog wakes up and chases you!',
    ];

    this.add.text(CANVAS_W / 2, 440, instructions.join('\n'), {
      fontSize: '17px',
      color: '#cccccc',
      align: 'center',
      lineSpacing: 6,
    }).setOrigin(0.5);

    // Begin button
    const btnW = 300;
    const btnH = 64;
    const btnY = 580;

    const btnBg = this.add.rectangle(CANVAS_W / 2, btnY, btnW, btnH, 0xff6600)
      .setInteractive({ useHandCursor: true });

    this.add.text(CANVAS_W / 2, btnY, 'CLICK / TAP TO BEGIN', {
      fontSize: '22px',
      fontStyle: 'bold',
      color: '#ffffff',
    }).setOrigin(0.5);

    btnBg.on('pointerover',  () => btnBg.setFillStyle(0xffaa00));
    btnBg.on('pointerout',   () => btnBg.setFillStyle(0xff6600));
    btnBg.on('pointerdown',  () => this.startGame());

    // Also allow clicking anywhere (but not if the begin button swallows it first)
    this.input.on('pointerdown', () => this.startGame());

    // Footer credit
    this.add.text(CANVAS_W / 2, CANVAS_H - 14, '\u00A9 Electro-Magnetic Studios', {
      fontSize: '12px',
      color: '#555577',
    }).setOrigin(0.5);

    // Pulse the button
    this.tweens.add({
      targets: btnBg,
      scaleX: 1.04,
      scaleY: 1.04,
      duration: 600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  private startGame() {
    primeAudio(); // warm up AudioContext inside this user-gesture call
    this.scene.start('GameScene', { levelNumber: 1 });
  }
}
