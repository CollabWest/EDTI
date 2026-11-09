(function () {
  const calendar = document.querySelector('[data-event-calendar]');
  if (!calendar || !/^https?:$/.test(location.protocol)) return;

  const month = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });
  const day = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
  const today = new Intl.DateTimeFormat('sv-SE', { timeZone: 'America/New_York' }).format(new Date());

  for (const card of calendar.querySelectorAll('[data-event-end]')) {
    if (card.dataset.eventEnd < today) card.remove();
  }
  for (const section of calendar.querySelectorAll('.event-calendar-month')) {
    if (!section.querySelector('.event-calendar-card')) section.remove();
  }

  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  }

  function eventCard(event) {
    const card = element('article', 'event-calendar-card');
    if (event.image) {
      const image = element('img', 'event-calendar-image');
      image.alt = '';
      image.loading = 'lazy';
      image.referrerPolicy = 'no-referrer';
      image.addEventListener('error', () => image.remove(), { once: true });
      image.src = event.image;
      card.append(image);
    }
    const start = event.start && new Date(event.start);
    const end = event.end && event.end !== event.start && new Date(event.end);
    const dates = start ? (end ? day.formatRange(start, end) : day.format(start)) : 'Date to be announced';
    const label = [event.featured && 'Featured', event.kind].filter(Boolean).join(' · ');
    card.append(element('div', 'event-calendar-date', dates));
    if (label) card.append(element('div', 'event-calendar-type', label));
    card.append(element('h4', '', event.title));
    const location = event.location || event.format;
    if (location) card.append(element('p', 'event-calendar-location', location));
    if (event.summary) card.append(element('p', 'event-calendar-location', event.summary));
    if (event.url) {
      const link = element('a', 'event-calendar-register', 'Register now ↗');
      link.href = event.url;
      link.target = '_blank';
      link.rel = 'noopener';
      card.append(link);
    }
    return card;
  }

  async function refreshEvents() {
    try {
      const response = await fetch('/api/events');
      if (!response.ok) return;
      const { events } = await response.json();
      if (!Array.isArray(events)) return;
      const content = document.createDocumentFragment();
      let group;
      let grid;
      for (const event of events) {
        const key = event.start.slice(0, 7);
        if (!grid || key !== group) {
          group = key;
          const section = element('div', 'event-calendar-month');
          grid = element('div', 'event-calendar-grid');
          section.append(element('h3', '', key ? month.format(new Date(event.start)) : 'Dates to be announced'), grid);
          content.append(section);
        }
        grid.append(eventCard(event));
      }
      if (!events.length) content.append(element('p', '', 'Check back soon for upcoming events.'));
      calendar.replaceChildren(content);
    } catch {
      // Keep the calendar snapshot if Google Sheets is temporarily unavailable.
    }
  }

  refreshEvents();
  window.addEventListener('pageshow', event => {
    if (event.persisted) refreshEvents();
  });
}());
