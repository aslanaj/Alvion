// Run from the website root with: node tools/rebuild-css.mjs
import fs from 'node:fs';
import path from 'node:path';
const manifest=JSON.parse(fs.readFileSync('tools/styles.json','utf8'));
fs.mkdirSync('css/bundles',{recursive:true});
for(const [page,styles] of Object.entries(manifest)){
  const content=styles.map(cssPath=>fs.readFileSync(cssPath,'utf8').replace(/url\((['"]?)([^)'"\s]+)\1\)/g,(all,q,url)=>{
    if(/^(data:|https?:|\/|#)/.test(url))return all;
    const resolved=path.posix.normalize(path.posix.join(path.posix.dirname(cssPath),url));
    return `url(${q}${path.posix.relative('css/bundles',resolved)}${q})`;
  })).join('\n');
  fs.writeFileSync('css/bundles/'+page.replace('.html','.css'),content);
}
console.log('Rebuilt '+Object.keys(manifest).length+' page stylesheets.');
