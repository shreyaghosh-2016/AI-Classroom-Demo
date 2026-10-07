# CSP Module — classroom-focused revision

This revision intentionally implements only the lecture-05 CSP demos:

1. BFS — separate tab; CSP search tree shown level-by-level with one variable per level.
2. DFS — separate tab; one branch followed depth-first in the same assignment tree.
3. Backtracking — fixed variable order, immediate fail-on-violation.
4. Forward Checking — domains are maintained and incompatible values are crossed out only from unassigned neighbors of the newly assigned variable.
5. Arc Consistency — directed arcs are revised; unsupported values are deleted from the tail and affected neighbors are re-enqueued.
6. MRV + LCV — MRV chooses the smallest remaining domain; LCV scores values by how many neighbor-domain values they eliminate. Arc consistency is maintained after assignments, matching the lecture demo progression.

Two problems are available in every tab:
- Australia constraint graph (no Australia map picture)
- Layered graph-coloring CSP inspired by the classroom screenshot

Every demo supports Previous, Next, Auto Play, Reset, and left/right arrow keys. Remaining domains are always visible below the graph nodes and in the domain panel.
