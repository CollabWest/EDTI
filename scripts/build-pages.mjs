import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

// Reuse the site's source layout, styles, navigation, and footer for a real page.
// Run locally after editing index.html; Vercel also runs this before deployment.
const root = fileURLToPath(new URL('../', import.meta.url));
const source = readFileSync(path.join(root, 'index.html'), 'utf8');
const start = '<!-- ================= HIGHER EDUCATION SERIES ================= -->';
const end = '<!-- ================= RESEARCH & TOOLS ================= -->';
if (!source.includes(start) || !source.includes(end)) {
  throw new Error('Higher Education Series source markers are missing.');
}
const section = source.split(start)[1].split(end)[0]
  .replace('class="page higher-ed-page"', 'class="page higher-ed-page active"');
const title = 'Higher Education Series with Matthew Rascoff | Edtech Insiders';
const description = 'Explore the ideas, innovations, and leaders shaping the future of higher education. The Edtech Insiders HigherEd Podcast Series, hosted by Matthew Rascoff.';
const canonical = 'https://www.edtechinsiders.org/higher-education-series';
const metadata = `<meta name="description" content="${description}">
<link rel="canonical" href="${canonical}">
<meta property="og:type" content="website">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${description}">
<meta property="og:url" content="${canonical}">
<meta property="og:site_name" content="Edtech Insiders">`;
let page = source
  .replace(/<title>[\s\S]*?<\/title>/, `<title>${title}</title>\n${metadata}`)
  .replace(/<main>[\s\S]*?<\/main>/, `<main>\n${section}\n</main>`)
  // Other sections remain at the site root until the wider SEO migration.
  .replace(/href="#(home|media|research|events|partners|partner-form|about|podcast|newsletter|plus)"/g, 'href="/#$1"');
// The series has no guest wall or latest-episode widgets, so skip their feed.
page = page.replace("  var FEED='https://feeds.buzzsprout.com/1877869.rss';", "  if(!document.getElementById('page-media')&&!document.getElementById('page-home'))return;\n  var FEED='https://feeds.buzzsprout.com/1877869.rss';");
const destination = path.join(root, 'higher-education-series');
mkdirSync(destination, { recursive: true });
writeFileSync(path.join(destination, 'index.html'), page);
console.log('Built /higher-education-series with shared site layout and page-specific metadata.');
