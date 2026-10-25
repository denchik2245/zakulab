#!/usr/bin/env python3
"""Real HTTP regression checks against PHP at Beget's 96M memory limit; private temporary data only."""
import base64
import concurrent.futures
import copy
import gzip
import hashlib
import http.cookiejar
from html.parser import HTMLParser
import json
import os
from pathlib import Path
import re
import secrets
import shutil
import signal
import socket
import struct
import subprocess
import sys
import tempfile
import time
import urllib.error
import urllib.parse
import urllib.request
import zlib

ROOT = Path(__file__).resolve().parents[1]
DEPLOY = ROOT / 'build/beget'
if not (DEPLOY / 'app/generated/assets.json').exists():
    raise SystemExit('Run npm run build first.')
PHP = os.environ.get('PHP_BINARY', 'php')
checks = []

class Markup(HTMLParser):
    def __init__(self, html):
        super().__init__()
        self.tags = []
        self.feed(html)

    def handle_starttag(self, tag, attrs):
        self.tags.append((tag, dict(attrs)))

    def elements(self, tag):
        return [attrs for name, attrs in self.tags if name == tag]

def check(condition, message):
    if not condition:
        raise AssertionError(message)
    checks.append(message)

def png(width=32, height=32):
    def chunk(name, data):
        return struct.pack('>I', len(data)) + name + data + struct.pack('>I', zlib.crc32(name + data) & 0xffffffff)
    raw = (b'\0' + b'\x55\xaa\x88' * width) * height if width * height <= 5000000 else b'\0'
    return b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', struct.pack('>IIBBBBB', width, height, 8, 2, 0, 0, 0)) + chunk(b'IDAT', zlib.compress(raw)) + chunk(b'IEND', b'')

with tempfile.TemporaryDirectory(prefix='zakulab-php-test-') as temporary:
    directory = Path(temporary)
    shutil.copytree(DEPLOY / 'app', directory / 'app')
    shutil.copy2(DEPLOY / 'console.php', directory / 'console.php')
    (directory / 'public_html').mkdir()
    for source in (DEPLOY / 'public_html').iterdir():
        if source.is_file():
            shutil.copy2(source, directory / 'public_html' / source.name)
        elif source.name != 'page-cache':
            shutil.copytree(source, directory / 'public_html' / source.name)
    (directory / 'storage').mkdir()
    shutil.copy2(DEPLOY / 'storage/initial-content.json', directory / 'storage/initial-content.json')
    with socket.socket() as sock:
        sock.bind(('127.0.0.1', 0))
        port = sock.getsockname()[1]
    origin = f'http://127.0.0.1:{port}'
    password = secrets.token_urlsafe(24)
    password_hash = subprocess.check_output([PHP, '-r', 'echo password_hash(trim(fgets(STDIN)), PASSWORD_DEFAULT);'], input=password, text=True)
    env = {key: value for key, value in os.environ.items() if not key.startswith(('ADMIN_', 'ZAKULAB_', 'SITE_URL', 'MYSQL_'))}
    env.update(SITE_URL=origin, ADMIN_PASSWORD_HASH=password_hash, ADMIN_SESSION_SECRET=secrets.token_hex(32), ZAKULAB_CONFIG=str(directory / 'unused-config.php'), ZAKULAB_STORAGE=str(directory / 'storage'), PHP_CLI_SERVER_WORKERS='4')
    log = open(directory / 'server.log', 'w')
    cgi = None
    apache = '--apache' in sys.argv
    if apache:
        with socket.socket() as sock:
            sock.bind(('127.0.0.1', 0))
            cgi_port = sock.getsockname()[1]
        cgi = subprocess.Popen([os.environ.get('PHP_CGI_BINARY', 'php-cgi'), '-d', 'memory_limit=96M', '-d', 'upload_max_filesize=8M', '-d', 'post_max_size=9M', '-b', f'127.0.0.1:{cgi_port}'], cwd=directory, env=env, stdout=log, stderr=subprocess.STDOUT, start_new_session=True)
        modules = ['mpm_prefork', 'authz_core', 'authz_host', 'unixd', 'dir', 'mime', 'log_config', 'env', 'headers', 'rewrite', 'proxy', 'proxy_fcgi']
        module_root = os.environ.get('APACHE_MODULE_PATH', '/usr/libexec/apache2')
        lines = [f'ServerRoot "{directory}"', f'DefaultRuntimeDir "{directory}"', f'Mutex file:{directory} default', f'Listen 127.0.0.1:{port}', f'ServerName 127.0.0.1', f'PidFile "{directory}/httpd.pid"', f'ErrorLog "{directory}/server.log"', 'LogLevel warn', f'User #{os.getuid()}', f'Group #{os.getgid()}']
        lines += [f'LoadModule {module}_module "{module_root}/mod_{module}.so"' for module in modules]
        lines += [f'DocumentRoot "{directory}/public_html"', 'TypesConfig /etc/apache2/mime.types', 'ProxyFCGIBackendType GENERIC', f'<Directory "{directory}/public_html">', 'Options FollowSymLinks', 'AllowOverride All', 'Require all granted', '</Directory>', '<FilesMatch "\\.php$">', f'SetHandler "proxy:fcgi://127.0.0.1:{cgi_port}"', '</FilesMatch>', 'PassEnv SITE_URL ADMIN_PASSWORD_HASH ADMIN_SESSION_SECRET ZAKULAB_CONFIG ZAKULAB_STORAGE']
        (directory / 'httpd.conf').write_text('\n'.join(lines) + '\n')
        server_command = [os.environ.get('APACHE_BINARY', '/usr/sbin/httpd'), '-f', str(directory / 'httpd.conf'), '-DFOREGROUND']
    else:
        server_command = [PHP, '-d', 'memory_limit=96M', '-d', 'upload_max_filesize=8M', '-d', 'post_max_size=9M', '-S', f'127.0.0.1:{port}', '-t', str(directory / 'public_html'), str(directory / 'public_html/router.php')]
    server = subprocess.Popen(server_command, cwd=directory, env=env, stdout=log, stderr=subprocess.STDOUT, start_new_session=True)
    jar = http.cookiejar.CookieJar()
    client = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(jar))

    def request(path, method='GET', value=None, headers=None, authenticated=True):
        headers = dict(headers or {})
        if method != 'GET':
            headers.setdefault('Origin', origin)
        if isinstance(value, (dict, list)):
            value = json.dumps(value, ensure_ascii=False).encode()
            headers.setdefault('Content-Type', 'application/json')
        req = urllib.request.Request(origin + path, data=value, headers=headers, method=method)
        try:
            response = (client.open if authenticated else urllib.request.urlopen)(req, timeout=20)
        except urllib.error.HTTPError as error:
            response = error
        body = response.read()
        try:
            data = json.loads(body)
        except (ValueError, UnicodeDecodeError):
            data = body.decode(errors='replace')
        return response.status, data, response.headers, body

    def submit_review(text):
        fields = {'name': 'Проверка PHP', 'role': 'Заказчик', 'public-profile': 'https://example.com/profile', 'review': text, 'consent': 'yes', 'response': 'json'}
        return request('/api/reviews', 'POST', urllib.parse.urlencode(fields).encode(), {'Content-Type': 'application/x-www-form-urlencoded'}, False)

    try:
        for _ in range(80):
            try:
                if request('/api/admin/session')[0] == 200:
                    break
            except (urllib.error.URLError, ConnectionError):
                time.sleep(.1)
        check(server.poll() is None, 'PHP server starts at a 96M limit')
        for path in ['/', '/projects', '/reviews', '/style-check', '/privacy', '/consent', '/success', '/request']:
            status, data, headers, raw = request(path, authenticated=False)
            check(status == 200 and '<h1' in data, f'{path}: complete HTML without JavaScript' + (f' (status={status}, body={str(data)[:600]})' if status != 200 or '<h1' not in data else ''))
            check('/_next/' not in data and 'fonts.googleapis.com' not in data, f'{path}: no Next.js runtime or external fonts')
        for path in ['/app/generated/seed.json', '/storage/initial-content.json', '/config.local.php', '/page-cache/home.html', '/router.php', '/.env']:
            check(request(path, authenticated=False)[0] in [403, 404], f'{path}: private path blocked')
        assets = json.loads((directory / 'app/generated/assets.json').read_text())
        project_preloads = [link for link in Markup(request('/projects', authenticated=False)[1]).elements('link') if link.get('rel') == 'preload' and link.get('as') == 'image']
        check(any(link.get('href') == assets['texture'] and link.get('fetchpriority') == 'high' for link in project_preloads), 'Portfolio discovers its measured LCP texture in initial HTML')
        check(not any(link.get('href') == assets['texture'] and link.get('rel') == 'preload' for link in Markup(request('/', authenticated=False)[1]).elements('link')), 'Other pages do not preload the below-fold portfolio texture')
        portfolio_html = request('/projects', authenticated=False)[1]
        row_ids = [link['data-project-id'] for link in Markup(portfolio_html).elements('a') if 'data-project-id' in link]
        check(bool(row_ids) and len(row_ids) == len(set(row_ids)) and 'data-expanded-class=' in portfolio_html, 'Server portfolio provides unique row identities and expansion styling for progressive filtering')
        for kind in ['css', 'adminCss', 'images', 'site', 'admin']:
            status, _, headers, raw = request(assets[kind], authenticated=False)
            check(status == 200 and len(raw) > 100 and 'text/html' not in headers.get('Content-Type', ''), f'{kind}: browser asset is available')
        font = next((directory / 'public_html/fonts').glob('*.woff2'))
        check(request('/fonts/' + font.name, authenticated=False)[0] == 200, 'Local font files are available')
        check(request('/assets/figma/logo.svg', authenticated=False)[0] == 200, 'Static images are available')
        check(request('/api/admin/content', authenticated=False)[0] == 401, 'Anonymous users cannot read CMS')
        check(request('/api/admin/backup', authenticated=False)[0] == 401, 'Anonymous users cannot export private data')
        check(request('/missing-page', authenticated=False)[0] == 404, 'Unknown pages return HTTP 404')
        public_css = request(assets['css'], authenticated=False)[1]
        check('.admin-' not in public_css and '/assets/figma/image44.png' not in public_css, 'Public CSS excludes admin rules and the original heavy texture')
        check(assets['adminCss'] != assets['css'] and '.admin-' in request(assets['adminCss'], authenticated=False)[1], 'Admin CSS is separate and retains editor styles')
        _, _, css_headers, css_bytes = request(assets['css'], authenticated=False)
        check('immutable' in css_headers.get('Cache-Control', '') and 'Accept-Encoding' in css_headers.get('Vary', ''), 'Versioned resources have explicit immutable caching and encoding variation')
        status, _, zipped_headers, zipped = request(assets['css'], headers={'Accept-Encoding': 'gzip'}, authenticated=False)
        check(status == 200 and zipped_headers.get('Content-Encoding') == 'gzip' and gzip.decompress(zipped) == css_bytes, 'Asset route serves the matching precompressed representation')
        check(zipped_headers['ETag'] != css_headers['ETag'], 'Compressed and identity asset representations have distinct validators')
        check(request(assets['css'], headers={'If-None-Match': css_headers['ETag']}, authenticated=False)[0] == 304, 'Asset revalidation returns 304')
        status, _, head_headers, head_body = request(assets['css'], method='HEAD', authenticated=False)
        check(status == 200 and not head_body and head_headers['ETag'] == css_headers['ETag'] and head_headers.get('Content-Length') in [None, str(len(css_bytes))], 'Asset HEAD preserves its validator without a body or conflicting length')
        check(request(assets['css'], headers={'Accept-Encoding': 'gzip;q=0, br;q=0'}, authenticated=False)[2].get('Content-Encoding') is None, 'Explicitly rejected compression falls back to identity')
        check(request(assets['css'], headers={'Accept-Encoding': 'identity;q=0, gzip;q=0, br;q=0'}, authenticated=False)[0] == 406, 'Asset route rejects requests that accept no available representation')
        for path in ['/api/assets/bundles/config.local.php', '/api/assets/fonts/../../config.local.php', '/api/assets/storage/content.json', '/api/assets/bundles/site-not-found.js']:
            check(request(path, authenticated=False)[0] == 404, f'{path}: static fallback cannot expose private or absent files')
        for path in ['/request', '/success', '/success?form=review']:
            _, html, headers, _ = request(path, authenticated=False)
            robots = next(meta.get('content', '') for meta in Markup(html).elements('meta') if meta.get('name') == 'robots')
            check('noindex' in robots and 'noindex' in headers.get('X-Robots-Tag', ''), f'{path}: noindex in HTML and HTTP')
        check('<lastmod>' not in request('/sitemap.xml', authenticated=False)[1], 'Sitemap does not claim a global save date for every page')
        check(request('/api/admin/login', 'POST', {'password': 'wrong'})[0] == 401, 'Incorrect password rejected')
        check(request('/api/admin/login', 'POST', {'password': password}, {'Origin': 'https://attacker.invalid'})[0] == 403, 'Cross-origin login rejected')
        status, data, headers, raw = request('/api/admin/login', 'POST', {'password': password})
        check(status == 200 and bool(data.get('csrfToken')), 'Login issues a CSRF token')
        check('HttpOnly' in headers.get('Set-Cookie', '') and 'SameSite=Strict' in headers.get('Set-Cookie', ''), 'Admin cookie is HttpOnly and SameSite Strict')
        csrf = {'X-CSRF-Token': data['csrfToken']}
        original = request('/api/admin/content')[1]
        check(request('/api/admin/content', 'PUT', original)[0] == 403, 'CMS mutation without CSRF token rejected')
        invalid = copy.deepcopy(original)
        invalid['site']['telegramUrl'] = 'javascript:alert(1)'
        check(request('/api/admin/content', 'PUT', invalid, csrf)[0] == 400, 'Unsafe URLs rejected server-side')
        invalid = copy.deepcopy(original)
        invalid['site']['heroGallerySpeed'] = 1000
        check(request('/api/admin/content', 'PUT', invalid, csrf)[0] == 400, 'Schema numeric limits enforced server-side')
        invalid = copy.deepcopy(original)
        invalid['site']['portfolioProjects'][1]['id'] = invalid['site']['portfolioProjects'][0]['id']
        check(request('/api/admin/content', 'PUT', invalid, csrf)[0] == 400, 'Duplicate IDs rejected server-side')
        check(submit_review('PRIVATE_PENDING_SENTINEL Отзыв для проверки модерации.')[0] == 201, 'Public review accepted into private moderation queue')
        original['site']['heroTitle'] = 'PHP MIGRATION PUBLIC CHECK'
        status, saved, headers, raw = request('/api/admin/content', 'PUT', original, csrf)
        check(status == 200, 'Content save passes PHP schema validation: ' + str(saved if status != 200 else 'OK'))
        check(any('PRIVATE_PENDING_SENTINEL' in item['text'] for item in saved['reviews']), 'Review arriving during editing survives content save')
        check(request('/api/admin/content', 'PUT', original, csrf)[0] == 409, 'Stale CMS revision returns conflict')
        status, home, _, _ = request('/', authenticated=False)
        check('PHP MIGRATION PUBLIC CHECK' in home and 'PRIVATE_PENDING_SENTINEL' not in home, 'Fresh HTML reflects edits without leaking pending reviews')
        check((directory / 'public_html/page-cache/home.html').exists(), 'Public page generates static cache')
        pending = next(item for item in saved['reviews'] if 'PRIVATE_PENDING_SENTINEL' in item['text'])
        pending.update(status='published', showOnHome=True, showOnReviewsPage=True)
        draft = copy.deepcopy(saved['site']['portfolioProjects'][0])
        draft.update(id='php-private-draft', title='PRIVATE_DRAFT_SENTINEL', published=False)
        draft.pop('caseStudy', None)
        saved['site']['portfolioProjects'].append(draft)
        check(request('/api/admin/content', 'PUT', saved, csrf)[0] == 200, 'Moderation and private draft save succeed')
        check(not (directory / 'public_html/page-cache/home.html').exists(), 'Content save invalidates static cache')
        for path in ['/', '/projects', '/reviews', '/style-check', '/sitemap.xml']:
            data = request(path, authenticated=False)[1]
            check('PRIVATE_DRAFT_SENTINEL' not in data, f'{path}: draft absent from HTML and boot data')
        check('PRIVATE_PENDING_SENTINEL' in request('/reviews', authenticated=False)[1], 'Approved review appears in public HTML')
        current = request('/api/admin/content')[1]
        case = copy.deepcopy(next(item['caseStudy'] for item in current['site']['portfolioProjects'] if item.get('caseStudy')))
        case = json.loads(re.sub(r'\[УТОЧНИТЬ[^\]]*\]', 'Проверенные сведения', json.dumps(case, ensure_ascii=False)))
        case.update(slug='php-migration-check', title='PHP Test Case', status='published')
        case['blocks'] = [
            {'id': 'php-empty-image', 'type': 'image', 'image': '', 'alt': 'Место для иллюстрации', 'caption': 'Проверка', 'spacing': 'large'},
            {'id': 'php-text', 'type': 'text', 'title': 'Проверка кейса', 'body': 'Полный текст кейса в HTML.', 'listStyle': 'numbered', 'items': [{'id': 'php-item', 'label': 'Пункт', 'text': 'Содержание'}], 'spacing': 'compact'},
            {'id': 'php-callout', 'type': 'callout', 'text': 'Акцентный текст', 'spacing': 'large'},
            {'id': 'php-gallery', 'type': 'gallery', 'images': [{'id': 'php-gallery-item', 'image': '/assets/figma/logo.svg', 'alt': 'Проверка галереи'}], 'spacing': 'compact'},
        ]
        case['draft']['challenge'] = '[УТОЧНИТЬ] Неиспользуемый старый текст'
        current['site']['portfolioProjects'][0]['caseStudy'] = case
        current['site']['portfolioProjects'][0]['published'] = True
        check(request('/api/admin/content', 'PUT', current, csrf)[0] == 200, 'Case publication succeeds')
        status, case_html, _, _ = request('/cases/php-migration-check', authenticated=False)
        check(status == 200 and 'Полный текст кейса' in case_html and 'Место для иллюстрации' in case_html and 'Проверка галереи' in case_html, 'Published case has all block types and image placeholders')
        check('Неиспользуемый старый текст' not in case_html, 'Unused legacy draft copy does not block or leak into a published case')
        check('/cases/php-migration-check' in request('/sitemap.xml', authenticated=False)[1], 'Published case appears in sitemap')
        current = request('/api/admin/content')[1]
        current['site']['portfolioProjects'][0]['caseStudy']['blocks'] = []
        check(request('/api/admin/content', 'PUT', current, csrf)[0] == 200, 'Editor can remove all case blocks')
        empty_case = request('/cases/php-migration-check', authenticated=False)[1]
        check('Полный текст кейса' not in empty_case and 'Неиспользуемый старый текст' not in empty_case, 'Empty case stays empty instead of restoring legacy copy')
        current = request('/api/admin/content')[1]
        current['site']['portfolioProjects'][0]['caseStudy']['status'] = 'draft'
        check(request('/api/admin/content', 'PUT', current, csrf)[0] == 200, 'Case can return to draft')
        check(request('/cases/php-migration-check', authenticated=False)[0] == 404, 'Unpublishing removes cached case access')
        check('/cases/php-migration-check' not in request('/sitemap.xml', authenticated=False)[1], 'Unpublished case removed from sitemap')

        def upload(payload, filename='image.png', mime='image/png'):
            boundary = 'zakulab' + secrets.token_hex(8)
            body = f'--{boundary}\r\nContent-Disposition: form-data; name="file"; filename="{filename}"\r\nContent-Type: {mime}\r\n\r\n'.encode() + payload + f'\r\n--{boundary}--\r\n'.encode()
            return request('/api/admin/media', 'POST', body, dict(csrf, **{'Content-Type': 'multipart/form-data; boundary=' + boundary}))
        status, uploaded, _, _ = upload(png())
        check(status == 201, 'Valid image upload succeeds at 96M')
        status, _, headers, image_bytes = request(uploaded['url'], authenticated=False)
        check(status == 200 and headers.get('Content-Type') == 'image/png' and image_bytes == png(), 'Media bytes served with correct content type')
        check(upload(b'<?php echo "bad"; ?>', 'bad.png')[0] == 415, 'Fake image rejected')
        check(upload(png(9000, 9000))[0] == 413, 'Oversized pixel dimensions rejected before decoding')
        status, large, _, _ = upload(png(2500, 2000))
        check(status == 201, 'Valid 5-megapixel image and previews fit the 96M limit')
        status, _, headers, raw = request(large['url'] + '?w=1280', authenticated=False)
        check(status == 200 and headers.get('Content-Type') == 'image/webp' and raw[8:12] == b'WEBP', 'Uploaded image serves a prepared WebP preview')
        full_status, _, full_headers, full_raw = request(large['url'] + '?w=full', authenticated=False)
        check(full_status == 200 and full_headers.get('Content-Type') == 'image/webp' and full_raw[8:12] == b'WEBP', 'Full-resolution WebP prevents high-DPR screens from downloading the PNG')
        check(request(large['url'], authenticated=False)[3][:8] == b'\x89PNG\r\n\x1a\n', 'Original uploaded PNG remains available without conversion')
        check(request(large['url'] + '?w=1280', headers={'If-None-Match': headers['ETag']}, authenticated=False)[0] == 304, 'Media cache revalidation returns 304')
        current = request('/api/admin/content')[1]
        current['site']['heroPortrait'] = large['url']
        check(request('/api/admin/content', 'PUT', current, csrf)[0] == 200, 'Uploaded image can become the public portrait')
        preview_html = request('/', authenticated=False)[1]
        check(large['url'] + '?w=320' in preview_html and 'srcset=' in preview_html, 'Public HTML and browser islands receive prepared media variants')
        check(large['url'] + '?w=full 2500w' in preview_html, 'Responsive image set terminates with full-resolution WebP instead of the PNG original')
        preview_image = next(image for image in Markup(preview_html).elements('img') if image.get('alt') == current['site']['heroName'])
        check(preview_image.get('width') == '2500' and preview_image.get('height') == '2000', 'Uploaded image dimensions reserve its intrinsic aspect ratio')
        seo_content = request('/api/admin/content')[1]
        case_project = seo_content['site']['portfolioProjects'][0]
        case_project['caseStudy']['status'] = 'published'
        case_project['portfolioPlacement'] = 'archive'
        case_project['caseStudy']['blocks'] = [
            {'id': 'seo-cover', 'type': 'image', 'image': large['url'], 'alt': 'SEO cover', 'caption': '', 'spacing': 'large'},
            {'id': 'seo-gallery', 'type': 'gallery', 'images': [{'id': 'seo-detail', 'image': large['url'], 'alt': 'SEO detail'}], 'spacing': 'large'},
        ]
        for slug, placement in [('seo-related-visible', 'archive'), ('seo-related-hidden', 'hidden')]:
            other = copy.deepcopy(case_project)
            other.update(id=slug, title=slug, homePlacement='hidden', portfolioPlacement=placement, order=len(seo_content['site']['portfolioProjects']) + 1)
            other['caseStudy'].update(slug=slug, title=slug)
            seo_content['site']['portfolioProjects'].append(other)
        check(request('/api/admin/content', 'PUT', seo_content, csrf)[0] == 200, 'Image-dimension fixture saves through the real CMS API')
        path = '/cases/' + case_project['caseStudy']['slug']
        _, case_html, _, _ = request(path, authenticated=False)
        case_images = [image for image in Markup(case_html).elements('img') if image.get('alt') in ['SEO cover', 'SEO detail']]
        check(len(case_images) == 2 and all(image.get('width') == '2500' and image.get('height') == '2000' for image in case_images), 'Cover and gallery both expose intrinsic dimensions')
        check(case_images[0].get('loading') == 'eager' and case_images[0].get('fetchpriority') == 'high' and case_images[1].get('loading') == 'lazy', 'Only case cover receives eager/high image loading')
        graph = json.loads(re.search(r'<script type="application/ld\+json">(.*?)</script>', case_html, re.S).group(1))['@graph']
        person = next(item for item in graph if item['@type'] == 'Person')
        work = next(item for item in graph if item['@type'] == 'CreativeWork')
        crumbs = next(item for item in graph if item['@type'] == 'BreadcrumbList')['itemListElement']
        check(work['author']['@id'] == person['@id'] and work['url'] == origin + path and len(crumbs) == 3, 'Case schema links author, work and its three visible breadcrumb levels')
        related = re.search(r'<nav[^>]+aria-labelledby="related-cases-title".*?</nav>', case_html, re.S)
        check(related is not None, 'Case includes contextual links in the server-rendered article')
        related_links = [link['href'] for link in Markup(related.group(0)).elements('a')]
        hidden_paths = {'/cases/' + project['caseStudy']['slug'] for project in seo_content['site']['portfolioProjects'] if project.get('caseStudy') and (not project['published'] or project['portfolioPlacement'] == 'hidden' or project['caseStudy']['status'] != 'published')}
        check('/cases/seo-related-visible' in related_links and path not in related_links and not hidden_paths.intersection(related_links), 'Related-case links include relevant visible work and exclude current, hidden and unpublished projects')
        fields = {'name': 'Заявка PHP', 'company': 'Проверка', 'task': 'PRIVATE_REQUEST_SENTINEL', 'budget': 'Пока не определён', 'messenger': 'Telegram', 'contact': '@test', 'consent': 'yes', 'response': 'json', 'visual-profile': 'Профиль визуальных предпочтений'}
        check(request('/api/requests', 'POST', urllib.parse.urlencode(fields).encode(), {'Content-Type': 'application/x-www-form-urlencoded'}, False)[0] == 201, 'Project form persists a private request')
        inbox = request('/api/admin/requests')[1]['requests']
        check(len(inbox) == 1 and inbox[0]['task'] == 'PRIVATE_REQUEST_SENTINEL' and inbox[0]['visualProfile'], 'Admin inbox contains full request and style brief')
        check('PRIVATE_REQUEST_SENTINEL' not in request('/', authenticated=False)[1], 'Public HTML never exposes private requests')
        check(request('/api/admin/requests/' + inbox[0]['id'], 'DELETE', headers=csrf)[0] == 200, 'Admin can delete a request')
        check(request('/api/admin/requests')[1]['requests'] == [], 'Request deletion persists')
        backup = request('/api/admin/backup')[1]
        check(backup['format'] == 'zakulab-php-v1' and 'queue' in backup and 'content' in backup, 'Private backup exports CMS and pending queue')
        cli_backup = directory / 'backup.json'
        subprocess.run([PHP, str(directory / 'console.php'), 'export', str(cli_backup)], env=env, check=True, capture_output=True)
        exported = json.loads(cli_backup.read_text())
        check(exported['content']['site'] == backup['content']['site'], 'CLI export preserves the full CMS')
        exported['content']['site']['heroTitle'] = 'RESTORED_FROM_BACKUP'
        cli_backup.write_text(json.dumps(exported, ensure_ascii=False))
        subprocess.run([PHP, str(directory / 'console.php'), 'import', str(cli_backup)], env=env, check=True, capture_output=True)
        check('RESTORED_FROM_BACKUP' in request('/', authenticated=False)[1], 'CLI import restores content and invalidates cached HTML')
        prior = json.loads(next((directory / 'storage').glob('before-import-*.json')).read_text())
        check('content' in prior and 'queue' in prior and 'requests' in prior, 'Import backs up all previous records before replacing them')
        current = request('/api/admin/content')[1]
        parallel_values = [copy.deepcopy(current), copy.deepcopy(current)]
        parallel_values[0]['site']['heroTitle'] = 'Winner one'
        parallel_values[1]['site']['heroTitle'] = 'Winner two'
        # Each worker uses the same session cookie but its own HTTP client.
        auth_headers = dict(csrf, Cookie='; '.join(cookie.name + '=' + cookie.value for cookie in jar))
        with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
            statuses = list(pool.map(lambda value: request('/api/admin/content', 'PUT', value, auth_headers, False)[0], parallel_values))
        check(sorted(statuses) == [200, 409], 'Concurrent saves commit once and report the competing revision')
        check(request('/api/admin/logout', 'POST', headers=csrf)[0] == 200, 'Logout succeeds')
        check(request('/api/admin/content')[0] == 401, 'Logout removes access to CMS')
        if apache:
            expected = request('/', authenticated=False)[1]
            os.killpg(cgi.pid, signal.SIGTERM)
            cgi.wait(timeout=10)
            status, cached, _, _ = request('/', authenticated=False)
            check(status == 200 and cached == expected, 'Apache serves the public cache even with PHP stopped')
            check(request('/admin', authenticated=False)[0] >= 500, 'Admin remains dynamic and cannot bypass PHP authentication')
        log.flush()
        errors = (directory / 'server.log').read_text()
        check('PHP Fatal error' not in errors and 'PHP Warning' not in errors and 'PHP Deprecated' not in errors, 'No PHP warnings, deprecations or memory exhaustion')
        print(f'PASS: {len(checks)} PHP integration checks; 96M limit; isolated storage; {"Apache + FastCGI + real .htaccess" if apache else "real concurrent workers"}.')
    except Exception:
        log.flush()
        print((directory / 'server.log').read_text()[-6000:])
        raise
    finally:
        if server.poll() is None:
            os.killpg(server.pid, signal.SIGTERM)
        server.wait(timeout=10)
        if cgi and cgi.poll() is None:
            os.killpg(cgi.pid, signal.SIGTERM)
            cgi.wait(timeout=10)
        log.close()
