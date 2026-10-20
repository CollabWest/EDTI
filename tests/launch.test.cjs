const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.join(__dirname, '..');
const routes = ['home','media','higher-education-series','research','events','partners','partner-form','about'];
test('every public page has its own visible initial HTML and search metadata', () => {
  for (const id of routes) {
    const route = id === 'home' ? '' : id;
    const html = fs.readFileSync(path.join(root, 'public', route, 'index.html'), 'utf8');
    const main = html.match(/<main>([\s\S]*?)<\/main>/)[1];
    assert.equal((main.match(/id="page-/g)||[]).length, 1, id);
    assert.match(main, new RegExp(`class="page[^\"]* active" id="page-${id}"`));
    assert.ok(html.includes(`rel="canonical" href="https://www.edtechinsiders.org/${route}"`), id);
    assert.match(html, /name="description" content="[^"]+"/);
    assert.doesNotMatch(html, /href="#(?:home|media|events|partners|research|about|partner-form)"/);
    for (const match of html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)) new vm.Script(match[1]);
    for (const match of html.matchAll(/(?:src|href)="(\/assets\/[^"?]+)"/g)) assert.ok(fs.existsSync(path.join(root, 'public', match[1])), match[1]);
  }
});
test('guest walls and the approved About photograph survive standalone rendering', () => {
  const media = fs.readFileSync(path.join(root, 'public/media/index.html'), 'utf8').split('<main>')[1].split('</main>')[0];
  const guests = [...media.matchAll(/data-guest="([^"]+)"/g)].map(m => m[1]);
  assert.deepEqual(guests.slice(0,5), ['Sal Khan','Sam Altman','Hillary Clinton','Nicholas Kristof','Reid Hoffman']);
  assert.equal(guests.length,10);
  const partners = fs.readFileSync(path.join(root, 'public/partners/index.html'), 'utf8');
  assert.match(partners, /id="partner-guest-wall"[^>]*><a class="guest-tile/);
  assert.doesNotMatch(partners, /Naomi \[title to confirm\]|Draft placeholder|Quote pending approval/);
  const about = fs.readFileSync(path.join(root, 'public/about/index.html'), 'utf8');
  assert.match(about, /<img src="[^"]+" id="about-contact-photo"/);
});
test('old addresses have permanent redirects and existing core addresses remain', () => {
  const config = JSON.parse(fs.readFileSync(path.join(root,'vercel.json')));
  for (const old of ['/podcast','/general-8','/contact-3']) assert.ok(config.redirects.some(r => r.source === old && r.permanent));
  for (const current of ['/events','/about','/higher-education-series']) assert.ok(config.rewrites.some(r => r.source === current));
  const sitemap = fs.readFileSync(path.join(root,'public/sitemap.xml'),'utf8');
  assert.equal((sitemap.match(/<loc>/g)||[]).length, routes.length);
  assert.ok(!sitemap.includes('#'));
});
