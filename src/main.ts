import Phaser from 'phaser';
import { MenuScene } from './scenes/MenuScene';
import { GameScene } from './scenes/GameScene';

const COLS = 20;
const ROWS = 15;
const TILE = 40;
const HEADER_H = 70;

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: COLS * TILE,
  height: HEADER_H + ROWS * TILE,
  backgroundColor: '#0d0a1f',
  parent: 'game-container',
  scene: [MenuScene, GameScene],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: COLS * TILE,
    height: HEADER_H + ROWS * TILE,
  },
  input: {
    activePointers: 4,
  },
};

new Phaser.Game(config);
