# CLAUDE.md — The Late Dog

## Project Summary

**The Late Dog** is a browser-based maze game for children about getting ready for school on time.

The player starts each level in bed and must navigate through a maze-like morning routine, completing the things they need to do before reaching the **school gate**, which is the exit for the level.

The central joke and jeopardy is **The Late Dog**.

If the player takes too long, the Late Dog wakes up, barks, and starts chasing them.

The game should feel funny, energetic, slightly chaotic, and exciting rather than stressful or punishing.

The intended players are young children, so controls, language, feedback, and failure states must all be simple and forgiving.

---

# Core Game Fantasy

The player is trying to get from:

**BED → MORNING ROUTINE → SCHOOL GATE**

before they are late.

Each level is a maze representing the journey through the morning.

The player must complete required morning tasks before the school gate can be successfully entered.

If the countdown timer reaches zero:

1. The Late Dog wakes up.
2. The player hears barking.
3. The Late Dog enters the maze.
4. The Late Dog chases the player.
5. The player still has a final chance to reach the school gate.
6. If the Late Dog catches the player, the level ends and can be retried.

The Late Dog is not evil.

It is the physical embodiment of **being late**.

It should be funny, mischievous and memorable.

---

# Core Morning Tasks

The game should reflect the children's real morning routine.

Initial task set:

- Get out of bed
- Go to the toilet / loo
- Have a wash
- Brush teeth
- Get dressed in school uniform
- Make breakfast
- Eat breakfast
- Pack school bag
- Put shoes on
- Reach / enter the school gate

This list may evolve after discussion with the children.

Tasks should have clear visual representations rather than relying heavily on text.

Examples:

- Toothbrush = brush teeth
- Shirt / jumper = get dressed
- Cereal bowl / toast = breakfast
- Backpack = pack school bag
- Shoes = put shoes on
- School gate = finish level

---

# Core Gameplay Loop

Each level should follow roughly this loop:

1. Player wakes up in bed.
2. Countdown begins.
3. Player navigates the maze.
4. Player reaches task locations and completes required morning tasks.
5. Completing tasks may unlock new parts of the maze.
6. Player continues towards the school gate.
7. Player wins by reaching the school gate after completing all required tasks.

If the timer expires:

8. Barking begins.
9. The Late Dog appears.
10. The Late Dog chases the player.
11. The player may still escape by reaching the school gate.
12. If caught, the player retries the level.

---

# Level Progression

Difficulty should increase gradually.

Do NOT make later levels difficult merely by making movement frustrating.

Difficulty should mainly increase through:

- Slightly larger mazes
- More complex maze layouts
- More required morning tasks
- More distant task locations
- Shorter initial countdowns
- More decisions about route order
- Locked doors / gates
- Moving obstacles
- Optional shortcuts
- Increasing Late Dog speed
- Increasing Late Dog intelligence

The first few levels should be extremely easy.

Suggested progression:

## Level 1 — Wake Up!

Very small maze.

Tasks:

- Get out of bed
- Brush teeth
- Put shoes on
- Reach school gate

Generous timer.

Late Dog is slow.

Purpose: teach movement and the basic objective.

## Level 2 — Breakfast!

Slightly larger maze.

Add:

- Make breakfast
- Eat breakfast

## Level 3 — School Uniform

Add:

- Get dressed
- Pack school bag

## Level 4 — The Full Morning

Introduce most or all normal morning tasks.

## Later Levels

Increase maze complexity and reduce available time.

Introduce mechanics such as:

- Locked doors
- Keys
- One-way passages
- Moving obstacles
- Teleport-style shortcuts
- Secret routes
- Dog-proof doors
- Temporary speed boosts
- Morning distractions

Do not add mechanics merely for complexity. Every mechanic should be understandable to a young child.

---

# Maze / Task Design

Current preferred design:

**One continuous maze per level.**

The morning activities act as checkpoints or destinations within that maze.

This is preferred over having a completely separate maze for every individual morning task because the game should feel like one continuous frantic journey from bed to school.

However, this remains an explicit design decision to test.

Possible alternatives to prototype:

### Option A — One Maze Per Morning

One larger maze containing all tasks.

Advantages:

- Strong sense of journey
- Allows route planning
- Late Dog chase can continue naturally
- Feels more like a complete game level

### Option B — Multiple Small Mazes

One mini-maze for each task.

Advantages:

- Simpler for very young children
- Easy to explain
- More varied scenery

Disadvantages:

- Could feel fragmented
- Late Dog mechanic becomes less elegant
- Less sense of a single race against time

Initial implementation should favour **Option A**.

---

# Task Ordering

Some morning tasks should logically depend on others.

Examples:

- Player must get out of bed before doing anything else.
- Player should get dressed before going to school.
- Breakfast may require making breakfast before eating breakfast.
- Shoes should generally happen near the end.
- School gate should only count as success when all required tasks are complete.

The game does NOT necessarily need one rigid route.

Where practical, allow children to choose their order.

For example:

- brush teeth → dress → breakfast

or

- breakfast → brush teeth → dress

could both work.

This creates route-planning and replay value.

Dependencies should only exist where they make intuitive sense.

---

# The Late Dog

The Late Dog is the game's signature character.

## Behaviour

Before timer expiry:

- Late Dog is asleep.
- It may be visible somewhere amusing.
- It may snore.
- Perhaps an icon or portrait shows the dog sleeping beside the countdown.

When timer reaches zero:

- Bark sound.
- Visual warning.
- Late Dog wakes.
- Late Dog enters or activates in the maze.
- Music may accelerate.
- Late Dog pursues the player.

## Chase

The dog should use understandable pursuit behaviour.

Early levels:

- Slow
- Forgiving
- Possibly imperfect pathfinding

Later levels:

- Faster
- Smarter
- Better pathfinding

The dog must never feel unfair.

Avoid spawning directly beside the player.

## Being Caught

Being caught should be funny rather than upsetting.

Examples of tone:

- Dog barks excitedly.
- Character tumbles into a harmless pile of school bags.
- Screen says something encouraging such as:
  **"THE LATE DOG GOT YOU!"**
- Immediate retry button.

Avoid language implying the child has behaved badly.

---

# Visual Tone

Target:

- Bright
- Friendly
- Funny
- Slightly absurd
- Clear shapes
- Big readable objects
- Strong visual feedback

The game should feel like a children's cartoon rather than a realistic simulation.

The Late Dog should be distinctive enough to become a character the children recognise immediately.

Avoid overly detailed interfaces.

The play area should dominate the screen.

---

# Controls

## Desktop / Laptop

Support both:

### Arrow keys

- Up
- Down
- Left
- Right

### WASD

- W = Up
- A = Left
- S = Down
- D = Right

Do not require mouse control during normal gameplay.

## Tablet

Provide large on-screen directional controls.

Preferred arrangement:

```
      ↑
   ←  ↓  →
```

or a simple virtual D-pad.

Requirements:

- Large touch targets
- Usable by small hands
- Positioned so they do not obscure the maze
- Multi-touch-safe
- No tiny buttons

Consider optional swipe movement later, but the D-pad should be the reliable default.

---

# Supported Devices

Primary targets:

- Desktop browser
- Laptop browser
- iPad
- Android tablet
- Amazon Fire Kids tablet

A phone layout is NOT a priority.

If the game happens to work on phones, that is useful, but design decisions should not compromise the tablet experience merely to support small phone screens.

---

# Technology

## Important Constraint

**Do not use React.**

React is explicitly unwanted for this project.

## Preferred Architecture

Use a lightweight browser game stack.

Recommended initial choice:

### Phaser 3

Use Phaser for:

- Game scene
- Maze rendering
- Sprite movement
- Collision detection
- Animation
- Audio
- Timers
- Input
- Late Dog behaviour
- Pathfinding integration

Phaser is preferred over attempting to build the game itself out of DOM components.

### Svelte

Svelte may be used for surrounding UI such as:

- Main menu
- Level selection
- Settings
- Parent controls
- Credits
- Help screens

Do not put core frame-by-frame gameplay into Svelte unless there is a compelling reason.

Preferred structure:

**Svelte application shell + Phaser game canvas**

However, if the application is cleaner using Phaser alone for the first prototype, that is also acceptable.

Keep dependencies minimal.

---

# Packaging Into Apps

The game should initially be a web application.

Design the code so that it can later be wrapped as a native-style application.

Potential future wrapper:

- Capacitor

Potential targets:

- iPad / iOS
- Android
- Amazon Fire tablets

Avoid browser APIs that will make later packaging unnecessarily difficult.

Prefer:

- Pointer / touch events
- Web Audio through Phaser
- Canvas/WebGL rendering
- LocalStorage or IndexedDB for simple saved progress

Do not assume an internet connection is always available.

Eventually the game should be capable of working offline.

---

# Technical Principles

## Keep It Simple

This is a children's game and a family project.

Prefer:

- Small modules
- Simple data models
- Readable TypeScript
- Few dependencies
- Obvious game state

Avoid:

- Enterprise architecture
- Premature abstraction
- Huge state-management systems
- React
- Redux
- Microservices
- Unnecessary backend services

A backend is not required for the initial game.

---

# Language

Use **TypeScript** rather than plain JavaScript unless there is a strong reason not to.

Code should be easy for an AI coding agent and a human to understand.

Names should be explicit.

Prefer:

```ts
lateDogSpeed
remainingMorningTime
completedTasks
requiredTasks
schoolGateUnlocked
```

rather than vague names such as:

```ts
x
data
state2
foo
```

---

# Game State

At minimum, each level needs state for:

```ts
levelNumber
timeRemaining
isLateDogAwake
playerPosition
lateDogPosition
requiredTasks
completedTasks
schoolGateUnlocked
levelCompleted
playerCaught
```

Task state should be data-driven.

Example concept:

```ts
type MorningTask =
  | "get-out-of-bed"
  | "toilet"
  | "wash"
  | "brush-teeth"
  | "get-dressed"
  | "make-breakfast"
  | "eat-breakfast"
  | "pack-school-bag"
  | "put-on-shoes";
```

Do not hard-code every level's logic into a giant conditional statement.

Levels should eventually be configurable with data.

---

# Level Data

A level should eventually be representable roughly as:

```ts
interface LevelDefinition {
  id: number;
  name: string;
  map: string;
  startingTimeSeconds: number;
  requiredTasks: MorningTask[];
  lateDogSpeed: number;
}
```

This structure can expand later.

Prefer a data-driven level system so new levels can be created without rewriting the game engine.

---

# Movement

Initial movement can be grid based.

Advantages:

- Natural for mazes
- Easy for children
- Easy collision handling
- Easy pathfinding
- Works equally well with keyboard and touch controls

Possible model:

- One button press = one tile
- Holding direction repeats movement

Movement should feel responsive.

Do not allow accidental diagonal movement if it makes maze navigation confusing.

---

# Maze Representation

Prefer tilemaps.

Potential approaches:

- Phaser Tilemap
- JSON-generated maze
- Tiled map editor exported to JSON

For the earliest prototype, a simple hard-coded grid is acceptable.

Do not spend time building a sophisticated procedural maze generator before proving the gameplay is fun.

---

# Pathfinding

The Late Dog will likely require pathfinding.

A simple grid-based algorithm is sufficient.

Candidates:

- A*
- Breadth-first search for small levels

The Late Dog should not constantly recalculate at excessive frequency.

Pathfinding can recalculate periodically or when the player changes tile.

Prioritise predictable, fun behaviour over sophisticated AI.

---

# Timer

The timer is central to the game.

It must be extremely visible.

Ideas:

- Large countdown
- Clock icon
- Colour change as time gets low
- Sleeping dog icon that begins stirring
- Increasing snoring / barking cues

Possible phases:

- Plenty of time
- Hurry up
- Nearly late
- LATE DOG!

Do not rely on colour alone because young players may not notice it.

Use animation and sound.

---

# Sound

Sound is important.

Potential sounds:

- Alarm clock
- Tooth brushing
- Running footsteps
- Cereal pouring
- Backpack zip
- Shoes
- School bell
- Dog snoring
- Dog waking
- Barking
- Chase music
- Victory sound

Provide a simple mute control.

Never autoplay loud audio before a player interaction if browser policies or usability make that problematic.

---

# Accessibility / Child Usability

Important:

- Large controls
- Minimal reading required
- Icons alongside words
- Clear feedback
- No complicated menus
- No adverts
- No dark patterns
- No in-app purchases
- No external links accessible from ordinary child gameplay
- No chat
- No account requirement

The game is for children, not for monetisation.

---

# Failure Philosophy

Failure should be rapid, funny and recoverable.

Avoid:

- Long game-over sequences
- Losing lots of progress
- Scolding
- Negative scores
- Punishing restart procedures

Preferred:

1. Late Dog catches player.
2. Funny animation / bark.
3. One obvious **TRY AGAIN** button.
4. Restart almost immediately.

---

# Winning

When the player reaches the school gate with all required morning tasks complete:

- Gate opens
- Celebration sound
- Character runs through
- Late Dog may skid to a halt comically
- Level completion screen appears

Possible scoring:

- Time remaining
- Stars
- Biscuits
- Dog treats
- School stars

Scoring is optional in the first prototype.

The fundamental reward is reaching school before the Late Dog catches you.

---

# Prototype Milestone 1

Build the smallest possible playable version.

One level only.

Requirements:

- Maze
- Player
- Keyboard movement
- Tablet D-pad
- Collision with maze walls
- Three morning tasks:
  - Brush teeth
  - Put shoes on
  - Pack school bag
- School gate
- Countdown timer
- Sleeping Late Dog
- Late Dog wakes at zero
- Late Dog chases player
- Player wins by reaching gate after tasks complete
- Player loses if Late Dog catches them
- Retry button

No menus beyond what is necessary.

No save system.

No procedural generation.

No elaborate animation.

The objective of Prototype 1 is to answer:

**Is running around a morning maze while trying to beat the Late Dog actually fun?**

---

# Prototype Milestone 2

After Prototype 1 is fun:

- More levels
- More morning tasks
- Improved graphics
- Improved Late Dog animation
- Sound
- Level progression
- Saved progress
- Better tablet UX

---

# Prototype Milestone 3

Only after the core game works:

- iPad packaging
- Android packaging
- Amazon Fire testing
- Offline support
- More characters
- More maze themes
- Optional difficulty modes
- Parent settings

---

# Potential Future Ideas

These are ideas, not requirements.

Do not implement them without deciding they improve the game.

- Different playable children
- Character customisation
- Pyjama starting outfit
- Uniform changes after dressing
- Dog breeds / Late Dog costumes
- Breakfast choices
- Lost school shoe
- Missing book
- Forgotten PE kit
- Rainy morning
- Snow day
- Dad blocking the hallway
- Sibling blocking bathroom
- Cat sitting somewhere inconvenient
- Toast popping out
- School bus bonus level
- Weekend levels
- Secret shortcuts
- Collectible dog biscuits
- Late Dog boss level
- Cooperative two-player mode

---

# Questions To Ask The Children

This game should be designed with the children rather than merely for them.

Ask them questions such as:

- What should the Late Dog look like?
- What colour is the Late Dog?
- Is the Late Dog big or small?
- What noise does the Late Dog make?
- Where does the Late Dog sleep?
- What happens when it catches you?
- What breakfast should appear?
- What should the character wear?
- Which morning job is hardest?
- Which morning job is funniest?
- What obstacles should appear in the house?
- Should there be toys on the floor?
- Should there be a cat?
- Should the school gate move?
- What should happen when you win?
- What should the first level be called?
- What power-ups would be funny?
- Should the Late Dog ever help you?
- Should there be more than one Late Dog?

Capture the children's answers in this file as the project evolves.

---

# Decisions Already Made

The following are current project decisions and should be treated as requirements unless explicitly changed later:

1. The game is called **The Late Dog**.
2. "Late" means **running late**.
3. The Late Dog wakes when the player runs out of time.
4. The Late Dog barks and chases the player.
5. The game is about getting ready for school in the morning.
6. Morning tasks should resemble the children's real routine.
7. The school gate represents the level exit.
8. Levels become progressively harder.
9. Later levels generally have larger / more complex mazes.
10. Later levels generally give the player less time.
11. Desktop controls should support keyboard directions.
12. Tablet controls should include on-screen directional buttons.
13. Tablet and normal computer screens are primary targets.
14. Phone support is not a priority.
15. The game should run in a browser.
16. **Do not use React.**
17. Phaser is the preferred game engine.
18. Svelte may be used for surrounding application UI.
19. The architecture should remain lightweight.
20. The game may eventually be packaged for iPad, Android and Amazon Fire tablets.

---

# Instructions For AI Coding Agents

When working on this repository:

1. Read this `CLAUDE.md` before making architectural or gameplay decisions.
2. Preserve the project's child-friendly tone.
3. Do not introduce React.
4. Prefer Phaser for gameplay.
5. Prefer Svelte only where ordinary application UI is useful.
6. Keep dependencies minimal.
7. Prefer TypeScript.
8. Do not build unnecessary backend services.
9. Keep gameplay logic data-driven where practical.
10. Prioritise a playable prototype over infrastructure.
11. Do not add features merely because they are technically interesting.
12. When there is uncertainty about gameplay, choose the simplest implementation that can be tested with the children.
13. Avoid irreversible architectural complexity.
14. Keep touch controls and tablet usability first-class.
15. Keep failure funny and low-friction.
16. Treat this file as the current product specification.

When a new gameplay decision is made with the family, update this file.

---

# Current Product Goal

Build a delightful first playable version in which a child can:

**wake up → run around → complete morning jobs → race the clock → hear the Late Dog wake up → get chased → escape through the school gate**

and immediately want to play again.

That is the test.

Everything else can come later.
