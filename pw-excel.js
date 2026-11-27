/* PW25 V10 – rapporto Excel offline, con grafici PNG incorporati.
   I commenti/calcoli sono condivisi con il PDF; nessun ricalcolo statistico autonomo. */
(function(){
'use strict';
const xml=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
const NS='http://schemas.openxmlformats.org/';
const relType=NS+'officeDocument/2006/relationships/';
const declaration='<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
const relationships=entries=>declaration+`<Relationships xmlns="${NS}package/2006/relationships">${entries.map(([id,type,target])=>`<Relationship Id="${id}" Type="${relType+type}" Target="${xml(target)}"/>`).join('')}</Relationships>`;
const encode=s=>new TextEncoder().encode(s);
const decode=b=>new TextDecoder().decode(b);
const utils=()=>XLSX.utils;
function typed(v){
 if(typeof v!=='string')return v??'';
 const s=v.trim();
 if(/^-?\d+(?:[,.]\d+)?%$/.test(s))return {t:'n',v:Number(s.slice(0,-1).replace(',','.'))/100,z:'0.00%'};
 if(/^-?\d+(?:[,.]\d+)?$/.test(s))return Number(s.replace(',','.'));
 return v;
}
function flatten(v){return Array.isArray(v)?v.join(' | '):v===null||v===undefined?'':typeof v==='object'?JSON.stringify(v):v;}
function rasterize(svg){return new Promise((resolve,reject)=>{
 const box=svg.viewBox.baseVal,w=box.width,h=box.height;
 if(!w||!h)return reject(Error('Grafico senza dimensioni.'));
 const copy=svg.cloneNode(true);copy.setAttribute('width',w);copy.setAttribute('height',h);
 const source=new XMLSerializer().serializeToString(copy),url=URL.createObjectURL(new Blob([source],{type:'image/svg+xml;charset=utf-8'}));
 const img=new Image();img.onerror=()=>{URL.revokeObjectURL(url);reject(Error('Impossibile incorporare il grafico '+svg.getAttribute('aria-label')));};
 img.onload=()=>{try{const scale=Math.min(2,4096/Math.max(w,h)),canvas=document.createElement('canvas');canvas.width=Math.ceil(w*scale);canvas.height=Math.ceil(h*scale);const ctx=canvas.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(img,0,0,canvas.width,canvas.height);canvas.toBlob(async blob=>{try{if(!blob)throw Error('Conversione PNG non disponibile.');resolve({bytes:new Uint8Array(await blob.arrayBuffer()),w,h,name:svg.getAttribute('aria-label')||'Grafico'});}catch(e){reject(e);}},'image/png');}catch(e){reject(e);}finally{URL.revokeObjectURL(url);}};img.src=url;
});}
function layoutSheet(section){
 const u=utils(),table=section.rows,cols=Math.max(6,...table.map(r=>r.length)),widths=[52,...Array(cols-1).fill(19)],rows=[],merges=[],heights=[],roles=[];
 const add=(a,role='body',height=20,merge=false)=>{const r=rows.length;rows.push(a);heights.push({hpt:height});roles.push(role);if(merge)merges.push({s:{r,c:0},e:{r,c:cols-1}});};
 const line=(s,role='body')=>{if(s)add([s],role,Math.max(24,Math.ceil(String(s).length/145)*17+8),true);};
 line(section.title,'title');line(section.note,'body');line('COMMENTO','section');line(section.details.comment,'body');line('CALCOLO / CRITERIO UTILIZZATO','section');line(section.details.formula||'Non previsto per questa analisi.');section.details.calc.forEach(s=>line(s));add(['']);line('DATI DI DETTAGLIO','section');
 const headerRow=rows.length;table.forEach((r,i)=>add(i?r.map((x,j)=>j===0?x:typed(x)):r,i?'body':'header',i?Math.max(22,Math.ceil(String(r[0]||'').length/47)*15+5):34));
 add(['']);line('GRAFICI','section');
 const chartStart=rows.length;const ws=u.aoa_to_sheet(rows);ws['!cols']=widths.map(wch=>({wch}));ws['!rows']=heights;ws['!merges']=merges;
 return {ws,roles,chartStart,headerRow};
}
function plainSheet(rows,widths){const ws=utils().aoa_to_sheet(rows);ws['!cols']=widths.map(wch=>({wch}));ws['!rows']=rows.map((r,i)=>({hpt:i===0?32:Math.max(22,Math.ceil(Math.max(...r.map(x=>String(x??'').length))/95)*15+6)}));return ws;}
function addStyles(z,plans){
 const f=XLSX.CFB.find(z,'/xl/styles.xml');let s=decode(f.content);
 // Preserve all SheetJS styles and append four explicit, valid cell formats.
 const append=(tag,body,count)=>{let base=0;s=s.replace(new RegExp(`<${tag} count="(\\d+)">([\\s\\S]*?)</${tag}>`),(m,n,old)=>{base=Number(n);return `<${tag} count="${base+count}">${old}${body}</${tag}>`;});return base;};
 const font=append('fonts','<font><b/><sz val="14"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font><font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font>',2);
 const fill=append('fills','<fill><patternFill patternType="solid"><fgColor rgb="FF23486D"/><bgColor indexed="64"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FF476B89"/><bgColor indexed="64"/></patternFill></fill>',2);
 const xf=(fontId,fillId,extra='')=>`<xf numFmtId="0" fontId="${fontId}" fillId="${fillId}" borderId="0" xfId="0" applyFont="1" applyFill="1" applyAlignment="1"${extra}><alignment vertical="center" wrapText="1"/></xf>`;
 const style=append('cellXfs',xf(font,fill)+xf(font+1,fill+1)+xf(0,0)+`<xf numFmtId="10" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1" applyAlignment="1"><alignment vertical="center" wrapText="1"/></xf>`,4);
 const put=(p,v)=>{const bytes=typeof v==='string'?encode(v):v;const existing=z.FullPaths.indexOf(z.FullPaths[0]+p);if(existing>=0){z.FileIndex[existing].content=bytes;z.FileIndex[existing].size=bytes.length;}else XLSX.CFB.utils.cfb_add(z,p,bytes);};
 put('xl/styles.xml',s);
 for(const plan of plans){const path=`xl/worksheets/sheet${plan.index}.xml`,entry=XLSX.CFB.find(z,'/'+path);let sheet=decode(entry.content);
 sheet=sheet.replace(/<c\b([^>]*?)>/g,(all,attrs)=>{const ref=attrs.match(/\br="([A-Z]+)(\d+)"/);if(!ref)return all;const role=plan.roles[Number(ref[2])-1]||'body';const addr=ref[1]+ref[2],cell=plan.ws[addr],n=role==='title'?style:role==='section'||role==='header'?style+1:cell?.z==='0.00%'?style+3:style+2;return '<c'+attrs.replace(/\s+s="\d+"/,'')+` s="${n}">`;});
 put(path,sheet);
 }
}
function pack(wb,plans){
 const z=XLSX.CFB.read(new Uint8Array(XLSX.write(wb,{type:'array',bookType:'xlsx',cellStyles:true})),{type:'array'});
 const put=(p,v)=>{const bytes=typeof v==='string'?encode(v):v;const existing=z.FullPaths.indexOf(z.FullPaths[0]+p);if(existing>=0){z.FileIndex[existing].content=bytes;z.FileIndex[existing].size=bytes.length;}else XLSX.CFB.utils.cfb_add(z,p,bytes);};
 addStyles(z,plans);
 let overrides='',total=0;
 for(const plan of plans){if(!plan.images?.length)continue;const i=plan.index;let anchors='',links=[],row=plan.chartStart;
  plan.images.forEach((img,j)=>{const imageId=++total,rel='rId'+(j+1),displayW=Math.min(920,img.w),displayH=displayW*img.h/img.w;put(`xl/media/image${imageId}.png`,img.bytes);links.push([rel,'image',`../media/image${imageId}.png`]);
   anchors+=`<xdr:oneCellAnchor><xdr:from><xdr:col>0</xdr:col><xdr:colOff>0</xdr:colOff><xdr:row>${row}</xdr:row><xdr:rowOff>0</xdr:rowOff></xdr:from><xdr:ext cx="${Math.round(displayW*9525)}" cy="${Math.round(displayH*9525)}"/><xdr:pic><xdr:nvPicPr><xdr:cNvPr id="${j+1}" name="${xml(img.name)}" descr="${xml(img.name)}"/><xdr:cNvPicPr><a:picLocks noChangeAspect="1"/></xdr:cNvPicPr></xdr:nvPicPr><xdr:blipFill><a:blip r:embed="${rel}"/><a:stretch><a:fillRect/></a:stretch></xdr:blipFill><xdr:spPr><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></xdr:spPr></xdr:pic><xdr:clientData/></xdr:oneCellAnchor>`;
   row+=Math.ceil(displayH/20)+2;
  });
  put(`xl/drawings/drawing${i}.xml`,declaration+`<xdr:wsDr xmlns:xdr="${NS}drawingml/2006/spreadsheetDrawing" xmlns:a="${NS}drawingml/2006/main" xmlns:r="${NS}officeDocument/2006/relationships">${anchors}</xdr:wsDr>`);
  put(`xl/drawings/_rels/drawing${i}.xml.rels`,relationships(links));
  put(`xl/worksheets/_rels/sheet${i}.xml.rels`,relationships([['rId1','drawing',`../drawings/drawing${i}.xml`]]));
  const path=`xl/worksheets/sheet${i}.xml`;let s=decode(XLSX.CFB.find(z,'/'+path).content);put(path,s.replace('</worksheet>','<drawing r:id="rId1"/></worksheet>'));
  overrides+=`<Override PartName="/xl/drawings/drawing${i}.xml" ContentType="application/vnd.openxmlformats-officedocument.drawing+xml"/>`;
 }
 let types=decode(XLSX.CFB.find(z,'/[Content_Types].xml').content);if(total&&!/Extension="png"/.test(types))overrides+='<Default Extension="png" ContentType="image/png"/>';put('[Content_Types].xml',types.replace('</Types>',overrides+'</Types>'));
 return XLSX.CFB.write(z,{fileType:'zip',type:'array',compression:true});
}
let busy=false;
window.pwExportExcel=async function(scope,api){
 if(busy)return;busy=true;const button=$('pwExcel');button.disabled=true;const old=button.textContent;button.textContent='Generazione Excel…';
 try{
  // Rebuild from current dataset, then capture immutable export state before rasterization.
  renderPW();const list=api.articles(),selected=scope==='all'?list:[list[Number(scope)]].filter(Boolean);if(!selected.length)throw Error('Importa prima le interviste.');
  const records=data.map(r=>schema.map(s=>flatten(r[s.id]))),dict=schema.map(s=>[s.id,s.label,s.type,s.options.join(' | ')]),n=records.length;
  const sections=selected.map(a=>({title:api.title(a),note:Array.from(a.children).find(e=>e.tagName==='P')?.textContent||'',details:api.details(a),rows:api.rows(a),svgs:Array.from(a.querySelectorAll('figure svg'))}));
  // Read SVGs synchronously before any await; conversion happens locally in browser.
  const images=await Promise.all(sections.map(s=>Promise.all(s.svgs.map(rasterize))));
  const wb=utils().book_new(),plans=[],append=(ws,name,roles,extra={})=>{utils().book_append_sheet(wb,ws,name);plans.push({ws,index:wb.SheetNames.length,roles,...extra});};
  const names=sections.map((s,i)=>`${String(i+1).padStart(2,'0')} ${s.title.replace(/^\d+\s*·\s*/,'').replace(/[\\/?*\[\]:]/g,' ').slice(0,27)}`);
  const intro=[['Project Work n.25','Rapporto statistico Excel'],['Modalità',scope==='all'?'Complessiva':'Singola'],['Data di esportazione',new Date().toLocaleString('it-IT')],['Interviste importate',n],['Analisi incluse',sections.length],['Metodo','Campione non probabilistico; test esplorativi senza correzione multipla. Modello fisso del PW; i filtri della scheda Analisi non si applicano.'],['Grafici','Immagini PNG incorporate degli stessi grafici del PDF; tabelle numeriche disponibili per creare grafici modificabili.'],['Calcoli','Formule e passaggi testuali come nel PDF; valori calcolati dalla webapp, non formule Excel ricalcolabili.'],['Dati','Il foglio Dataset contiene tutti i record normalizzati della sessione, anche nella stampa singola; non include le colonne identificative ignorate in importazione. Verificare eventuali dati personali nei testi liberi prima di condividere.'],['Qualitativa','Le frequenze qualitative sono quelle pubblicate nel PW e non sono ricalcolate sulle interviste importate.'],['Foglio','Analisi'],...sections.map((s,i)=>[names[i],s.title])];
  append(plainSheet(intro,[36,110]),'Indice',intro.map((_,i)=>i===0?'title':i===10?'header':'body'));
  sections.forEach((s,i)=>{const layout=layoutSheet(s);append(layout.ws,names[i],layout.roles,{images:images[i],chartStart:layout.chartStart});});
  const ds=plainSheet([schema.map(s=>s.id),...records],schema.map(s=>s.type==='text'?35:22));ds['!autofilter']={ref:ds['!ref']};append(ds,'Dataset',['header']);
  const dictionary=plainSheet([['Codice','Domanda','Tipo','Opzioni / valori ammessi'],...dict],[17,65,20,90]);append(dictionary,'Dizionario',['header']);
  const file=pack(wb,plans),name=scope==='all'?'PW25_statistiche_complessive.xlsx':`PW25_statistica_${sections[0].title.replace(/[^\p{L}\p{N}]+/gu,'_').slice(0,85)}.xlsx`;
  download(file,name,'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');toast('Rapporto Excel generato.');
 }catch(e){console.error(e);toast('Errore esportazione Excel: '+e.message);}finally{busy=false;button.textContent=old;button.disabled=!api.articles().length;}
};
})();
