'use strict';
// Grafici SVG autonomi, generati dagli stessi valori delle tabelle.
function pwCharts(title,t){
 const rows=t.slice(1), colors=['#315d88','#70a5b1','#d49a49','#8792a2','#ad6665'];
 const val=x=>typeof x==='number'?x:(String(x).trim()===''||String(x).includes('—')?NaN:parseFloat(String(x).replace(',','.')));
 const series=(name,col)=>({name,col});
 function plot(name,rr,ss,opts={}){
  const a=rr.map(r=>({label:String(r[opts.label??0]),v:ss.map(s=>val(r[s.col]))})).filter(r=>r.v.some(Number.isFinite));if(!a.length)return '';
  const min=opts.min??Math.min(0,...a.flatMap(r=>r.v.filter(Number.isFinite))),max=opts.max??Math.max(1,...a.flatMap(r=>r.v.filter(Number.isFinite)))*1.12;
  const x=340,w=470,step=Math.max(42,ss.length*23+15),top=55,h=top+a.length*step+48,scale=v=>x+(v-min)/(max-min)*w,zero=scale(0),fmt=v=>v.toLocaleString('it-IT',{maximumFractionDigits:5})+(opts.suffix||'');
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 920 ${h}" role="img" aria-label="${esc(name)}" font-family="Arial,sans-serif"><rect width="920" height="${h}" fill="#fff"/><text x="18" y="23" font-size="17" font-weight="bold" fill="#243247">${esc(name)}</text>${ss.map((s,i)=>`<rect x="${20+i*175}" y="34" width="12" height="12" fill="${colors[i%5]}"/><text x="${37+i*175}" y="45" font-size="12" fill="#243247">${esc(s.name)}</text>`).join('')}${Array.from({length:5},(_,i)=>{const v=min+(max-min)*i/4;return `<line x1="${scale(v)}" x2="${scale(v)}" y1="${top}" y2="${h-34}" stroke="#dce2e9"/><text x="${scale(v)}" y="${h-13}" text-anchor="middle" font-size="12" fill="#526177">${esc(fmt(v))}</text>`}).join('')}<line x1="${zero}" x2="${zero}" y1="${top}" y2="${h-34}" stroke="#8595a7"/>${a.map((r,i)=>{const y=top+i*step, words=r.label.split(/\s+/),lines=[''];for(const word of words){if((lines.at(-1)+' '+word).length>43&&lines.at(-1))lines.push(word);else lines[lines.length-1]+=(lines.at(-1)?' ':'')+word;}return `<text x="${x-12}" y="${y+step/2-(lines.length-1)*7}" text-anchor="end" font-size="13" fill="#243247">${lines.map((l,j)=>`<tspan x="${x-12}" dy="${j?14:0}">${esc(l)}</tspan>`).join('')}</text>${r.v.map((v,j)=>{if(!Number.isFinite(v))return '';const yy=y+5+j*23,xx=scale(v);return `<rect x="${Math.min(zero,xx)}" y="${yy}" width="${Math.abs(xx-zero)}" height="17" rx="2" fill="${colors[j%5]}"><title>${esc(r.label+' · '+ss[j].name+': '+fmt(v))}</title></rect><text x="${xx+(v<0?-5:5)}" y="${yy+13}" text-anchor="${v<0?'end':'start'}" font-size="12" fill="#243247">${esc(fmt(v))}</text>`}).join('')}`}).join('')}</svg>`;
  return `<figure class="pw-chart"><div class="pw-chart-scroll">${svg}</div><figcaption><button type="button" class="pw-save-svg">Esporta grafico SVG</button></figcaption></figure>`;
 }
 const one=(name,r,col,suffix='',label=0,max)=>plot(name,r,[series(suffix==='%'?'Percentuale':'Conteggio',col)],{suffix,label,max});
 const id=Number(title.split(' ')[0]);
 switch(id){
 case 1:return [...new Set(rows.map(r=>r[0]))].map(g=>one(g,rows.filter(r=>r[0]===g),3,'%',1,100)).join('');
 case 2:return one('Quota di intervistati con almeno un Non so',rows.slice(0,1),2,'%',0,100)+one('Incidenza dei Non so per sezione',rows.filter(r=>String(r[0]).startsWith('Sezione')),2,'%',0,100);
 case 3:return one('Domande con più Non so (prime 15)',rows.filter(r=>r[1]>0).slice(0,15),1);
 case 4:case 5:return one('Incidenza delle risposte Non so',rows,4,'%',0,100)+one('Intervistati con almeno un Non so',rows,6,'%',0,100);
 case 6:return plot('Conoscenza dei data center per istruzione',rows,t[0].slice(1).map((s,i)=>series(['Mai sentito','Sentito parlare','Conosce'][i],i+1)));
 case 7:return plot('Scostamenti dal modello (conteggi)',rows,[series('Sottostima',1),series('Coerente',2),series('Sovrastima',3),series('Non so',4),series('Mancanti',5)]);
 case 8:return one('Superficie stimata (E3)',rows.filter(r=>!String(r[0]).startsWith('E5')),2,'%',0,100)+one('Impatto sulle bollette (E5)',rows.filter(r=>String(r[0]).startsWith('E5')),2,'%',0,100);
 case 9:return one('ICS per ambito e aggregato',rows.slice(0,5),3,'%',0,100)+one('Copertura, media e mediana',rows.filter(r=>['Copertura','Media equiponderata','Media individuale','Mediana individuale'].includes(r[0])),3,'%',0,100);
 case 10:return one('Sensibilità dell’ICS',rows,3,'%',0,100);
 case 11:return plot('Coefficiente di Spearman (ρ)',rows,[series('ρ',2)],{min:-1,max:1})+plot('p-value bilaterali',rows,[series('p-value',3)],{min:0,max:1});
 case 12:return plot('Distribuzione per frequenza di utilizzo IA',t[0].slice(1).map((s,i)=>[s,rows[0][i+1],rows[1][i+1]]),[series('Abituali',1),series('Altri',2)]);
 case 13:return one('Preferenza Italia e contrarietà locale (denominatori in tabella)',rows,2,'%',0,100);
 case 14:return one('Variazione del giudizio F2 → F3',rows.filter(r=>['Calo','Parità','Aumento'].includes(r[0])),1);
 case 15:{const max=Math.max(1,...rows.flatMap(r=>r.slice(1))),svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 540 440" role="img" aria-label="Matrice transizioni F2 F3" font-family="Arial,sans-serif"><rect width="540" height="440" fill="white"/><text x="270" y="24" text-anchor="middle" font-size="17" font-weight="bold">Matrice delle transizioni (conteggi)</text><text x="270" y="49" text-anchor="middle" font-size="13">F3 · Vicino casa</text><text x="12" y="210" font-size="12">F2</text>${[1,2,3,4,5].map((v,i)=>`<text x="${115+i*74}" y="72" text-anchor="middle">${v}</text><text x="65" y="${119+i*63}" text-anchor="middle">${v}</text>`).join('')}${rows.map((r,i)=>r.slice(1).map((v,j)=>`<rect x="${80+j*74}" y="${83+i*63}" width="70" height="59" rx="4" fill="#315d88" fill-opacity="${.07+.93*v/max}"/><text x="${115+j*74}" y="${119+i*63}" text-anchor="middle" fill="${v/max>.5?'white':'#243247'}" font-size="17" font-weight="bold">${v}</text>`).join('')).join('')}<text x="270" y="420" text-anchor="middle" font-size="12">Diagonale = giudizio invariato · sotto diagonale = calo</text></svg>`;return `<figure class="pw-chart pw-heat"><div class="pw-chart-scroll">${svg}</div><figcaption><button type="button" class="pw-save-svg">Esporta grafico SVG</button></figcaption></figure>`;}
 case 16:return ['I1','I2','I3'].map(g=>one(g+' · Valori pubblicati nel PW (non ricalcolati)',rows.filter(r=>r[0]===g),2,'%',1,100)).join('');
 default:return '';
 }
}
document.getElementById('pwResults').addEventListener('click',e=>{const b=e.target.closest('.pw-save-svg');if(!b)return;const svg=b.closest('figure').querySelector('svg');download(svg.outerHTML,'PW25_'+svg.getAttribute('aria-label').replace(/[^\p{L}\p{N}]+/gu,'_')+'.svg','image/svg+xml');});
