import assert from 'node:assert/strict';
import { access, readFile, readdir } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';

const dist = resolve('dist');
const isGitHubPages = process.env.GITHUB_ACTIONS === 'true';
const base = isGitHubPages ? '/senai_quadra/' : './';
const appScope = isGitHubPages ? '/senai_quadra/' : '/';
const html = await readFile(join(dist, 'index.html'), 'utf8');
const urls = [...html.matchAll(/(?:src|href)=["']([^"']+)["']/g)].map((match) => match[1]);
const jsUrl = urls.find((url) => url.startsWith(`${base}assets/`) && url.endsWith('.js'));
const cssUrl = urls.find((url) => url.startsWith(`${base}assets/`) && url.endsWith('.css'));

assert.ok(jsUrl, `index.html must reference a JavaScript bundle under ${base}assets/`);
assert.ok(cssUrl, `index.html must reference a CSS bundle under ${base}assets/`);

async function verifyPagesUrl(url) {
  assert.ok(url.startsWith(base), `Expected an asset URL under ${base}: ${url}`);
  const file = resolve(dist, decodeURIComponent(url.slice(base.length)));
  assert.ok(file.startsWith(`${dist}${process.platform === 'win32' ? '\\' : '/'}`), `Asset path escapes dist: ${url}`);
  await access(file);
  return file;
}

const referencedFiles = await Promise.all(urls.filter((url) => url.startsWith(base)).map(verifyPagesUrl));
const cssFile = referencedFiles[urls.filter((url) => url.startsWith(base)).indexOf(cssUrl)];
assert.ok(cssFile, 'The CSS bundle was not found in dist.');

const css = await readFile(cssFile, 'utf8');
const localCssAssets = [...css.matchAll(/url\(["']?([^"')]+)["']?\)/g)]
  .map((match) => match[1])
  .filter((url) => !/^(?:data:|https?:|\/\/|#)/i.test(url));
await Promise.all(localCssAssets.map((url) => url.startsWith(base)
  ? verifyPagesUrl(url)
  : access(resolve(dirname(cssFile), decodeURIComponent(url)))));

const manifest = JSON.parse(await readFile(join(dist, 'manifest.webmanifest'), 'utf8'));
assert.equal(manifest.start_url, appScope, `PWA start_url must use ${appScope}.`);
assert.equal(manifest.scope, appScope, `PWA scope must use ${appScope}.`);
for (const icon of manifest.icons ?? []) {
  await access(resolve(dist, decodeURIComponent(icon.src.replace(/^\.\//, ''))));
}

for (const file of ['sw.js', 'registerSW.js']) {
  await access(join(dist, file));
}
const workboxFiles = (await readdir(dist)).filter((file) => /^workbox-.*\.js$/.test(file));
assert.ok(workboxFiles.length > 0, 'Expected a generated Workbox runtime file.');

console.log(`Build assets verified for ${isGitHubPages ? 'GitHub Pages' : 'root deployment'}: ${jsUrl}, ${cssUrl}; PWA manifest and service worker files exist.`);
