/* Read-only rendered-page inspection in a fresh, isolated headless browser. */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('C:/Users/denis/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const out = __dirname;

async function main() {
  const crawl = JSON.parse(fs.readFileSync(path.join(out, 'crawl.json'), 'utf8'));
  const urls = [...new Set(crawl.pages.filter(p => p.status === 200 && !p.url.endsWith('/admin')).map(p => p.final_url))];
  const browser = await chromium.launch({headless: true});
  const results = [];
  fs.mkdirSync(path.join(out, 'screenshots'), {recursive: true});
  try {
    for (const viewport of [{width: 1440, height: 1000}, {width: 390, height: 844}]) {
      const context = await browser.newContext({viewport, deviceScaleFactor: 1});
      for (const url of urls) {
        const page = await context.newPage();
        const errors = [];
        page.on('pageerror', e => errors.push(e.message));
        try {
          const response = await page.goto(url, {waitUntil: 'networkidle', timeout: 45000});
          const data = await page.evaluate(() => {
            const visible = e => !!(e.offsetWidth || e.offsetHeight || e.getClientRects().length) && getComputedStyle(e).visibility !== 'hidden';
            const meta = property => document.querySelector(`meta[property="${property}"], meta[name="${property}"]`)?.content || null;
            return {
              title: document.title, lang: document.documentElement.lang,
              canonical: [...document.querySelectorAll('link[rel="canonical"]')].map(e => e.href),
              description: meta('description'), robots: meta('robots'),
              openGraph: Object.fromEntries(['og:title','og:description','og:url','og:image','twitter:title'].map(k => [k, meta(k)])),
              viewportMeta: meta('viewport'),
              headings: [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].filter(visible).map(e => ({tag:e.tagName,text:e.innerText})),
              structured: [...document.querySelectorAll('script[type="application/ld+json"]')].map(e => {try {return JSON.parse(e.textContent);} catch(e) {return {error:e.message};}}),
              horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth + 1,
              width: window.innerWidth, scrollWidth: document.documentElement.scrollWidth,
              overflowing: [...document.querySelectorAll('main *')].filter(e => visible(e) && e.getBoundingClientRect().right > window.innerWidth + 2).slice(0,20).map(e => ({tag:e.tagName,class:e.className,right:Math.round(e.getBoundingClientRect().right)})),
              images: [...document.images].map(e => ({src:e.currentSrc || e.src,alt:e.getAttribute('alt'),loading:e.loading,width:e.width,height:e.height,complete:e.complete,naturalWidth:e.naturalWidth,visible:visible(e)})),
              unnamedLinks: [...document.querySelectorAll('a[href]')].filter(e => visible(e) && !(e.innerText.trim() || e.getAttribute('aria-label') || e.getAttribute('aria-labelledby') || [...e.querySelectorAll('img')].some(i=>i.alt))).map(e => e.getAttribute('href')),
              internalLinks: [...document.querySelectorAll('a[href]')].filter(e => new URL(e.href).origin === location.origin).map(e => ({href:e.href,text:e.innerText,visible:visible(e)})),
              mainText: document.querySelector('main')?.innerText || '',
              navigation: performance.getEntriesByType('navigation').map(e => ({ttfbMs:Math.round(e.responseStart),domContentLoadedMs:Math.round(e.domContentLoadedEventEnd),transferSize:e.transferSize})),
              resources: performance.getEntriesByType('resource').reduce((a,e) => {a.count++;a.transferBytes+=e.transferSize;return a;},{count:0,transferBytes:0})
            };
          });
          if (['/', '/projects', '/reviews', '/style-check'].includes(new URL(url).pathname)) {
            const name = new URL(url).pathname.replaceAll('/', '') || 'home';
            await page.screenshot({path: path.join(out, 'screenshots', `${name}-${viewport.width}.png`)});
          }
          results.push({url, viewport, status:response.status(), errors, ...data});
          console.log(JSON.stringify({url,width:viewport.width,status:response.status(),title:data.title,h1:data.headings.filter(h=>h.tag==='H1'),overflow:data.horizontalOverflow,errors}));
        } catch (e) { results.push({url,viewport,error:e.message,errors}); console.log(JSON.stringify({url,width:viewport.width,error:e.message})); }
        await page.close();
        fs.writeFileSync(path.join(out, 'rendered.json'), JSON.stringify(results, null, 2));
      }
      await context.close();
    }
    const context = await browser.newContext({javaScriptEnabled:false,viewport:{width:390,height:844}});
    const noJS = [];
    for(const route of ['/', '/projects', '/reviews', '/style-check']) {
      const page = await context.newPage();
      try {
        const response = await page.goto(crawl.base + route, {waitUntil:'domcontentloaded',timeout:30000});
        noJS.push({route,status:response.status(),main:await page.locator('main').innerText(),h1:await page.locator('h1').allTextContents(),links:await page.locator('main a[href]').evaluateAll(els=>els.map(e=>({href:e.getAttribute('href'),text:e.textContent})))});
      } catch(e) {noJS.push({route,error:e.message});}
      await page.close();
    }
    fs.writeFileSync(path.join(out,'without-js.json'),JSON.stringify(noJS,null,2));
    await context.close();
  } finally { await browser.close(); }
}

main().catch(e => {console.error(e);process.exitCode=1;});
