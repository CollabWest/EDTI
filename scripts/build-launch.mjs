import { readFileSync, mkdirSync, writeFileSync, cpSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

// One initial-HTML page per address, preserving the approved shared layout.
const root = fileURLToPath(new URL('../', import.meta.url));
const source = readFileSync(path.join(root, 'index.html'), 'utf8');
const output = path.join(root, 'public');
const origin = 'https://www.edtechinsiders.org';
const pages = [
  ['home', '/', "Edtech Insiders: Where Edtech's most important conversations happen", 'Podcasts, newsletters, research, events, and partnerships connecting the people shaping education technology.'],
  ['media', '/media', 'Podcast, Newsletter & Insiders Plus | Edtech Insiders', 'Listen to Edtech Insiders interviews, read the newsletter, and explore Insiders Plus membership.'],
  ['higher-education-series', '/higher-education-series', 'Higher Education Series with Matthew Rascoff | Edtech Insiders', 'Explore the ideas, innovations, and leaders shaping higher education in the series hosted by Matthew Rascoff.'],
  ['research', '/research', 'Edtech AI Market Map | Edtech Insiders', 'Explore the Edtech Insiders Generative AI Market Map and discuss funding future research.'],
  ['events', '/events', 'Events & Community Gatherings | Edtech Insiders', 'Find Edtech Insiders events, webinars, happy hours, and opportunities to connect with the education technology community.'],
  ['partners', '/partners', 'Partnerships | Edtech Insiders', 'Explore brand awareness, thought leadership, and convening partnerships with Edtech Insiders.'],
  ['partner-form', '/partner-form', 'Start a Partnership Conversation | Edtech Insiders', 'Contact the team about a sponsorship, research project, event, or custom partnership.'],
  ['about', '/about', 'About Edtech Insiders | Alex Sarlin & Ben Kornell', 'Meet co-founders Alex Sarlin and Ben Kornell and learn about Edtech Insiders media and community.'],
];
const routes = Object.fromEntries(pages.map(([id, route]) => [id, route]));
Object.assign(routes, { podcast: '/media', newsletter: '/media', plus: '/media' });
const main = source.match(/<main>([\s\S]*?)<\/main>/)?.[1];
if (!main) throw new Error('Main content is missing.');
const sections = Object.fromEntries(main.split(/<!-- ================= [^\n]+ ================= -->/)
  .map(part => [part.match(/id="page-([^"]+)"/)?.[1], part.trim()]).filter(([id]) => id));
const guests = sections.home.match(/<a class="guest-tile[\s\S]*?<\/a>/g) || [];
const interviewImage = sections.home.match(/class="hosts-photo"[\s\S]*?<img[^>]*src="([^"]+)"/)?.[1];
const escape = value => value.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

function prepareSection(id) {
  let section = sections[id];
  if (!section) throw new Error(`Missing page: ${id}`);
  section = section.replace(/class="page([^"]*)"/, 'class="page$1 active"');
  if (id === 'media') {
    const lead = ['Sal Khan', 'Sam Altman', 'Hillary Clinton', 'Nicholas Kristof'];
    const ordered = lead.map(name => guests.find(tile => tile.includes(`data-guest="${name}"`))).filter(Boolean);
    ordered.push('<a class="guest-tile tone-indigo" data-guest="Reid Hoffman" href="https://edtechinsiders.buzzsprout.com" target="_blank" rel="noopener" aria-label="Listen to Reid Hoffman on the Edtech Insiders podcast"><img src="/assets/guests/reid-hoffman.jpg" alt="Reid Hoffman" loading="lazy"><span class="guest-tile-overlay"><span class="guest-tile-name">Reid Hoffman</span><span class="guest-tile-role">Co-founder, LinkedIn</span><span class="guest-tile-listen">Listen →</span></span></a>');
    guests.forEach(tile => { if (!ordered.includes(tile) && ordered.length < 10) ordered.push(tile); });
    // Replace the old nested placeholder grid as one balanced div element.
    const opening = section.match(/<div class="guest-wall"[^>]*>/);
    if (!opening) throw new Error('Media guest grid is missing.');
    const start = opening.index;
    let depth = 0;
    for (const token of section.slice(start).matchAll(/<div\b[^>]*>|<\/div>/g)) {
      depth += token[0].startsWith('</') ? -1 : 1;
      if (!depth) {
        section = section.slice(0, start) + '<div class="media-guest-grid">' + ordered.join('') + '</div>' + section.slice(start + token.index + token[0].length);
        break;
      }
    }
  }
  if (id === 'partners') {
    section = section.replace(/(<div[^>]*id="partner-guest-wall"[^>]*>)<\/div>/, '$1' + guests.slice(0, 12).join('') + '</div>');
    // Preserve the design draft in source; never publish invented partner quotations.
    section = section.replace(/<section class="section partner-testimonials"[\s\S]*?<\/section>/, '');
  }
  if (id === 'about' && interviewImage) section = section.replace('<img id="about-contact-photo"', `<img src="${interviewImage}" id="about-contact-photo"`);
  return section;
}

mkdirSync(output, { recursive: true });
cpSync(path.join(root, 'assets'), path.join(output, 'assets'), { recursive: true });
for (const [id, route, title, description] of pages) {
  const canonical = origin + route;
  const metadata = `<title>${escape(title)}</title>\n<meta name="description" content="${escape(description)}">\n<link rel="canonical" href="${canonical}">\n<meta property="og:type" content="website">\n<meta property="og:title" content="${escape(title)}">\n<meta property="og:description" content="${escape(description)}">\n<meta property="og:url" content="${canonical}">\n<meta property="og:site_name" content="Edtech Insiders">`;
  let page = source.replace(/<title>[\s\S]*?<\/title>/, metadata)
    .replace(/<main>[\s\S]*?<\/main>/, `<main>\n${prepareSection(id)}\n</main>`)
    .replace(/href="#(home|media|research|events|partners|partner-form|about|podcast|newsletter|plus)"/g, (_, key) => `href="${routes[key]}"`)
    .replace(/(src|href)="assets\//g, '$1="/assets/');
  page = page.replace("  var FEED='https://feeds.buzzsprout.com/1877869.rss';", "  if(!document.querySelector('.guest-tile')&&!document.getElementById('episode-list')&&!document.getElementById('hero-epi'))return;\n  var FEED='https://feeds.buzzsprout.com/1877869.rss';");
  const directory = path.join(output, route.slice(1));
  mkdirSync(directory, { recursive: true });
  writeFileSync(path.join(directory, 'index.html'), page);
}
writeFileSync(path.join(output, 'sitemap.xml'), '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + pages.map(([,route]) => `  <url><loc>${origin}${route}</loc></url>`).join('\n') + '\n</urlset>\n');
writeFileSync(path.join(output, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${origin}/sitemap.xml\n`);
console.log(`Built ${pages.length} standalone pages, sitemap, robots.txt, and shared assets in public/.`);
