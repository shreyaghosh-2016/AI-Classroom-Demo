# AI Course (IIT BBSR) — Interactive Classroom Demos

Interactive static website for Dr. Shreya Ghosh's AI course at IIT Bhubaneswar.

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

## Deploy to GitHub Pages

Push the repository to GitHub. The workflow in `.github/workflows/deploy-pages.yml` deploys the site automatically.

In the repository, set **Settings → Pages → Source → GitHub Actions**.
