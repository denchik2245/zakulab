/* Targeted read-only confirmations for crawl findings. */
const fs = require('node:fs');
const path = require('node:path');
const {chromium} = require('C:/Users/denis/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');

(async () => {
  const browser = await chromium.launch({headless:true});
  const context = await browser.newContext({viewport:{width:1440,height:1000}});
  const page = await context.newPage();
  const result = {};
  try {
    await page.goto('https://zakulab.ru/cases/belstudy',{waitUntil:'networkidle'});
    result.casePlaceholders = await page.locator('main [role="img"]').evaluateAll(es=>es.map(e=>({label:e.getAttribute('aria-label'),text:e.textContent})));
    await page.screenshot({path:path.join(__dirname,'screenshots','case-belstudy-1440.png')});
    await page.goto('https://zakulab.ru/projects',{waitUntil:'networkidle'});
    result.projectsBefore = await page.locator('main a[href^="/cases/"]').evaluateAll(es=>es.map(e=>e.getAttribute('href')));
    const all = page.getByRole('button',{name:/Все проекты/});
    if(await all.count()) await all.click();
    result.projectsAfter = await page.locator('main a[href^="/cases/"]').evaluateAll(es=>es.map(e=>e.getAttribute('href')));
    await page.goto('https://zakulab.ru/privacy',{waitUntil:'networkidle'});
    result.legalOverflow = await page.evaluate(()=>({viewport:innerWidth,document:document.documentElement.scrollWidth}));
    await page.screenshot({path:path.join(__dirname,'screenshots','privacy-1440.png')});
    result.externalPlaceholders = [];
    for(const url of ['https://example.com/demo-profile-1','https://example.com/demo-project-4']) {
      try {const response=await context.request.get(url,{timeout:20000});result.externalPlaceholders.push({url,status:response.status(),final:response.url()});}
      catch(e) {result.externalPlaceholders.push({url,error:e.message});}
    }
    result.googlebot = [];
    for(const route of ['/','/reviews','/cases/belstudy','/success']) {
      const response=await context.request.get('https://zakulab.ru'+route,{headers:{'User-Agent':'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'},timeout:25000});
      const html=await response.text();
      result.googlebot.push({route,status:response.status(),canonicalTags:html.match(/<link[^>]+rel="canonical"[^>]*>/g)||[],robotsTags:html.match(/<meta[^>]+name="robots"[^>]*>/g)||[],headers:response.headers()});
    }
    fs.writeFileSync(path.join(__dirname,'verification.json'),JSON.stringify(result,null,2));
    console.log(JSON.stringify(result,null,2));
  } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
