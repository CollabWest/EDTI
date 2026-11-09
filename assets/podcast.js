(function () {
  const cards = document.querySelectorAll('[data-podcast-episode]');
  const guestTiles = document.querySelectorAll('.guest-tile[data-guest]');
  if (!cards.length && !guestTiles.length) return;

  const query = new URLSearchParams();
  for (const guest of new Set(Array.from(guestTiles, tile => tile.dataset.guest))) {
    query.append('guest', guest);
  }
  const endpoint = '/api/podcast' + (query.toString() ? '?' + query : '');
  const dateFormat = new Intl.DateTimeFormat('en-US', {
    month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC',
  });

  function updateEpisode(card, episode) {
    const audio = card.querySelector('audio');
    // Preserve a visitor's playback and position if they started listening.
    if (audio && (!audio.paused || audio.currentTime > 0)) return;
    card.hidden = !episode;
    if (!episode) return;

    card.querySelector('[data-episode-title]').textContent = episode.title;
    const link = card.querySelector('[data-episode-link]');
    if (link) link.href = episode.url;
    const date = card.querySelector('time');
    if (date) {
      date.dateTime = episode.date;
      date.textContent = dateFormat.format(new Date(episode.date));
    }
    const kind = card.querySelector('[data-episode-kind]');
    if (kind) kind.textContent = episode.kind;
    const duration = card.querySelector('[data-episode-duration]');
    if (duration) duration.textContent = episode.minutes ? ` · ${episode.minutes} min` : '';
    const summary = card.querySelector('[data-episode-summary]');
    if (summary) {
      summary.textContent = episode.summary;
      summary.hidden = !episode.summary;
    }
    const image = card.querySelector('img');
    if (image) {
      image.hidden = !episode.image;
      if (episode.image) image.src = episode.image;
      else image.removeAttribute('src');
    }
    if (audio) {
      audio.hidden = !episode.audio;
      if (episode.audio && audio.src !== episode.audio) audio.src = episode.audio;
      else if (!episode.audio) audio.removeAttribute('src');
    }
  }

  async function refreshEpisodes() {
    try {
      const response = await fetch(endpoint);
      if (!response.ok) return;
      const { episodes, guestLinks } = await response.json();
      if (!Array.isArray(episodes) || !episodes.length) return;
      for (const card of cards) updateEpisode(card, episodes[Number(card.dataset.podcastEpisode)]);
      for (const tile of guestTiles) {
        if (Object.prototype.hasOwnProperty.call(guestLinks, tile.dataset.guest)) {
          tile.href = guestLinks[tile.dataset.guest];
        }
      }
    } catch {
      // The page already includes a snapshot of recent episodes.
    }
  }

  refreshEpisodes();
  window.addEventListener('pageshow', event => {
    if (event.persisted) refreshEpisodes();
  });
}());
