import assert from 'node:assert/strict';
import { existsSync, lstatSync, readdirSync, readFileSync } from 'node:fs';
import { extname, join, relative, resolve } from 'node:path';

// This is the launch scope, not a format rule for future resources.
const expected = ['math-one-exams', 'math-two-exams'];
const output = resolve(process.argv[2] || 'dist');
const catalog = JSON.parse(readFileSync(join(output, 'catalog-index.json'), 'utf8'));
assert.deepEqual(catalog.map(book => book.slug).sort(), expected, 'Unexpected launch catalog');
const chapterCounts = Object.fromEntries(catalog.map(book => [book.slug, book.chapters]));
assert.equal(chapterCounts['math-one-exams'], 17, 'Math I must contain 17 exams');
// Math II contains 27 year-based exam papers; reviewed mistake chapters are supplemental,
// and must not be counted as additional examination years.
const mathTwoSupplementCount = readdirSync(resolve('content', 'math-two-exams', 'chapters'))
  .filter(name => /^mistakes-\d{4}\.md$/.test(name)).length;
assert.equal(chapterCounts['math-two-exams'], 27 + mathTwoSupplementCount,
  'Math II must contain 27 exams plus the reviewed mistake chapters');
assert.deepEqual(readdirSync(join(output, 'books')).sort(), expected, 'Unexpected reader routes');
assert.deepEqual(readdirSync(join(output, 'book-assets')).sort(), expected, 'Stale book assets');

function filesUnder(root) {
  return readdirSync(root).flatMap(name => {
    const path = join(root, name);
    const stat = lstatSync(path);
    assert.ok(!stat.isSymbolicLink(), `Unexpected symlink: ${path}`);
    return stat.isDirectory() ? filesUnder(path) : [path];
  });
}

let figures = 0;
for (const book of catalog) {
  const source = resolve('content', book.slug);
  const assets = join(output, 'book-assets', book.slug);
  const authoredFiles = filesUnder(source).map(path => relative(source, path)).sort();
  assert.deepEqual(filesUnder(assets).map(path => relative(assets, path)).sort(), authoredFiles, `Asset mismatch: ${book.slug}`);
  assert.ok(authoredFiles.every(path => ['.md', '.jpg', '.svg'].includes(extname(path))), 'Only approved Markdown and figures belong in this launch');
  const imageReferences = new Set();
  const chapters = readdirSync(join(source, 'chapters')).sort();
  const expectedStart = book.slug === 'math-two-exams' ? 2000 : 2010;
  const expectedCount = book.slug === 'math-two-exams' ? 27 : 17;
  const examFiles = Array.from({ length: expectedCount }, (_, i) => `${expectedStart + i}.md`);
  const supplementaryFiles = book.slug === 'math-two-exams'
    ? chapters.filter(name => /^mistakes-\d{4}\.md$/.test(name))
    : [];
  assert.deepEqual(chapters, [...examFiles, ...supplementaryFiles].sort(),
    `Unexpected exam or supplement chapters: ${book.slug}`);
  for (const name of chapters) {
    const markdown = readFileSync(join(source, 'chapters', name), 'utf8');
    const html = readFileSync(join(output, 'books', book.slug, 'chapters', name.replace('.md', ''), 'index.html'), 'utf8');
    assert.ok(!/data-source-pdf|<a\b[^>]*href=["'][^"']*\.pdf/i.test(html), `Unpublished PDF link: ${name}`);
    for (const match of markdown.matchAll(/<img\b[^>]*src="([^"]+)"/g)) {
      const path = resolve(source, 'chapters', match[1]);
      assert.ok(path.startsWith(`${source}/`) && existsSync(path), `Missing or out-of-root image: ${match[1]}`);
      imageReferences.add(relative(source, path));
      figures++;
    }
    for (const match of html.matchAll(/<img\b[^>]*src="([^"]+)"/g)) {
      const prefix = book.href.split('/books/')[0];
      const url = new URL(match[1], 'https://site.example');
      assert.equal(url.origin, 'https://site.example');
      assert.ok(url.pathname.startsWith(`${prefix}/book-assets/${book.slug}/`), `Incorrect image base path: ${url.pathname}`);
      assert.ok(existsSync(join(output, decodeURIComponent(url.pathname.slice(prefix.length)))), `Missing rendered image: ${url.pathname}`);
    }
  }
  assert.deepEqual(authoredFiles.filter(path => ['.jpg', '.svg'].includes(extname(path))).sort(), [...imageReferences].sort(), 'Unreferenced images must stay local');
}
assert.ok(!filesUnder(output).some(path => extname(path).toLowerCase() === '.pdf'), 'PDF found in deployment output');
console.log(`Release valid: ${catalog.length} collections, 44 exams, ${figures} figures, no PDFs or demo routes`);
