/* Load once to retain learning between module visits; pause when hidden. */
(function () {
  'use strict';
  const view = document.getElementById('rlView');
  const frame = document.getElementById('rlFrame');
  function sync() {
    if (!view.classList.contains('hidden')) {
      if (!frame.getAttribute('src')) frame.setAttribute('src', frame.dataset.src);
    } else if (frame.getAttribute('src')) {
      try {
        const doc = frame.contentDocument;
        doc?.getElementById('pause')?.click();
        doc?.getElementById('pac-pause')?.click();
      } catch (_) { /* Standalone file origins may restrict frame access. */ }
    }
  }
  new MutationObserver(sync).observe(view, { attributes: true, attributeFilter: ['class'] });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      try {frame.contentDocument?.getElementById('pause')?.click();frame.contentDocument?.getElementById('pac-pause')?.click();} catch (_) {}
    }
  });
  sync();
})();
