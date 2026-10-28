/* A seamless left-to-right guest row, retaining a static row for reduced motion. */
(function () {
  'use strict';
  var row = document.querySelector('.series-headshots');
  if (!row) return;
  var portraits = Array.from(row.children);
  if (!portraits.length) return;
  var track = document.createElement('div');
  track.className = 'series-headshots-track';
  var group = document.createElement('div');
  group.className = 'series-headshots-group';
  portraits.forEach(function (portrait) { group.appendChild(portrait); });
  var copy = group.cloneNode(true);
  copy.setAttribute('aria-hidden', 'true');
  copy.inert = true;
  copy.querySelectorAll('img').forEach(function (img) { img.alt = ''; });
  track.appendChild(group);
  track.appendChild(copy);
  row.appendChild(track);
  row.classList.add('is-animated');

  function fitPortraits() {
    // Match the previous responsive tile width, then increase both dimensions 10%.
    var original = Math.min(100, Math.max(72, (row.clientWidth - (portraits.length - 1) * 8) / portraits.length));
    row.style.setProperty('--series-headshot-width', (original * 1.1) + 'px');
  }
  fitPortraits();
  if (window.ResizeObserver) new ResizeObserver(fitPortraits).observe(row);
  else window.addEventListener('resize', fitPortraits);

  var toggle = document.querySelector('.series-motion-toggle');
  if (toggle) {
    toggle.hidden = false;
    toggle.addEventListener('click', function () {
      var paused = row.classList.toggle('is-paused');
      toggle.textContent = paused ? 'Play' : 'Pause';
      toggle.setAttribute('aria-pressed', String(paused));
      toggle.setAttribute('aria-label', (paused ? 'Resume' : 'Pause') + ' headshot animation');
    });
  }
}());
