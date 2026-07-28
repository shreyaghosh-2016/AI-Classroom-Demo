# Search Algorithm Visualizer

A classroom-friendly, interactive visualization of classical AI search algorithms. It runs entirely in the browser and requires no backend or external JavaScript library.

## Algorithms included

- Breadth-First Search (BFS)
- Depth-First Search (DFS)
- Uniform-Cost Search (UCS)
- Greedy Best-First Search
- A* Search

## Features

- Automatic animation and manual step-by-step execution
- Live frontier and explored-set display
- Edge costs and node heuristic values
- Final path and path-cost highlighting
- Draggable graph nodes
- Default and randomly weighted graph presets
- Adjustable animation speed
- Responsive light/dark interface

## Run locally

Because the project uses JavaScript modules, serve the folder through a local web server instead of opening `index.html` directly.

### Python

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

### VS Code

Install the **Live Server** extension, right-click `index.html`, and select **Open with Live Server**.

## Deploy with GitHub Pages

1. Create a new GitHub repository.
2. Upload all files from this folder.
3. Push to the `main` branch.
4. Open **Settings → Pages** in the repository.
5. Under **Build and deployment**, select **GitHub Actions**.
6. The included workflow will deploy the site automatically.

Your site will normally be available at:

```text
https://YOUR-USERNAME.github.io/REPOSITORY-NAME/
```

## Project structure

```text
search-algorithm-visualizer/
├── .github/workflows/deploy-pages.yml
├── index.html
├── styles.css
├── js/
│   ├── app.js
│   ├── graph-data.js
│   └── algorithms/
│       ├── common.js
│       ├── bfs.js
│       ├── dfs.js
│       ├── ucs.js
│       ├── greedy.js
│       └── astar.js
├── LICENSE
└── README.md
```

## Customization

Edit `js/graph-data.js` to change the default graph. Each node has an ID, coordinates, and heuristic value:

```js
{ id: 'A', x: 100, y: 260, h: 10 }
```

Each undirected edge has endpoints and a cost:

```js
{ from: 'A', to: 'B', cost: 2 }
```

## License

MIT
