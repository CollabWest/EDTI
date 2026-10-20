import assert from 'node:assert/strict';
const base = process.argv[2];
if (!base || new URL(base).protocol !== 'https:') throw new Error('Supply the HTTPS deployment address.');
for (const route of ['/', '/media', '/higher-education-series', '/research', '/events', '/partners', '/partner-form', '/about']) {
  const response = await fetch(base + route);
  assert.equal(response.status, 200, `${route}: HTTP ${response.status}`);
  const html = await response.text();
  const id = route === '/' ? 'home' : route.slice(1);
  assert.ok(html.includes(`id="page-${id}"`), route);
  assert.ok(html.includes(`rel="canonical" href="https://www.edtechinsiders.org${route}"`), route);
  assert.match(html, /name="description"/);
  if (route === '/partners') assert.doesNotMatch(html, /Naomi \[title to confirm\]|Draft placeholder/);
  console.log(`${route}: 200, correct page and search metadata`);
}
for (const [old, target] of [['/podcast','/media'],['/general-8','/media'],['/newsletter','/media'],['/contact-3','/about']]) {
  const response = await fetch(base + old, {redirect:'manual'});
  assert.ok([301,308].includes(response.status), `${old}: ${response.status}`);
  assert.equal(new URL(response.headers.get('location'), base).pathname, target);
  console.log(`${old}: ${response.status} to ${target}`);
}
for (const route of ['/robots.txt','/sitemap.xml','/assets/analytics.js']) {
  const response = await fetch(base + route);
  assert.equal(response.status,200,route);
  console.log(`${route}: 200`);
}
const validation = await fetch(base + '/api/partnership', {method:'POST', headers:{'Content-Type':'application/json'}, body:'{}'});
assert.equal(validation.status,400,'Form API must reject incomplete inquiries');
assert.ok((await validation.json()).error);
console.log('Partnership API: rejects incomplete inquiry with 400; no email sent.');
