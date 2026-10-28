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
  // The visual copy still needs hover names, but must not duplicate keyboard stops.
  copy.querySelectorAll('[tabindex]').forEach(function (tile) { tile.removeAttribute('tabindex'); });
  copy.querySelectorAll('img').forEach(function (img) { img.alt = ''; });
  track.appendChild(group);
  track.appendChild(copy);
  row.appendChild(track);
  row.classList.add('is-animated');

}());
