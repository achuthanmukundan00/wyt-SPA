import { cp, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

// PRESSURE TEST is published at watchyourtemper.com/pressure-test/ from this
// site's assets. Build it in its own repository (npm run check there), then run
// this from watchyourtemper-site/ to copy its dist/ into public/pressure-test/
// and its security headers into public/_headers, commit the result, push, and
// deploy with ../deploy.sh (see ../AGENTS.md).
const source = resolve(process.argv[2] ?? '../../pressure-test');
const dist = resolve(source, 'dist');
const target = resolve('public/pressure-test');
await stat(resolve(dist, 'index.html'));

await rm(target, { recursive: true, force: true });
await cp(dist, target, { recursive: true });

// Cloudflare's _headers format, from the site's own header template, scoped to its path.
const template = await readFile(resolve(source, 'deploy/security-headers.conf.example'), 'utf8');
const headers = [...template.matchAll(/^add_header ([\w-]+) (["'])(.*)\2 always;$/gm)].map(([, name, , value]) => `  ${name}: ${value}`);
if (!headers.some((line) => line.includes('Content-Security-Policy'))) throw new Error('No Content-Security-Policy in the header template');
await writeFile(resolve('public/_headers'), `# Written by scripts/sync-pressure-test.mjs from the PRESSURE TEST header template.\n/pressure-test/*\n${headers.join('\n')}\n`);
console.log(`Copied ${dist} to public/pressure-test/ and wrote public/_headers (${headers.length} headers).`);
