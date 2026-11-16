"""Static checks for the ALVION site folder. Usage: python3 static_check.py <site dir>"""
import sys,os,re,json,glob
from urllib.parse import urlparse,unquote
SITE=sys.argv[1]; fails=[]; notes=[]
pages=sorted(glob.glob(SITE+'/*.html'))
ids={}
for p in pages:
    h=open(p,encoding='utf-8').read(); ids[os.path.basename(p)]=set(re.findall(r'\bid="([^"]+)"',h))
JS_ANCHORS={'projectForm','quote'}
for p in pages:
    name=os.path.basename(p); h=open(p,encoding='utf-8').read()
    for attr,url in re.findall(r'\b(href|src|data-src|poster|data-full)="([^"]+)"',h):
        if url.startswith(('http://','https://','mailto:','tel:','sms:','data:','#','javascript:')):
            if url.startswith('#') and len(url)>1 and url[1:] not in ids[name] and url[1:] not in JS_ANCHORS: fails.append(f'{name}: missing anchor {url}')
            continue
        u=urlparse(url); path=unquote(u.path).lstrip('/')
        if not path: continue
        if not os.path.exists(os.path.join(SITE,path)): fails.append(f'{name}: missing file {url}'); continue
        if u.fragment and path.endswith('.html') and u.fragment not in ids.get(path,set()) and u.fragment not in JS_ANCHORS: fails.append(f'{name}: {path} has no #{u.fragment}')
    for m in re.findall(r'srcset="([^"]+)"',h):
        for part in m.split(','):
            f=part.strip().split(' ')[0]
            if f and not os.path.exists(os.path.join(SITE,unquote(f.split('?')[0]))): fails.append(f'{name}: missing srcset file {f}')
    for block in re.findall(r'<script type="application/ld\+json">(.*?)</script>',h,re.S):
        try: json.loads(block)
        except Exception as e: fails.append(f'{name}: bad JSON-LD ({e})')
    if name!='wrap-visualizer.html':
        if 'css/accent.css' not in h: fails.append(f'{name}: accent.css not linked')
        if 'js/shared/press.js' not in h: fails.append(f'{name}: press.js not linked')
    if len(re.findall(r'<h1[\s>]',h))>1: fails.append(f'{name}: more than one h1')
    if name not in ('wrap-visualizer.html','404.html') and not re.search(r'<title>[^<]{10,}</title>',h): fails.append(f'{name}: title missing')
# retired brand names and files
for p in glob.glob(SITE+'/**/*',recursive=True):
    if not p.endswith(('.html','.js','.css','.xml')): continue
    t=open(p,encoding='utf-8',errors='ignore').read()
    rel=os.path.relpath(p,SITE)
    if re.search(r'suntek',t,re.I): fails.append(f'{rel}: still mentions SunTek')
    if re.search(r'cheetah films',t,re.I): fails.append(f'{rel}: still mentions Cheetah films')
    for old in ('vehicle-images.js','assets/og-share.jpg','vehicles/image0','vehicles/image1','vehicles/image2'):
        if old in t: fails.append(f'{rel}: references removed file {old}')
    # css/js references inside css and js
    if p.endswith('.css'):
        for u in re.findall(r'url\(["\']?([^"\')]+)',t):
            if u.startswith(('data:','http','#')): continue
            target=os.path.normpath(os.path.join(os.path.dirname(p),u.split('?')[0].split('#')[0]))
            if not os.path.exists(target): fails.append(f'{rel}: missing url({u})')
for u in re.findall(r'<loc>([^<]+)</loc>',open(SITE+'/sitemap.xml').read()):
    path=urlparse(u).path.lstrip('/') or 'index.html'
    if not os.path.exists(os.path.join(SITE,path)): fails.append(f'sitemap: {u} has no file')
for slug in ['tesla','cybertruck','sedan','coupe','s-class','sport','suv','pickup','g-wagon']:
    for f in (slug+'.webp',slug+'-mask.webp'):
        if not os.path.exists(f'{SITE}/assets/vehicles/{f}'): fails.append(f'missing vehicle art {f}')
if not os.path.exists(SITE+'/assets/ppf-porsche-911-mask.webp'): fails.append('missing PPF paint map')
print(f'pages checked: {len(pages)}')
print('FAILS:' if fails else 'STATIC CHECK PASSED')
for f in sorted(set(fails)): print(' -',f)
sys.exit(1 if fails else 0)
