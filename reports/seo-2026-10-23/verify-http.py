import json, urllib.request, urllib.error
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self,*args): return None
opener=urllib.request.build_opener(NoRedirect)
base='https://zakulab.ru'
checks=[('http://zakulab.ru/',{}),('https://www.zakulab.ru/projects',{}),('https://zakulab.netlify.app/projects',{}),(base+'/projects/',{}),(base+'/opengraph-image.png',{}),(base+'/?utm_source=seo-audit',{}),(base+'/',{'User-Agent':'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'}),(base+'/bundles/site-33533f4ed8.css',{'Accept-Encoding':'gzip, br'}),(base+'/bundles/site-ERXQMKGI.js',{'Accept-Encoding':'gzip, br'}),(base+'/optimized/155814574c-2400.webp',{})]
def fetch(check):
    url,headers=check
    try:
        try: response=opener.open(urllib.request.Request(url,headers=headers),timeout=25)
        except urllib.error.HTTPError as e: response=e
        with response:
            body=response.read()
            result={'url':url,'request_headers':headers,'status':response.status,'headers':dict(response.headers),'bytes':len(body)}
            if 'text/html' in response.headers.get('Content-Type',''): result['html']=body.decode('utf-8','replace')
            return result
    except Exception as e: return {'url':url,'error':str(e)}
with ThreadPoolExecutor(max_workers=3) as pool: results=list(pool.map(fetch,checks))
Path(__file__).with_name('verification.json').write_text(json.dumps(results,ensure_ascii=False,indent=2))
for result in results:
    result.pop('html',None)
    print(json.dumps(result,ensure_ascii=False))
