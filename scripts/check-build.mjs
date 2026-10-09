import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { extensionId } from './extension-id.mjs';

const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
const sourceManifest = JSON.parse(readFileSync('public/manifest.json', 'utf8'));
const manifest = JSON.parse(readFileSync('dist/manifest.json', 'utf8'));

assert.equal(manifest.manifest_version, 3);
assert.equal(sourceManifest.version, packageJson.version, 'public/manifest.json version must match package.json.');
assert.equal(manifest.version, packageJson.version, 'Built extension version must match package.json.');
assert.equal(extensionId, 'nfhbegeoeafnpejpjdljhgagefbpafal', 'Development identity changed; do not rotate the key accidentally.');
assert.equal(manifest.key, sourceManifest.key);
assert.deepEqual(manifest.permissions, ['bookmarks', 'storage', 'favicon', 'tabs']);
assert.deepEqual(manifest.commands['open-dashboard-search'], {
  description: 'Open dashboard in search mode', suggested_key: { default: 'Ctrl+Shift+B', windows: 'Ctrl+Shift+B' }, global: false,
});
assert.ok(existsSync('dist/search.html'));
assert.ok(existsSync('dist/theme-init.js'));
for (const page of ['index', 'search']) {
  const html = readFileSync(`dist/${page}.html`, 'utf8');
  assert(html.indexOf('theme-init.js') < html.indexOf('type="module"'), 'Appearance cache must apply before the application.');
}
assert.ok(existsSync(`dist/${manifest.chrome_url_overrides.newtab}`));
assert.ok(existsSync(`dist/${manifest.background.service_worker}`));
assert.ok(!readFileSync('dist/index.html', 'utf8').includes('/src/'));
console.log(`MV3 package verified. Version: ${manifest.version}. Development extension ID: ${extensionId}`);
