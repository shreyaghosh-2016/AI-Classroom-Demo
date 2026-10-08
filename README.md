# AI Course (IIT BBSR) — Interactive Classroom Demos

Interactive website for AI course at IIT Bhubaneswar.

## Included modules

- Automated Problem Solving
  - Two-Jug Problem
  - 8-Puzzle Problem
  - 8-Queens Problem
- Search Techniques
  - BFS
  - DFS
  - Uniform-Cost Search
  - Greedy Best-First Search
  - A* Search

## Run locally

Because the site uses JavaScript modules, do not open `index.html` directly with a `file://` URL.

Use VS Code Live Server, or run:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`.



## Reinforcement Learning — Module 05

The homepage's Reinforcement Learning card now opens the complete Q-learning lab:

- Gridworld: step-by-step updates, Q values, manual moves, training and undo.
- Cliff & Island: learn to reach +10 while avoiding −100 ocean exits.
- Pac-Man: one learner with five pellets and fixed ghosts; start at ε = 0.80,
  train, then lower ε to 0.30 and 0.05 without clearing learned values.

The lab is embedded in the classroom and can also open full-screen. “All modules”
returns home, pauses the lab, and retains its state while the page remains open.
Reloading the page clears learning. RL controls are separate from other modules.

### Update the existing GitHub Pages repository

This archive contains the complete project, not a patch. Upload the **contents**
of `AI-Classroom-Demo` into the repository root (do not nest that folder).
The files required for this update are:

- `index.html` (updated module card and view)
- `js/app.js` (RL navigation entry)
- `js/rl-module.js` (new integration)
- `rl/` (complete new lab folder)
- `README.md` (these instructions)

This package is based on the uploaded snapshot. If the live repository has newer
edits to `index.html` or `js/app.js`, merge those changes rather than replacing them
with this older snapshot. GitHub Pages uses the same static hosting setup.
Rebuild the lab after editing its source: `python3 rl/build.py`.
Run RL tests: `node --test rl/tests/*.test.js`.


## Probabilistic AI module
Open the Probabilistic AI card from the homepage. No installation or API key is needed.

- Alarm Network Explorer: true/false/unknown evidence, query selection, editable CPTs, exact posterior probabilities, explaining-away presets, enumeration steps, and joint-assignment products.
- Conditional Independence Playground: chain, fork, collider with descendant, and Asia network; evidence selection, prediction/reveal, and every-path inspection.
- Click graph nodes or use the selectors. Unknown means unobserved.
- Suggested classroom sequence: John calls → Both call → Alarm sounds → Alarm + earthquake; then chain/fork with the middle node observed; collider with no evidence, collider observed, and descendant observed.

New modules use the existing theme. No projector modifications are included.
