const Stats={
 mean:a=>a.reduce((s,v)=>s+v,0)/a.length,
 median(a){if(!a.length)return null;const s=[...a].sort((a,b)=>a-b),m=Math.floor(s.length/2);return s.length%2?s[m]:(s[m-1]+s[m])/2;},
 ranks(a){const s=a.map((v,i)=>({v,i})).sort((a,b)=>a.v-b.v),r=[];for(let i=0;i<s.length;){let j=i+1;while(j<s.length&&s[j].v===s[i].v)j++;for(let k=i;k<j;k++)r[s[k].i]=(i+1+j)/2;i=j;}return r;},
 spearman(a,b){if(a.length<3||a.length!==b.length)return null;const x=this.ranks(a),y=this.ranks(b),mx=this.mean(x),my=this.mean(y);let xy=0,xx=0,yy=0;for(let i=0;i<x.length;i++){xy+=(x[i]-mx)*(y[i]-my);xx+=(x[i]-mx)**2;yy+=(y[i]-my)**2;}return xx&&yy?xy/Math.sqrt(xx*yy):null;},
 cramer(t){const n=t.flat().reduce((a,b)=>a+b,0),r=t.map(x=>x.reduce((a,b)=>a+b,0)),c=t[0].map((_,j)=>t.reduce((s,x)=>s+x[j],0));if(!n||r.length<2||c.length<2)return null;let chi=0;t.forEach((row,i)=>row.forEach((v,j)=>{const e=r[i]*c[j]/n;if(e)chi+=(v-e)**2/e;}));return Math.sqrt(chi/(n*Math.min(r.length-1,c.length-1)));}
};
if(typeof module!=='undefined')module.exports=Stats;
// Test bilaterali. Spearman: approssimazione t, ranghi medi per ex aequo.
Stats.logChoose=function(n,k){if(k<0||k>n)return -Infinity;let s=0;for(let i=1;i<=Math.min(k,n-k);i++)s+=Math.log(n-i+1)-Math.log(i);return s;};
Stats.sign=function(a,b){const n=a+b;if(!n)return null;let p=0;for(let i=0;i<=Math.min(a,b);i++)p+=Math.exp(this.logChoose(n,i)-n*Math.LN2);return Math.min(1,2*p);};
Stats.fisher=function(t){if(t.length!==2||!t[0].length)return null;const c=t[0].map((v,i)=>v+t[1][i]),r=t[0].reduce((a,b)=>a+b,0),n=c.reduce((a,b)=>a+b,0);if(!r||r===n||c.filter(x=>x>0).length<2)return null;const den=this.logChoose(n,r),obs=t[0].reduce((s,v,i)=>s+this.logChoose(c[i],v),0)-den;let p=0;const walk=(i,left,l)=>{if(i===c.length){if(!left&&l-den<=obs+1e-10)p+=Math.exp(l-den);return;}for(let k=Math.max(0,left-c.slice(i+1).reduce((a,b)=>a+b,0));k<=Math.min(c[i],left);k++)walk(i+1,left-k,l+this.logChoose(c[i],k));};walk(0,r,0);return Math.min(1,p);};
Stats.spearmanP=function(r,n){if(r===null||n<3)return null;if(Math.abs(r)>=1-1e-14)return 0; // regularized beta integral via continued fraction
 const a=(n-2)/2,b=.5,x=1-r*r;
 function lg(z){const p=[676.5203681218851,-1259.1392167224028,771.3234287776531,-176.6150291621406,12.507343278686905,-.13857109526572012,9.984369578019572e-6,1.5056327351493116e-7];if(z<.5)return Math.log(Math.PI)-Math.log(Math.sin(Math.PI*z))-lg(1-z);z--;let v=.9999999999998099;p.forEach((q,i)=>v+=q/(z+i+1));const t=z+7.5;return .5*Math.log(2*Math.PI)+(z+.5)*Math.log(t)-t+Math.log(v);}
 function cf(a,b,x){let c=1,d=1-(a+b)*x/(a+1);if(Math.abs(d)<1e-30)d=1e-30;d=1/d;let h=d;for(let m=1;m<=200;m++){for(const q of [m*(b-m)*x/((a+2*m-1)*(a+2*m)),-(a+m)*(a+b+m)*x/((a+2*m)*(a+2*m+1))]){d=1+q*d;c=1+q/c;if(Math.abs(d)<1e-30)d=1e-30;if(Math.abs(c)<1e-30)c=1e-30;d=1/d;var delta=d*c;h*=delta;}if(Math.abs(delta-1)<1e-12)break;}return h;}
 if(x>=1)return 1;const k=Math.exp(lg(a+b)-lg(a)-lg(b)+a*Math.log(x)+b*Math.log1p(-x));return Math.max(0,Math.min(1,x<(a+1)/(a+b+2)?k*cf(a,b,x)/a:1-k*cf(b,a,1-x)/b));};
