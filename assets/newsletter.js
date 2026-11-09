(function () {
  const cards = document.querySelectorAll('[data-newsletter-story]');
  if (!cards.length) return;

  const dateFormat = new Intl.DateTimeFormat('en-US', {
    month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC',
  });

  async function refreshStories() {
    try {
      const response = await fetch('/api/newsletter');
      if (!response.ok) return;
      const { stories } = await response.json();
      if (!Array.isArray(stories) || !stories.length) return;

      for (const card of cards) {
        const story = stories[Number(card.dataset.newsletterStory)];
        card.hidden = !story;
        if (!story) continue;

        card.querySelector('[data-story-title]').textContent = story.title;
        card.querySelector('a').href = story.url;
        const date = card.querySelector('time');
        date.dateTime = story.date;
        date.textContent = dateFormat.format(new Date(story.date));

        const summary = card.querySelector('[data-story-summary]');
        if (summary) summary.textContent = story.summary;
        const image = card.querySelector('img');
        if (image) {
          image.hidden = !story.image;
          if (story.image) image.src = story.image;
          else image.removeAttribute('src');
        }
      }
    } catch {
      // The page already includes a snapshot of recent stories.
    }
  }

  for (const card of cards) {
    const image = card.querySelector('img');
    if (image) image.addEventListener('error', () => { image.hidden = true; });
  }
  refreshStories();
  window.addEventListener('pageshow', event => {
    if (event.persisted) refreshStories();
  });
}());
