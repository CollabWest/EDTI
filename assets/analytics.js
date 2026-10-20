/* GA4: production domains only, with opt-in analytics consent. */
(function () {
  'use strict';
  var ID = 'G-FMB2NVFD51';
  var STORAGE_KEY = 'eti_privacy_v1';
  var CONSENT_AGE = 180 * 24 * 60 * 60 * 1000;
  var production = location.protocol === 'https:' &&
    ['edtechinsiders.org', 'www.edtechinsiders.org'].indexOf(location.hostname) !== -1;
  var pages = {
    home: ['/', 'Home'], media: ['/media', 'Media'], research: ['/research', 'Market Map'],
    events: ['/events', 'Events'], partners: ['/partners', 'Partnerships'],
    'partner-form': ['/partner-form', 'Partnership inquiry'], about: ['/about', 'About'],
    'higher-education-series': ['/higher-education-series', 'Higher Education Series']
  };
  var allowedEvents = ['partnership_cta_click', 'form_start', 'generate_lead',
    'newsletter_signup_click', 'plus_signup_click', 'podcast_click', 'podcast_play',
    'event_registration_click', 'market_map_click', 'higher_ed_series_click', 'contact_email_click'];
  var allowedParameters = ['placement', 'form_id', 'link_domain', 'audio_id'];
  var panel = document.getElementById('analytics-consent');
  var started = false;
  var lastPage = '';
  var lastLocation = '';
  var returnFocus = null;
  var startedForms = new WeakSet();
  var playedAudio = new WeakSet();

  function savedChoice() {
    try {
      var choice = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (choice && choice.version === 1 && typeof choice.analytics === 'boolean' &&
          typeof choice.savedAt === 'number' && choice.savedAt <= Date.now() &&
          Date.now() - choice.savedAt < CONSENT_AGE) return choice;
    } catch (_) { /* A storage restriction must not prevent use of the site. */ }
    return null;
  }
  var saved = savedChoice();
  var consent = !!(saved && saved.analytics);
  if (production) window['ga-disable-' + ID] = !consent;

  function currentPage() {
    var active = document.querySelector('main .page.active');
    var name = active ? active.id.replace('page-', '') : 'home';
    var page = pages[name] || pages.home;
    var url = new URL(page[0], location.origin);
    // Campaign attribution is useful; arbitrary query strings can contain form data.
    var query = new URLSearchParams(location.search);
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'utm_id'].forEach(function (key) {
      var value = query.get(key);
      if (value && value.length <= 120 && !/[@<>\r\n]/.test(value)) url.searchParams.set(key, value);
    });
    return { name: name, title: page[1] + ' | Edtech Insiders', url: url.href };
  }
  function sourceReferrer() {
    try { return new URL(document.referrer).origin + '/'; } catch (_) { return ''; }
  }
  function view() {
    if (!production || !consent || !started) return;
    var page = currentPage();
    if (page.name === lastPage) return;
    window.gtag('set', { page_location: page.url, page_title: page.title,
      page_referrer: lastLocation || sourceReferrer() });
    window.gtag('event', 'page_view', { send_to: ID, page_location: page.url,
      page_title: page.title, page_name: page.name, page_referrer: lastLocation || sourceReferrer() });
    lastPage = page.name;
    lastLocation = page.url;
  }
  function start() {
    if (!production || !consent) return;
    window['ga-disable-' + ID] = false;
    if (!started) {
      started = true;
      window.dataLayer = window.dataLayer || [];
      window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
      window.gtag('consent', 'default', { analytics_storage: 'denied', ad_storage: 'denied',
        ad_user_data: 'denied', ad_personalization: 'denied', personalization_storage: 'denied' });
      window.gtag('consent', 'update', { analytics_storage: 'granted' });
      window.gtag('js', new Date());
      var page = currentPage();
      window.gtag('config', ID, { send_page_view: false, allow_google_signals: false,
        allow_ad_personalization_signals: false, cookie_expires: 15552000,
        page_location: page.url, page_title: page.title, page_referrer: sourceReferrer() });
      var script = document.createElement('script');
      script.async = true;
      script.src = 'https://www.googletagmanager.com/gtag/js?id=' + ID;
      document.head.appendChild(script);
    } else {
      window.gtag('consent', 'update', { analytics_storage: 'granted' });
    }
    view();
  }
  function track(name, parameters) {
    if (!production || !consent || !started || allowedEvents.indexOf(name) === -1) return false;
    var page = currentPage();
    var data = { send_to: ID, page_name: page.name, page_location: page.url, page_title: page.title };
    allowedParameters.forEach(function (key) {
      var value = parameters && parameters[key];
      if (typeof value === 'string' && /^[a-z0-9_.-]{1,100}$/i.test(value)) data[key] = value;
    });
    window.gtag('event', name, data);
    return true;
  }
  function clearAnalyticsCookies() {
    document.cookie.split(';').forEach(function (entry) {
      var name = entry.split('=')[0].trim();
      if (!/^_ga(?:_|$)/.test(name)) return;
      ['', location.hostname, '.edtechinsiders.org'].forEach(function (domain) {
        document.cookie = name + '=; Max-Age=0; path=/' + (domain ? '; domain=' + domain : '');
      });
    });
  }
  function showPreferences(open, focus) {
    if (!panel) return;
    panel.hidden = !open;
    document.body.classList.toggle('analytics-choice-open', open);
    if (open && focus) {
      returnFocus = document.activeElement;
      panel.querySelector('[data-analytics-choice]').focus();
    }
    if (!open && returnFocus) { returnFocus.focus(); returnFocus = null; }
  }
  function applyChoice(allow) {
    consent = allow;
    if (allow) start();
    else {
      if (production) {
        window['ga-disable-' + ID] = true;
        if (started) window.gtag('consent', 'update', { analytics_storage: 'denied' });
        clearAnalyticsCookies();
      }
      lastPage = '';
      lastLocation = '';
    }
  }
  function choose(allow) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, analytics: allow, savedAt: Date.now() })); }
    catch (_) { /* Honor the choice in this tab even if it cannot be stored. */ }
    applyChoice(allow);
    showPreferences(false);
  }
  function placement(element) {
    if (element.closest('nav')) return 'navigation';
    if (element.closest('footer')) return 'footer';
    if (element.closest('#sticky-sub')) return 'newsletter_bar';
    if (element.closest('.sub-band')) return 'newsletter_section';
    return 'main';
  }

  window.etiAnalytics = { track: track };
  document.querySelectorAll('[data-analytics-choice]').forEach(function (button) {
    button.addEventListener('click', function () { choose(button.getAttribute('data-analytics-choice') === 'allow'); });
  });
  document.querySelectorAll('[data-cookie-settings]').forEach(function (button) {
    button.addEventListener('click', function () { showPreferences(true, true); });
  });
  window.addEventListener('storage', function (event) {
    if (event.key !== STORAGE_KEY && event.key !== null) return;
    var choice = savedChoice();
    applyChoice(!!(choice && choice.analytics));
    showPreferences(!choice);
  });
  document.addEventListener('eti:pageview', view);
  document.addEventListener('click', function (event) {
    var link = event.target.closest && event.target.closest('a[href]');
    if (!link) return;
    var url;
    try { url = new URL(link.href, location.origin); } catch (_) { return; }
    var data = { placement: placement(link) };
    if (url.protocol === 'mailto:') { track('contact_email_click', data); return; }
    if (!/^https?:$/.test(url.protocol)) return;
    data.link_domain = url.hostname;
    var route = (url.hash || url.pathname).replace(/^[/#]+|\/$/g, '');
    if (url.origin === location.origin) {
      if (route === 'partners' || route === 'partner-form') track('partnership_cta_click', data);
      else if (route === 'higher-education-series') track('higher_ed_series_click', data);
    } else if (url.hostname === 'edtechinsiders.substack.com' && /subscribe/.test(url.pathname)) {
      var promo = link.closest('.ed-promo');
      var plus = /plus/i.test(link.textContent) || (promo && /Insiders Plus/i.test(promo.textContent));
      track(plus ? 'plus_signup_click' : 'newsletter_signup_click', data);
    } else if (/(^|\.)(buzzsprout\.com|podcasts\.apple\.com|open\.spotify\.com|music\.amazon\.com)$/.test(url.hostname)) {
      track('podcast_click', data);
    } else if (/(^|\.)edtechinsiders\.ai$/.test(url.hostname)) track('market_map_click', data);
    else if (link.closest('.event-calendar-card') && /register/i.test(link.textContent)) track('event_registration_click', data);
  });
  document.addEventListener('submit', function (event) {
    if (event.target.matches('.sub-form, #sticky-sub form')) {
      track('newsletter_signup_click', { placement: placement(event.target) });
    }
  }, true);
  document.addEventListener('input', function (event) {
    var form = event.target.closest && event.target.closest('[data-partnership-form]');
    if (consent && form && !startedForms.has(form) && event.target.name !== 'website') {
      if (track('form_start', { form_id: 'partnership-inquiry', placement: placement(form) })) startedForms.add(form);
    }
  });
  document.addEventListener('play', function (event) {
    var audio = event.target;
    if (audio.tagName === 'AUDIO' && !playedAudio.has(audio)) {
      if (track('podcast_play', { audio_id: audio.id || 'episode-card', placement: 'main' })) playedAudio.add(audio);
    }
  }, true);
  showPreferences(!saved);
  if (consent) start();
})();
