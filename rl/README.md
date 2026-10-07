# Q-learning — Gridworld and Cliff Crossing

## Open

Extract the ZIP and double-click **index.html**. This self-contained file runs offline without installation, a server or API keys.

## Two tabs

Use **Gridworld** for the original 4 × 3 example, or **Cliff & island** for the 7 × 3 layout from the screenshot. Switching tabs pauses animation and retains each tab’s Q-table, state, undo history, counters, settings and CSV log. Reset clears only the active tab. Both start with the same alpha, gamma, epsilon and living reward.

### Cliff map

The robot starts at (1,1). Five middle-row path cells, (1,1) through (5,1), lead to the **+10 island at (6,1)**. The five cells above and five below the path, plus the left-hand terminal (0,1), are **−100 ocean**. The four corners are walls. The left-hand terminal is also −100 to follow the request that all side terminals have that reward.

All terminal cells retain the original **Exit** convention: entering one gives the living reward; Exit gives +10 or −100 and ends the episode. There are no movement slips. This follows the supplied narrow-path layout rather than the standard textbook cliff-walking reset-on-fall convention.

**Cliff walkthrough:** from reset, take **→ → → → → Exit**. Q(island, Exit) becomes **5.0** with alpha 0.5. Repeat in the next episode: the last rightward Q becomes **2.25** (sample = 0 + 0.9 × 5 = 4.5). To demonstrate danger, reset the Cliff tab and take **↑ Exit**; Q(ocean, Exit) becomes **−50**. Repeating ↑ on the next episode lets the penalty propagate to the action that enters that ocean cell.

## Shared behavior

- **One action = one move + immediate Q update.** No separate Apply button.
- **Deterministic movement.** North always attempts north, and similarly for the other directions. No slips and no movement-noise setting. Walls and boundaries keep the agent in place.
- **Back one step** reverses the entire action, including its Q update, position, counters, log and random-generator state.
- The old Q, reward, target and new Q remain visible after each action.

## Controls

- **Take action + update:** choose an epsilon-greedy action, move and learn immediately.
- **Arrow buttons / arrow keys:** choose the direction yourself; the Q update happens automatically. Keyboard shortcuts are ignored while a form control or button has keyboard focus; click the page background first.
- **Exit:** receive +1 or −1 from the corresponding exit square and end the episode.
- **Start next episode:** return to the start while retaining the Q-table.
- **Auto-play / Pause:** watch the same complete actions at the chosen pace. Auto-play also starts successive episodes.
- **Back one step / Backspace:** undo; up to 3,000 recent actions or episode resets are retained. Settings are not undone.
- **Space:** advance once.
- **Train 100 episodes:** fast training, including the current incomplete episode if present. Pause stops after the current episode.
- **Show greedy policy:** show all maximum-Q directions, including ties.
- **Learn from moves:** on by default. Turn it off to watch without updating the table.
- **Reset learning:** clear the table and history; retain control settings. The seed takes effect on reset.
- **Download CSV:** export completed transitions and numerical updates. The on-screen log shows the latest 12.

All training state is in memory. Reloading starts afresh. CSV is for analysis; no model import is included.

## Exploration versus movement

Epsilon still controls **action selection**: with probability epsilon the automatic agent chooses a random legal action. It then follows that chosen direction exactly. Manual arrow actions ignore epsilon. Greedy ties are broken randomly even at epsilon = 0. This randomness in choosing an action does not introduce movement slips.

Defaults: alpha = 0.5, gamma = 0.9, epsilon = 0.3, living reward = 0, seed = 42. No epsilon or alpha decay is applied. Changing the living reward keeps old Q-values; reset for a clean experiment.

## Quick classroom walkthrough

1. Start from reset with the default alpha, gamma and living reward.
2. Click **↑ ↑ → → → Exit**. Each click moves and updates Q automatically.
3. The exit action gives Q(exit) = 0 + 0.5 × (1 + 0.9 × 0 − 0) = **0.5**.
4. Start the next episode and repeat the path.
5. The final rightward action now uses target 0 + 0.9 × 0.5 = **0.45**, so its Q-value becomes **0.225**.
6. Explain why reward information propagates through experience rather than updating every square at once.
7. Try Auto-play or Train 100 episodes and show the greedy policy.

## Environment and update

In the Gridworld tab: classic 4 × 3 grid; start (0,0), wall (1,1), positive exit (3,2), negative exit (3,1). Coordinates increase upward and to the right. Ordinary cells show four triangular action values. All four directions are legal there, including blocked directions.

Berkeley-style exit timing is preserved: entering +1/−1 squares gives the living reward. These pre-terminal squares allow only Exit, which gives +1/−1 and reaches the terminal state outside the grid. Its bootstrap value is zero. Reward labels are displayed environmental properties; all learned Q-values begin at zero.

```text
sample = reward + gamma * max_a Q(next_state, a)
Q(state, action) = (1 - alpha) * old_Q + alpha * sample
```

The target is computed from the table before applying this action's update. Only the experienced state–action entry changes. No value iteration or scripted pathfinding is used.

A 500-move safety limit truncates long episodes, retaining the normal bootstrap on the last move. This is not a terminal reward and is counted separately. Constant alpha/epsilon in this teaching demo do not establish asymptotic convergence.

## Source and checks

- `src/engine.js`: both map definitions, deterministic transitions, immediate Q-learning, undo.
- `src/app.js`: display, controls, calculations and export.
- `src/style.css`, `src/template.html`: presentation.

After editing sources, run `python3 build.py` (Windows: `python build.py` or `py build.py`) to rebuild index.html. Python is not required to run the finished demo.

Optional Node.js checks:

```bash
node tests/engine.test.js
node tests/controls.test.js
```

Tests cover deterministic directions across states and seeds, immediate updates, wall/border behavior, exit reward timing, exact numerical propagation, frozen learning, undo/RNG restoration, fast training and export logic. Control tests use a DOM stub; full browser rendering and physical keyboard events have not been tested in this build environment.

Original educational implementation inspired by UC Berkeley CS188 and the supplied screenshot; not an official Berkeley tool. Reference: https://inst.eecs.berkeley.edu/~cs188/archive/sp25/projects/proj3/

## Display details

The robot marks the agent position. Gold outlines identify the updated state–action value. Blue outlines identify next-state maximizing actions used to compute the most recent sample, recorded before the update; all ties are marked. The equations show the sample followed by the weighted average of the old Q and sample. This is algebraically the same Q-learning update.

Cliff checks also verify the +10/−100 exit rewards, all map transitions, undo from ocean exits, and preservation of independent tab progress. The cliff SVG was rendered and visually inspected.

## Pac-Man: high exploration to learned policy

Open `index.html` and select **03 · Pac-Man exploration**. One 7×5 board starts
at ε = 0.80. Suggested lesson: train 100 episodes at 0.80, lower the slider to
0.30 and train again, then lower it to 0.05 and watch auto-play. Lowering ε NEVER
clears Q-values, position, food or episode history; learning continues. Reset
learning is the explicit reset and restores ε = 0.80. Learning is not guaranteed
after a fixed number of episodes; repeat training if needed.

Ghosts now occupy (3,2) and (4,3), using zero-based (column,row) coordinates
from the top-left. The middle ghost blocks the direct corridor, encouraging
safe upper/lower detours. All food remains reachable. Ghosts stay fixed and
movement is deterministic. Cyan policy arrows use the current remaining-food
mask at each position, showing all highest-Q ties. A dot indicates no updated
Q-values for that state. Policy rendering does not change the Q-table.

State = position + remaining-food mask. Rewards: −1 per action; +10 extra for
a new pellet; +30 extra for the last pellet. Ghost: −30 total, terminal.
α = 0.5, γ = 0.95; terminal bootstrap = 0. Episodes truncate at 120 actions
with the usual bootstrap retained. Food resets each episode; Q-values persist.
Greedy viewing uses ε = 0 with learning frozen; it still contributes statistics.
The displayed slider is disabled during greedy viewing and resumes its previous
value when learning is turned back on. The displayed average pools the latest
20 completed episodes and can include different epsilon settings.

Rebuild: `python3 build.py`. Tests: `node --test tests/*.test.js`.
