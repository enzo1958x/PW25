const Stats={
 mean:a=>a.reduce((s,v)=>s+v,0)/a.length,
 median(a){if(!a.length)return null;const s=[...a].sort((a,b)=>a-b),m=Math.floor(s.length/2);return s.length%2?s[m]:(s[m-1]+s[m])/2;},
 ranks(a){const s=a.map((v,i)=>({v,i})).sort((a,b)=>a.v-b.v),r=[];for(let i=0;i<s.length;){let j=i+1;while(j<s.length&&s[j].v===s[i].v)j++;for(let k=i;k<j;k++)r[s[k].i]=(i+1+j)/2;i=j;}return r;},
 spearman(a,b){if(a.length<3||a.length!==b.length)return null;const x=this.ranks(a),y=this.ranks(b),mx=this.mean(x),my=this.mean(y);let xy=0,xx=0,yy=0;for(let i=0;i<x.length;i++){xy+=(x[i]-mx)*(y[i]-my);xx+=(x[i]-mx)**2;yy+=(y[i]-my)**2;}return xx&&yy?xy/Math.sqrt(xx*yy):null;},
 cramer(t){const n=t.flat().reduce((a,b)=>a+b,0),r=t.map(x=>x.reduce((a,b)=>a+b,0)),c=t[0].map((_,j)=>t.reduce((s,x)=>s+x[j],0));if(!n||r.length<2||c.length<2)return null;let chi=0;t.forEach((row,i)=>row.forEach((v,j)=>{const e=r[i]*c[j]/n;if(e)chi+=(v-e)**2/e;}));return Math.sqrt(chi/(n*Math.min(r.length-1,c.length-1)));}
};
if(typeof module!=='undefined')module.exports=Stats;
