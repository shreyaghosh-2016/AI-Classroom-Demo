"""Rebuild the dependency-free index.html after editing src/. Requires Python 3."""
from pathlib import Path
base = Path(__file__).resolve().parent
text = (base / 'src/template.html').read_text()
for marker, filename in [('STYLE', 'style.css'), ('ENGINE', 'engine.js'), ('APP', 'app.js'), ('PACENGINE', 'pacman-engine.js'), ('PACAPP', 'pacman.js')]:
    text = text.replace('/* ' + marker + ' */', (base / 'src' / filename).read_text())
(base / 'index.html').write_text(text)
print('Built index.html')
