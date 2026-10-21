
(()=>{const root=document.getElementById('alvion-car-preview');const data=Alvion.estimatorCatalog.vehicles;const colors=Alvion.estimatorCatalog.colors;let selected=0,paint=0,service='vinyl';const index={vinyl:2,clear:3,color:4,front:5,tint:6,ceramic:7};
const atlas=new Image(),teslaPhoto=new Image();atlas.src=Alvion.vehicleImages.image0;teslaPhoto.src=Alvion.vehicleImages.image1;
const coupePhoto=new Image();coupePhoto.src=Alvion.vehicleImages.image2;
const specs=[
{w:[[95,47],[136,31],[211,27],[220,67]],w2:[[226,29],[264,36],[319,69],[230,68]],wheels:[[105,139,46],[411,139,46]],body:[[22,65],[62,56],[120,30],[173,20],[233,20],[295,34],[359,72],[435,80],[485,111],[484,145],[449,156],[61,156],[21,139]]},
{w:[[165,48],[251,35],[347,76],[164,67]],wheels:[[89,155,48],[421,155,49]],body:[[11,65],[242,26],[385,65],[491,94],[495,135],[448,161],[43,155],[9,132]]},
{w:[[110,69],[147,49],[208,48],[220,88]],w2:[[228,48],[271,59],[318,89],[231,88]],wheels:[[107,157,47],[409,157,47]],body:[[12,85],[55,78],[125,48],[186,42],[244,44],[291,60],[344,87],[443,98],[489,116],[489,171],[12,172]]},
{w:[[123,83],[148,57],[216,52],[227,87]],w2:[[233,52],[285,65],[326,91],[236,88]],wheels:[[111,148,42],[422,148,43]],body:[[12,108],[25,84],[88,73],[146,45],[239,42],[287,57],[348,91],[430,100],[490,117],[493,161],[15,161]]},
{w:[[177,70],[206,61],[265,68],[301,96],[217,86]],wheels:[[89,146,40],[394,145,41]],body:[[14,72],[78,80],[164,52],[231,56],[289,77],[328,100],[458,113],[495,138],[481,169],[20,167],[12,144]]},
{w:[[129,76],[167,58],[212,54],[257,61],[300,94],[192,86]],wheels:[[113,149,43],[393,151,42]],body:[[16,109],[26,96],[92,82],[142,56],[213,43],[251,46],[306,78],[329,88],[438,101],[493,122],[491,166],[19,161]]},
{w:[[88,65],[117,37],[163,37],[168,85]],w2:[[177,36],[241,38],[302,78],[303,88],[181,85]],wheels:[[103,168,47],[400,168,47]],body:[[14,127],[26,82],[64,51],[85,27],[249,27],[313,77],[460,103],[491,126],[489,180],[15,181]]},
{w:[[181,36],[244,36],[244,82],[181,80]],w2:[[269,38],[304,42],[337,77],[332,89],[270,82]],wheels:[[98,166,45],[417,169,48]],body:[[11,76],[160,76],[165,39],[174,27],[283,27],[310,35],[359,77],[481,87],[498,125],[497,177],[12,176]]},
{w:[[65,30],[137,30],[132,80],[64,78]],w2:[[158,32],[210,32],[211,83],[154,83]],w3:[[246,34],[291,34],[320,80],[246,84]],wheels:[[120,168,45],[416,168,45]],body:[[31,139],[44,116],[55,18],[84,16],[294,19],[335,83],[456,93],[478,106],[487,144],[480,180],[43,176]]}
];

// Body masks follow the complete painted silhouette, including mirrors and bumpers.
specs[0].body=[[18,112],[25,69],[63,57],[115,32],[154,22],[199,18],[239,22],[287,35],[338,58],[372,76],[418,81],[448,92],[486,109],[484,143],[472,157],[150,159],[39,150],[21,138]];
specs[0].wheels=[[105,139,38],[411,139,38]];
specs[0].w=[[97,49],[135,35],[170,30],[211,28],[213,65],[135,58]];
specs[0].w2=[[226,29],[260,34],[287,43],[313,60],[315,68],[230,67]];
specs[1].body=[[8,64],[245,24],[387,65],[493,94],[497,152],[469,164],[34,164],[9,144]];specs[1].wheels=[[88,151,44],[420,151,44]];
specs[2].body=[[10,120],[18,82],[54,76],[123,45],[184,39],[238,44],[295,60],[348,86],[449,97],[490,115],[490,170],[21,176],[8,153]];specs[2].wheels=[[108,157,41],[410,157,41]];
specs[3].body=[[9,130],[25,84],[76,77],[132,47],[178,39],[235,42],[281,54],[350,90],[448,103],[493,118],[495,164],[465,175],[28,170],[8,157]];specs[3].wheels=[[112,148,40],[423,148,40]];
specs[4].body=[[11,70],[78,81],[161,51],[221,54],[269,66],[319,96],[384,104],[457,113],[498,138],[484,178],[40,177],[12,149]];specs[4].wheels=[[90,147,39],[395,147,39]];
specs[6].body=[[8,153],[23,87],[47,70],[53,43],[89,26],[139,24],[246,27],[285,48],[319,80],[442,98],[492,123],[493,178],[480,190],[15,184]];specs[6].wheels=[[103,168,42],[400,168,43]];
specs[6].w=[[86,65],[117,39],[162,37],[164,85]];specs[6].w2=[[178,37],[218,38],[226,88],[181,86]];specs[6].w3=[[237,40],[266,50],[302,79],[302,86],[237,85]];
specs[7].body=[[4,141],[10,73],[160,74],[162,38],[176,25],[280,26],[311,36],[359,77],[480,86],[499,98],[500,150],[494,172],[475,184],[10,182]];specs[7].wheels=[[98,167,41],[418,168,42]];
specs[8].body=[[19,140],[19,75],[25,60],[48,58],[59,17],[76,13],[296,18],[340,80],[455,93],[477,104],[481,135],[491,141],[488,171],[455,182],[45,180],[40,149]];specs[8].wheels=[[119,171,40],[416,171,40]];

specs[9]={body:[[14,120],[15,94],[24,76],[26,51],[67,46],[115,27],[154,15],[179,13],[230,12],[277,17],[300,29],[345,57],[427,65],[462,78],[486,92],[490,131],[487,144],[443,148],[148,143],[68,135],[17,128]],w:[[121,45],[158,29],[193,22],[203,57],[127,54]],w2:[[207,23],[249,24],[283,33],[297,46],[296,60],[208,57]],wheels:[[111,125,35],[408,125,35]]};
function poly(ctx,points){ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(...p):ctx.moveTo(...p));ctx.closePath()}

// Cache clean native-resolution crops so color changes do not repeat image filtering.
const preparedTiles=new Map();
function sharpenCrop(canvas){
 const context=canvas.getContext('2d'), image=context.getImageData(0,0,canvas.width,canvas.height);
 const original=new Uint8ClampedArray(image.data), output=image.data, width=canvas.width, height=canvas.height;
 for(let y=1;y<height-1;y++)for(let x=1;x<width-1;x++){
  const i=(y*width+x)*4;
  for(let channel=0;channel<3;channel++){
   const center=original[i+channel];
   const average=(original[i-4+channel]+original[i+4+channel]+original[i-width*4+channel]+original[i+width*4+channel])/4;
   const difference=center-average;
   if(Math.abs(difference)>2)output[i+channel]=center+Math.max(-9,Math.min(9,difference*.45));
  }
 }
 context.putImageData(image,0,0);
}

function car(canvas,type,color,tint=.7,front=false,caliper=false){const thumb=canvas!==root.querySelector('.vehicle-canvas');const displayIndex=thumb?[...root.querySelectorAll('.cars canvas')].indexOf(canvas):selected;const n=[0,1,2,9,3,4,6,7,8][displayIndex];const img=n===9?coupePhoto:n===0?teslaPhoto:atlas;if(!img.complete||!img.naturalWidth)return;const w=canvas.clientWidth,h=canvas.clientHeight;if(!w||!h)return;const dpr=Math.min(window.devicePixelRatio||1,2);canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);const ctx=canvas.getContext('2d');ctx.scale(dpr,dpr);ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';ctx.clearRect(0,0,w,h);let sx,sy,sw,sh;if(n===9){const ratio=img.naturalWidth/1774;sx=0;sy=150*ratio;sw=1774*ratio;sh=590*ratio}else if(n===0){let scale=img.naturalWidth/1536;sx=0;sy=220*scale;sw=1536*scale;sh=580*scale}else{sx=(n%3)*img.naturalWidth/3;sy=[80,385,675][Math.floor(n/3)]*img.naturalHeight/1024;sw=img.naturalWidth/3;sh=[210,210,230][Math.floor(n/3)]*img.naturalHeight/1024}const tile=document.createElement('canvas');const unit=thumb?1:Math.min(3,Math.max(1,Math.ceil(Math.min(w*dpr,sw)/512)));const nativeHeight=n===9?170:n===0?194:Math.floor(n/3)===2?230:210;tile.width=512*unit;tile.height=nativeHeight*unit;const c=tile.getContext('2d');c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';const cacheKey=n+':'+unit;if(preparedTiles.has(cacheKey)){c.drawImage(preparedTiles.get(cacheKey),0,0);}else{c.drawImage(img,sx,sy,sw,sh,0,0,tile.width,tile.height);sharpenCrop(tile);const cached=document.createElement('canvas');cached.width=tile.width;cached.height=tile.height;cached.getContext('2d').drawImage(tile,0,0);preparedTiles.set(cacheKey,cached);}const s=Object.fromEntries(Object.entries(specs[n]).map(([key,values])=>[key,values.map(point=>point.map(value=>value*unit))]));if(!thumb&&['vinyl','color'].includes(service)&&paint!==0){
const mask=document.createElement('canvas');mask.width=tile.width;mask.height=tile.height;const m=mask.getContext('2d');m.fillStyle='#fff';poly(m,s.body);m.fill();m.globalCompositeOperation='destination-out';s.wheels.forEach(([x,y,r])=>{m.beginPath();m.arc(x,y,r,0,Math.PI*2);m.fill()});['w','w2','w3'].forEach(k=>{if(s[k]){poly(m,s[k]);m.fill()}});
const coverage=m.getImageData(0,0,tile.width,tile.height).data;const glassMask=document.createElement('canvas');glassMask.width=tile.width;glassMask.height=tile.height;const gm=glassMask.getContext('2d');gm.fillStyle='#fff';['w','w2','w3'].forEach(k=>{if(s[k]){poly(gm,s[k]);gm.fill()}});const glassPixels=gm.getImageData(0,0,tile.width,tile.height).data;const pixels=c.getImageData(0,0,tile.width,tile.height);const p=pixels.data;const rgb=colors[paint][1].match(/\w\w/g).map(v=>parseInt(v,16));
for(let j=0;j<p.length;j+=4){if(!coverage[j+3] || glassPixels[j+3])continue;const lo=Math.min(p[j],p[j+1],p[j+2]),hi=Math.max(p[j],p[j+1],p[j+2]);const lum=.2126*p[j]+.7152*p[j+1]+.0722*p[j+2];const a=coverage[j+3]/255*Math.max(0,Math.min(1,(lum-32)/25))*Math.max(0,1-(hi-lo)/65);if(!a)continue;for(let k=0;k<3;k++){const target=paint===1?lum*.23+Math.pow(lum/255,4)*30:Math.min(255,lum*(.20+rgb[k]/255*.95)+Math.pow(lum/255,5)*32);p[j+k]=p[j+k]*(1-a)+target*a}}
c.putImageData(pixels,0,0);}

if(!thumb&&service==='tint'){c.save();c.fillStyle='#010306';c.globalAlpha=Math.max(0,tint-.18);['w','w2','w3'].forEach(k=>{if(s[k]){poly(c,s[k]);c.fill()}});c.restore()}
if(!thumb&&front){c.save();poly(c,s.body);c.clip();c.fillStyle='#7abcf536';c.fillRect(345*unit,40*unit,165*unit,150*unit);c.restore()}
if(!thumb&&caliper){
const original=c.getImageData(0,0,tile.width,tile.height);c.save();s.wheels.forEach(([x,y,r])=>{c.save();c.translate(x+r*.15,y);c.scale(.68,.68);const gr=c.createLinearGradient(r*.2,0,r*.72,0);gr.addColorStop(0,'#701a19');gr.addColorStop(.35,'#e05340');gr.addColorStop(.7,'#bc3027');gr.addColorStop(1,'#5d1515');c.fillStyle=gr;c.beginPath();c.moveTo(r*.27,-r*.39);c.bezierCurveTo(r*.4,-r*.48,r*.64,-r*.38,r*.67,-r*.20);c.lineTo(r*.65,r*.23);c.quadraticCurveTo(r*.52,r*.43,r*.28,r*.34);c.lineTo(r*.21,r*.16);c.lineTo(r*.24,-r*.18);c.closePath();c.shadowColor='#0009';c.shadowBlur=2;c.fill();c.shadowBlur=0;c.strokeStyle='#f5836e';c.lineWidth=.6;c.beginPath();c.moveTo(r*.31,-r*.32);c.lineTo(r*.53,-r*.27);c.stroke();c.fillStyle='#521710';c.fillRect(r*.3,-r*.06,r*.22,r*.04);c.restore()});c.restore();
const painted=c.getImageData(0,0,tile.width,tile.height);for(let j=0;j<painted.data.length;j+=4){const lum=(original.data[j]+original.data[j+1]+original.data[j+2])/3;const keep=Math.max(0,Math.min(1,(lum-25)/35));for(let k=0;k<3;k++)painted.data[j+k]=painted.data[j+k]*(1-keep)+original.data[j+k]*keep}c.putImageData(painted,0,0);}

const scale=Math.min(w/tile.width,h/tile.height);const dw=tile.width*scale,dh=tile.height*scale;ctx.drawImage(tile,(w-dw)/2,(h-dh)/2,dw,dh)}
coupePhoto.onload=()=>draw();atlas.onload=()=>draw();teslaPhoto.onload=()=>draw();

data.forEach((v,i)=>{const b=document.createElement('button');b.type='button';b.className='cursor-interaction';b.setAttribute('aria-pressed',i===0?'true':'false');const cv=document.createElement('canvas');cv.setAttribute('aria-hidden','true');const label=document.createElement('span');label.textContent=v[0];b.append(cv,label);b.onclick=()=>{selected=i;update()};root.querySelector('.cars').append(b)});colors.forEach((v,i)=>{const b=document.createElement('button');b.className='cursor-interaction';b.type='button';b.setAttribute('aria-label',v[0]);b.setAttribute('aria-pressed',i===0?'true':'false');const sw=document.createElement('i');sw.style.setProperty('--paint',v[1]);b.append(sw);b.onclick=()=>{paint=i;update()};root.querySelector('.swatches').append(b)});
function draw(){root.querySelectorAll('.cars canvas').forEach((cv,i)=>car(cv,data[i][1],i===selected?'#b7c8dd':'#6f7987'));car(root.querySelector('.vehicle-canvas'),data[selected][1],colors[paint][1],1-Number(root.querySelector('input').value)/100,service==='front',service==='caliper')}
function update(){const showLuxury=['vinyl','clear','color','front'].includes(service);if(!showLuxury&&selected===4)selected=2;root.querySelectorAll('.cars button').forEach((b,i)=>{b.hidden=i===4&&!showLuxury});root.querySelector('.model').textContent=data[selected][0];root.querySelectorAll('.cars button').forEach((b,i)=>b.setAttribute('aria-pressed',i===selected?'true':'false'));root.querySelectorAll('.swatches button').forEach((b,i)=>b.setAttribute('aria-pressed',i===paint?'true':'false'));root.querySelector('.color-name').textContent=colors[paint][0];root.querySelector('.paint-control').hidden=!['vinyl','color'].includes(service);root.querySelector('.tint-control').hidden=service!=='tint';const p=service==='caliper'?500:data[selected][index[service]];root.querySelector('.price').textContent=p?'$'+p.toLocaleString('en-US'):'Individually quoted';root.querySelector('.quote .muted').textContent=p?'Starting at':'Bespoke estimate';root.querySelector('.warranty').textContent=service==='vinyl'?'5-year installation warranty':['clear','color','front'].includes(service)?'10-year installation warranty':service==='tint'?'Installation warranty while the original customer owns the vehicle':'Coverage confirmed with your quote';root.querySelector('.inquiry').hidden=true;draw()}
root.querySelector('select').onchange=e=>{service=e.target.value;update()};root.querySelector('input').oninput=e=>{root.querySelector('.vlt').textContent=e.target.value+'%';draw()};root.querySelector('.cta').onclick=()=>{const quoteUrl=Alvion.buildQuoteUrl({vehicle:data[selected][0],service:root.querySelector('select').selectedOptions[0].text,look:['vinyl','color'].includes(service)?colors[paint][0]:service==='tint'?root.querySelector('input').value+'% VLT preview':''});if(window.alvionTrack)window.alvionTrack('click_quote');window.location.href=quoteUrl};new ResizeObserver(draw).observe(root);update();
})();
