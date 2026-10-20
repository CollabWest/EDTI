const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const code = fs.readFileSync(path.join(root, 'assets/analytics.js'), 'utf8');
const ID = 'G-FMB2NVFD51';

function harness(url = 'https://www.edtechinsiders.org/', choice) {
  const events = {};
  const scripts = [];
  const cookies = [];
  const storage = new Map();
  if (choice !== undefined) storage.set('eti_privacy_v1', JSON.stringify({ version: 1, analytics: choice, savedAt: Date.now() }));
  const state = { page: 'home' };
  const button = value => ({
    listeners: {}, addEventListener(name, fn) { this.listeners[name] = fn; },
    getAttribute() { return value; }, focus() {}, click() { this.listeners.click(); }
  });
  const allow = button('allow'), decline = button('decline'), settings = button();
  const panel = { hidden: true, querySelector: () => decline };
  const document = {
    referrer: 'https://referrer.example/private-person?email=private@example.com',
    body: { classList: { toggle() {} } }, activeElement: settings,
    head: { appendChild(script) { scripts.push(script); } },
    createElement: () => ({}), getElementById: () => panel,
    querySelector: () => ({ id: 'page-' + state.page }),
    querySelectorAll: selector => selector === '[data-analytics-choice]' ? [decline, allow] : [settings],
    addEventListener(name, fn) { events[name] = fn; }
  };
  Object.defineProperty(document, 'cookie', {
    get: () => '_ga=old; _ga_FMB2NVFD51=old; unrelated=keep',
    set(value) { cookies.push(value); }
  });
  const window = { addEventListener() {} };
  vm.runInNewContext(code, { window, document, location: new URL(url),
    localStorage: { getItem: key => storage.get(key) || null, setItem: (key, value) => storage.set(key, value) },
    URL, URLSearchParams, WeakSet });
  const calls = () => Array.from(window.dataLayer || [], args => Array.from(args));
  const tracked = () => calls().filter(args => args[0] === 'event');
  return { allow, decline, panel, state, scripts, cookies, window, calls, tracked,
    navigate(page) { state.page = page; events['eti:pageview'](); } };
}

test('no Google script or event is created before opt-in or after essential-only choice', () => {
  const h = harness();
  assert.equal(h.panel.hidden, false);
  h.window.etiAnalytics.track('generate_lead', { form_id: 'partnership-inquiry' });
  h.decline.click();
  assert.equal(h.scripts.length, 0);
  assert.equal(h.calls().length, 0);
  assert.equal(h.window['ga-disable-' + ID], true);
});

test('localhost and Vercel previews never send production analytics, even with consent', () => {
  for (const url of ['http://127.0.0.1:4174/', 'https://edti.vercel.app/']) {
    const h = harness(url, true);
    h.allow.click();
    h.window.etiAnalytics.track('generate_lead');
    assert.equal(h.scripts.length, 0);
    assert.equal(h.tracked().length, 0);
  }
});

test('one loader and one manual view per route, with advertising disabled', () => {
  const h = harness();
  h.navigate('media');
  h.allow.click();
  h.navigate('media');
  h.navigate('partners');
  h.navigate('partners');
  assert.equal(h.scripts.length, 1);
  assert.match(h.scripts[0].src, /G-FMB2NVFD51$/);
  assert.deepEqual(h.tracked().map(args => args[2].page_name), ['media', 'partners']);
  const config = h.calls().find(args => args[0] === 'config')[2];
  assert.equal(config.send_page_view, false);
  assert.equal(config.allow_google_signals, false);
  assert.equal(config.allow_ad_personalization_signals, false);
  assert.equal(h.tracked()[1][2].page_referrer, 'https://www.edtechinsiders.org/media');
});

test('form details and arbitrary URL parameters cannot enter tracked payloads', () => {
  const h = harness('https://www.edtechinsiders.org/?email=private@example.com&utm_source=newsletter&utm_campaign=private%40example.com', true);
  h.window.etiAnalytics.track('generate_lead', { form_id: 'partnership-inquiry',
    email: 'private@example.com', name: 'Private Person', company: 'Private Company',
    message: 'Private message', link_domain: 'private@example.com', page_location: 'https://bad.example/' });
  const payload = JSON.stringify(h.tracked());
  assert.doesNotMatch(payload, /private|Private|bad\.example|email=/);
  assert.match(payload, /utm_source=newsletter/);
  assert.equal(h.tracked().at(-1)[2].form_id, 'partnership-inquiry');
});

test('withdrawing consent disables events and removes only Google Analytics cookies', () => {
  const h = harness(undefined, true);
  const count = h.tracked().length;
  h.decline.click();
  h.navigate('events');
  h.window.etiAnalytics.track('podcast_click');
  assert.equal(h.tracked().length, count);
  assert.equal(h.window['ga-disable-' + ID], true);
  assert.ok(h.cookies.some(cookie => cookie.startsWith('_ga=')));
  assert.ok(h.cookies.some(cookie => cookie.startsWith('_ga_FMB2NVFD51=')));
  assert.ok(h.cookies.every(cookie => !cookie.startsWith('unrelated=')));
});

const formCode = fs.readFileSync(path.join(root, 'index.html'), 'utf8')
  .split('/* ---- Partnership inquiry form ---- */')[1].split('</script>')[0];

async function submitForm(responseOK, bodyOK, honeypot = '') {
  let submit, reset = false;
  const tracked = [];
  const status = {}, button = {};
  const form = { querySelector: selector => selector === '[data-form-status]' ? status : button,
    reportValidity: () => true, reset: () => { reset = true; },
    addEventListener: (_, callback) => { submit = callback; } };
  vm.runInNewContext(formCode, { document: { querySelectorAll: () => [form] },
    FormData: class { entries() { return [['website', honeypot]]; } },
    fetch: async () => ({ ok: responseOK, json: async () => ({ ok: bodyOK }) }),
    window: { etiAnalytics: { track: (...args) => tracked.push(args) } } });
  submit({ preventDefault() {} });
  await new Promise(resolve => setImmediate(resolve));
  return { tracked, reset };
}

test('a lead is counted only after confirmed API success, never on errors or honeypot submissions', async () => {
  const success = await submitForm(true, true);
  assert.equal(success.tracked.length, 1);
  assert.equal(success.tracked[0][0], 'generate_lead');
  assert.equal(success.reset, true);
  for (const args of [[false, false], [true, false], [true, true, 'bot']]) {
    assert.equal((await submitForm(...args)).tracked.length, 0);
  }
});
