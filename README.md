# The Late Dog

A browser-based maze game for children about getting ready for school on time.

Wake up, do your morning jobs, and race to the school gate — before **The Late Dog** catches you!

**Play it:** https://andydavidson.github.io/latedog/

---

## How to play

- Navigate the maze and complete your morning tasks:
  - Brush teeth (🪥)
  - Put shoes on (👟)
  - Pack your school bag (🎒)
- Once all tasks are done, reach the school gate (🏫) to win the level.
- If the timer runs out, The Late Dog (🐕) wakes up and chases you!
- You can still escape to the gate even after the dog wakes — but hurry!

### Controls

| Device | Input |
|--------|-------|
| Keyboard | Arrow keys or WASD |
| Tablet / touch | On-screen D-pad (bottom-right corner) |

---

## Running locally

You need [Node.js](https://nodejs.org) 18+.

```bash
npm install
npm run dev
```

Then open the URL shown in the terminal (usually `http://localhost:5173`).

### Build for production

```bash
npm run build
```

The built files land in `dist/`.

---

## Deploying to GitHub Pages

The repo includes a GitHub Actions workflow (`.github/workflows/deploy.yml`) that builds and deploys automatically on every push to `main`.

To enable it:

1. Go to your repo on GitHub → **Settings** → **Pages**.
2. Under **Source**, choose **GitHub Actions**.
3. Push to `main` — the workflow handles the rest.

The game will be live at `https://andydavidson.github.io/latedog/`.

---

## Project structure

```
src/
  main.ts               Phaser game bootstrap
  types.ts              TypeScript types (tasks, level definitions, game state)
  levels/
    level1.ts           Level 1 maze data and task definitions
  scenes/
    GameScene.ts        Main gameplay scene (maze, player, dog, UI)
```

Built with [Phaser 3](https://phaser.io) and [Vite](https://vitejs.dev). No React.

---

## Prototype milestone 1

This is the first playable prototype. The goal is to answer one question:

> Is running around a morning maze while trying to beat The Late Dog actually fun?

Everything else comes later.
