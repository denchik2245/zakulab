/* Real modules, isolated adapters. No production CMS/media/credentials are touched.
 * npm test; optional GET-only localhost checks: npm test -- http://127.0.0.1:3107
 */
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const { transformSync } = require('next/dist/build/swc');
const root = path.resolve(__dirname, '..');
Object.assign(process.env, { NODE_ENV: 'production', NETLIFY: 'true', ADMIN_PASSWORD: 'test-password', ADMIN_SESSION_SECRET: 'isolated-test-secret' });
let cookieToken, serial = 0;
const blobs = new Map(), modules = new Map(), checks = [];
const store = {
  getWithMetadata: async key => structuredClone(blobs.get(key) ?? null),
  setJSON: async (key, data, options = {}) => {
    const current = blobs.get(key);
    if (options.onlyIfNew && current || options.onlyIfMatch && options.onlyIfMatch !== current?.etag) return { modified: false };
    const etag = String(++serial);
    blobs.set(key, { data: structuredClone(data), etag, metadata: {} });
    return { modified: true, etag };
  },
  set: async (key, data, options) => { blobs.set(key, { data, ...options }); return { modified: true, etag: String(++serial) }; },
};
const mocks = { 'server-only': {}, '@netlify/blobs': { getStore: () => store }, 'next/headers': { cookies: async () => ({ get: () => cookieToken ? { value: cookieToken } : undefined }) } };
function load(filename) {
  filename = path.resolve(root, filename);
  if (modules.has(filename)) return modules.get(filename).exports;
  const module = { exports: {} }; modules.set(filename, module);
  const result = transformSync(fs.readFileSync(filename, 'utf8'), { filename,
    jsc: { parser: { syntax: 'typescript', tsx: filename.endsWith('.tsx') }, transform: { react: { runtime: 'automatic' } }, target: 'es2022' }, module: { type: 'commonjs' } });
  function localRequire(id) {
    if (Object.hasOwn(mocks, id)) return mocks[id];
    if (id.endsWith('.module.css')) return { __esModule: true, default: new Proxy({}, { get: (_target, key) => String(key) }) };
    if (id.startsWith('@/') || id.startsWith('.')) {
      const relative = id.startsWith('@/') ? path.join(root, id.slice(2)) : path.resolve(path.dirname(filename), id);
      return load(fs.existsSync(relative + '.ts') ? relative + '.ts' : relative + '.tsx');
    }
    return require(id);
  }
  vm.runInThisContext(`(function(require,module,exports){${result.code}\n})`, { filename })(localRequire, module, module.exports);
  return module.exports;
}
function requestReview(name = 'Test User', ip = '192.0.2.1', consent = true, text = 'An isolated review that is never written to the real CMS.') {
  const body = new FormData();
  for (const [key, value] of Object.entries({ name, role: 'Tester', 'public-profile': 'https://example.invalid/test', review: text, response: 'json' })) body.set(key, value);
  if (consent) body.set('consent', 'yes');
  return new Request('http://localhost/api/reviews', { method: 'POST', headers: { 'x-nf-client-connection-ip': ip }, body });
}
const putRequest = value => new Request('http://localhost/api/admin/content', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(value) });
async function check(name, run) { await run(); checks.push(name); }
async function main() {
  const content = load('lib/content-store.ts'), auth = load('lib/admin-auth.ts');
  const reviews = load('app/api/reviews/route.ts'), admin = load('app/api/admin/content/route.ts'), login = load('app/api/admin/login/route.ts');
  const schema = load('lib/content-schema.ts'), pub = load('lib/public-content.ts'), queue = load('lib/review-queue.ts'), limits = load('lib/request-limits.ts'), media = load('lib/media-store.ts');
  const seed = await content.readContent(true);
  cookieToken = auth.createAdminSession();
  await check('Seed satisfies the full schema', () => {
    const result = schema.contentSchema.safeParse(seed); assert.ok(result.success, JSON.stringify(result.error?.issues));
  });
  if (fs.existsSync(path.join(root, '.data/zakulab-content.json'))) await check('Existing local CMS remains compatible after normalization', async () => {
    blobs.set('content-v1', { data: JSON.parse(fs.readFileSync(path.join(root, '.data/zakulab-content.json'), 'utf8')), etag: String(++serial), metadata: {} });
    const current = await content.readContent(true), result = schema.contentSchema.safeParse(current);
    assert.ok(result.success, JSON.stringify(result.error?.issues)); blobs.clear();
  });
  await check('Public DTO excludes unpublished records and editor/case data', () => {
    const site = structuredClone(seed.site);
    site.portfolioProjects[0].caseStudy = { ...site.portfolioProjects.find(p => p.caseStudy).caseStudy, status: 'draft', summary: 'PRIVATE-DRAFT', blocks: [] };
    site.portfolioProjects.push({ ...site.portfolioProjects[0], id: 'private', published: false, title: 'PRIVATE-TITLE' });
    const serialized = JSON.stringify(pub.publicPortfolio(site));
    for (const forbidden of ['PRIVATE-', 'caseStudy', 'styleChoice']) assert.ok(!serialized.includes(forbidden));
  });
  await check('Concurrent reviews survive without rewriting CMS', async () => {
    blobs.clear();
    const responses = await Promise.all([reviews.POST(requestReview('Concurrent A')), reviews.POST(requestReview('Concurrent B'))]);
    assert.deepEqual(responses.map(r => r.status), [201, 201]);
    const saved = await content.readContent(true);
    assert.equal(saved.reviews.length, seed.reviews.length + 2);
    assert.ok(saved.reviews.find(r => r.author.name === 'Concurrent A').consent);
    assert.ok(!blobs.has('content-v1'));
  });
  await check('Open admin snapshot preserves a newly submitted review', async () => {
    blobs.clear();
    const stale = await content.readContent(true);
    assert.equal((await reviews.POST(requestReview('New while editing'))).status, 201);
    stale.site.heroTitle = 'Updated safely';
    const response = await admin.PUT(putRequest(stale));
    assert.equal(response.status, 200, await response.clone().text());
    assert.ok((await content.readContent(true)).reviews.some(r => r.author.name === 'New while editing'));
  });
  await check('Concurrent CMS writes return 200 and 409', async () => {
    const base = await content.readContent(true), a = structuredClone(base), b = structuredClone(base);
    a.site.heroTitle = 'A'; b.site.heroTitle = 'B';
    const responses = await Promise.all([admin.PUT(putRequest(a)), admin.PUT(putRequest(b))]);
    assert.deepEqual(responses.map(r => r.status).sort(), [200, 409]);
  });
  await check('Nested invalid data, unsafe URLs and duplicate slugs return 400', async () => {
    for (const mutate of [doc => { doc.site.heroTitle = {}; }, doc => { doc.reviews[0].status = 'invalid'; },
      doc => { doc.site.telegramUrl = 'javascript:alert(1)'; },
      doc => { const cases = doc.site.portfolioProjects.filter(p => p.caseStudy); cases[1].caseStudy.slug = cases[0].caseStudy.slug; }]) {
      const doc = await content.readContent(true); mutate(doc); assert.equal((await admin.PUT(putRequest(doc))).status, 400);
    }
  });
  await check('Empty blocks remain empty; missing legacy blocks migrate', async () => {
    const doc = await content.readContent(true), project = doc.site.portfolioProjects.find(p => p.caseStudy);
    project.caseStudy.blocks = [];
    assert.equal((await admin.PUT(putRequest(doc))).status, 200);
    assert.deepEqual((await content.readContent()).site.portfolioProjects.find(p => p.id === project.id).caseStudy.blocks, []);
    const legacy = await content.readContent(true); delete legacy.site.portfolioProjects.find(p => p.id === project.id).caseStudy.blocks;
    assert.equal((await admin.PUT(putRequest(legacy))).status, 200);
    assert.ok((await content.readContent()).site.portfolioProjects.find(p => p.id === project.id).caseStudy.blocks.length);
  });
  await check('Moderation publishes reviews; deletion does not resurrect queue entries', async () => {
    const doc = await content.readContent(true), review = doc.reviews.find(r => r.author.name === 'New while editing');
    review.status = 'published'; review.showOnHome = review.showOnReviewsPage = true;
    assert.equal((await admin.PUT(putRequest(doc))).status, 200);
    assert.ok((await content.getPublishedReviews()).some(r => r.id === review.id));
    const after = await content.readContent(true); after.reviews = after.reviews.filter(r => r.id !== review.id);
    assert.equal((await admin.PUT(putRequest(after))).status, 200);
    assert.ok(!(await content.readContent(true)).reviews.some(r => r.id === review.id));
  });
  await check('Public case render does not restore deleted blocks from legacy copy', async () => {
    const doc = await content.readContent(true), project = doc.site.portfolioProjects.find(p => p.caseStudy);
    project.caseStudy.blocks = []; project.caseStudy.status = 'published';
    assert.equal((await admin.PUT(putRequest(doc))).status, 200);
    const rendered = await load('app/(main)/cases/[slug]/page.tsx').default({ params: Promise.resolve({ slug: project.caseStudy.slug }) });
    assert.deepEqual(rendered.props.children.props.children[1].props.children, []);
  });
  await check('Case links depend on publication; missing destinations stay inactive', () => {
    const project = structuredClone(seed.site.portfolioProjects.find(p => p.caseStudy));
    project.caseStudy.blocks = [];
    project.caseStudy.status = 'draft'; assert.equal(pub.publicProject(project).url, project.caseStudy.url);
    project.caseStudy.status = 'published'; assert.equal(pub.publicProject(project).url, `/cases/${project.caseStudy.slug}`);
    delete project.caseStudy; assert.equal(pub.publicProject(project).url, '');
  });
  await check('Unfinished case copy is kept in draft and cannot be published', () => {
    assert.ok(seed.site.portfolioProjects.filter(p => p.caseStudy).every(p => p.caseStudy.status === 'draft'));
    const doc = structuredClone(seed); doc.site.portfolioProjects.find(p => p.caseStudy).caseStudy.status = 'published';
    assert.ok(!schema.contentSchema.safeParse(doc).success);
  });
  await check('Shared limiter accepts only 3 of 12 concurrent review requests', async () => {
    const responses = await Promise.all(Array.from({ length: 12 }, (_, n) => reviews.POST(requestReview(`Burst ${n}`, '192.0.2.55'))));
    assert.equal(responses.filter(r => r.status === 201).length, 3); assert.equal(responses.filter(r => r.status === 429).length, 9);
  });
  await check('Consent and field length are enforced by the server', async () => {
    assert.equal((await reviews.POST(requestReview('No consent', '192.0.2.60', false))).status, 400);
    assert.equal((await reviews.POST(requestReview('Too long', '192.0.2.61', true, 'x'.repeat(4001)))).status, 400);
  });
  await check('Streaming bodies are limited without Content-Length', async () => {
    await assert.rejects(limits.limitedBody(new Request('http://localhost', { method: 'POST', body: 'x'.repeat(100) }), 32), limits.RequestTooLargeError);
    assert.equal(await limits.limitedBody(new Request('http://localhost', { method: 'POST', body: 'ok' }), 32), 'ok');
    assert.equal((await reviews.POST(new Request('http://localhost/api/reviews', { method: 'POST', headers: { 'x-nf-client-connection-ip': '192.0.2.62' }, body: 'x'.repeat(33000) }))).status, 413);
  });
  await check('Queue caps storage at 100 slots and reclaims expired pending entries', async () => {
    blobs.clear(); const doc = await content.readContent(true);
    const template = { ...seed.reviews[0], status: 'pending', submittedAt: new Date().toISOString(), showOnHome: false, showOnReviewsPage: false };
    for (let n = 0; n < queue.reviewQueueCapacity; n++) assert.equal(await queue.enqueueReview({ ...template, id: `queued-${n}` }, doc), true);
    assert.equal(await queue.enqueueReview({ ...template, id: 'overflow' }, doc), false);
    assert.equal([...blobs.keys()].filter(key => key.startsWith('review-queue/')).length, 100);
    blobs.get('review-queue/0').data.submittedAt = '2020-01-01T00:00:00.000Z';
    assert.equal(await queue.enqueueReview({ ...template, id: 'reclaimed' }, doc), true);
  });
  await check('Password rotation revokes sessions; brute force returns 429', async () => {
    const before = auth.createAdminSession(); assert.ok(auth.verifyAdminSession(before)); assert.ok(!auth.verifyAdminSession(before + '.extra'));
    process.env.ADMIN_PASSWORD = 'rotated-test-password'; assert.ok(!auth.verifyAdminSession(before)); cookieToken = auth.createAdminSession();
    const responses = await Promise.all(Array.from({ length: 30 }, () => login.POST(new Request('http://localhost/api/admin/login', { method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-nf-client-connection-ip': '192.0.2.70' }, body: JSON.stringify({ password: 'wrong' }) }))));
    assert.equal(responses.filter(r => r.status === 401).length, 10); assert.equal(responses.filter(r => r.status === 429).length, 20);
  });
  await check('Fake PNG bytes are rejected; real raster uploads still work', async () => {
    await assert.rejects(media.saveMedia(new File(['not an image'], 'fake.png', { type: 'image/png' })), /UNSUPPORTED_MEDIA_TYPE/);
    const bytes = await require('sharp')({ create: { width: 2, height: 2, channels: 3, background: '#ffffff' } }).png().toBuffer();
    assert.ok((await media.saveMedia(new File([bytes], 'tiny.png', { type: 'image/png' }))).url.startsWith('/api/media/'));
    assert.equal(await media.readMedia('../../secret.png'), null);
  });
  await check('External CMS images render directly; local images retain optimization', () => {
    const { renderToStaticMarkup } = require('react-dom/server');
    const { CmsImage } = load('components/cms-image.tsx');
    const external = renderToStaticMarkup(CmsImage({ src: 'https://example.invalid/photo.png', width: 100, height: 100, alt: '' }));
    assert.ok(external.includes('src="https://example.invalid/photo.png"')); assert.ok(!external.includes('/_next/image?'));
    const local = renderToStaticMarkup(CmsImage({ src: '/assets/figma/portrait.png', width: 100, height: 100, alt: '' }));
    assert.ok(local.includes('/_next/image?'));
  });
  await check('Anonymous administrative requests return 401', async () => {
    cookieToken = undefined; assert.equal((await admin.GET()).status, 401); assert.equal((await admin.PUT(putRequest(seed))).status, 401);
  });
  await check('Local filesystem writes are atomic and reject competing snapshots', async () => {
    const parent = path.join(root, '.data'); fs.mkdirSync(parent, { recursive: true });
    const temporary = fs.mkdtempSync(path.join(parent, 'regression-')), previous = process.cwd(); process.env.NETLIFY = 'false';
    try {
      process.chdir(temporary); const base = await content.readContent(true);
      const results = await Promise.allSettled([content.writeContent(base), content.writeContent(base)]);
      assert.equal(results.filter(r => r.status === 'fulfilled').length, 1);
      assert.equal(results.filter(r => r.status === 'rejected' && r.reason instanceof content.ContentConflictError).length, 1);
      assert.equal(JSON.parse(fs.readFileSync(path.join(temporary, '.data/zakulab-content.json'), 'utf8')).version, 1);
    } finally {
      process.chdir(previous); process.env.NETLIFY = 'true';
      assert.equal(path.dirname(path.resolve(temporary)), path.resolve(parent)); assert.ok(path.basename(temporary).startsWith('regression-'));
      fs.rmSync(temporary, { recursive: true, force: true });
    }
  });
  if (process.argv[2]) {
    const base = new URL(process.argv[2]); assert.ok(['127.0.0.1', 'localhost', '[::1]'].includes(base.hostname));
    await check('Production page GETs and public RSC data', async () => {
      for (const route of ['/', '/projects', '/reviews', '/style-check', '/privacy', '/consent', '/success', '/sitemap.xml', '/robots.txt', '/manifest.webmanifest', '/opengraph-image', '/api/admin/content']) {
        const response = await fetch(new URL(route, base)); assert.equal(response.status, route === '/api/admin/content' ? 401 : 200, route);
        if (route === '/projects') { const body = await response.text(); assert.ok(!body.includes('caseStudy')); assert.ok(!body.includes('styleChoice')); }
      }
    });
  }
  console.log(JSON.stringify({ passed: checks.length, checks }, null, 2));
}
main().catch(error => { console.error(error); process.exitCode = 1; });
