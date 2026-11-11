/* pltr.js : Palantirのページ（company=p）だけを、1画面ずつ止まる縦の構成で描く。
   データ：pltr.json（本文・数字）、pltr-x.json（柏原のX投稿）、pltr-radar.json（外れ値リサーチ）。後ろ2つは tools/pltr_refresh.py で作り直す。
   PC（幅1024px以上）：1画面＝100vh、scroll-snap で1画面ずつ止まる。↓・PageDown・スペースで次、↑・PageUpで前。右端に現在位置のドット。
   スマホ：普通の縦スクロール。他の5社は既存の描画のまま（setCompany / setView を包むだけ）。 */
(function(){
  let P=null,X={items:[]},R={items:[]},on=false,rendered=false;
  const st={hist:-1,eco:0,quote:0,box:0,term:0,vid:0,x:0,kq:0};
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const YEN=154;
  const COL={usc:'#0078bb',usg:'#c4622d',ig:'#2f9e8f',ic:'#8a6bbf'};
  const desk=()=>matchMedia('(min-width:1024px)').matches;
  /* 百万ドル → 「23.1億ドル」と「約3,563億円」 */
  function usd(m){const oku=m/100;return (oku>=10?oku.toLocaleString('ja-JP',{maximumFractionDigits:1}):oku.toLocaleString('ja-JP',{maximumFractionDigits:2}))+'億ドル'}
  function yen(m){const y=m*YEN/100;if(y>=10000){const c=Math.floor(y/10000),r=Math.round(y-c*10000);return '約'+c+'兆'+(r?r.toLocaleString('ja-JP')+'億円':'円')}return '約'+Math.round(y).toLocaleString('ja-JP')+'億円'}
  function jdate(s){const m=String(s||'').match(/(\d{4})-(\d{2})-(\d{2})/);return m?`${+m[1]}年${+m[2]}月${+m[3]}日`:''}
  function stars(n){return `<span class="pl-stars" aria-label="連携度${n}">${'★'.repeat(n)}<i>${'★'.repeat(5-n)}</i></span>`}

  /* 論点ごとの「この場面から再生」：各画面に小さく1つだけ。押したときだけサイト内のプレーヤーで開く（自動再生しない） */
  const mmss=t=>`${Math.floor(t/60)}:${String(t%60).padStart(2,'0')}`;
  function clipBtn(c){return c&&c.v?`<button class="pl-clip" onclick="plClip('${esc(c.v)}',${+c.t||0})"><i aria-hidden="true">▶</i>この場面から再生<span>${esc(c.label)}　${mmss(+c.t||0)}〜</span></button>`:''}
  function screen(id,toc,head,body,cls,clip){const c=clipBtn(clip!==undefined?clip:(P.clips||{})[id]);return `<section class="pl-screen ${cls||''}" id="s-${id}" data-toc="${toc}"><div class="pl-inner">${head?`<div class="pl-head"><div><h2>${head.h}</h2>${head.lead?`<p class="pl-lead">${head.lead}</p>`:''}</div>${c}</div>`:(c?`<div class="pl-clip-float">${c}</div>`:'')}<div class="pl-body">${body}</div></div></section>`}
  const coName=k=>(typeof catalog!=='undefined'&&catalog.companies[k]?.name)||k;
  const coKey=n=>typeof catalog==='undefined'?null:(Object.keys(catalog.companies).find(k=>k!=='p'&&catalog.companies[k].name.toLowerCase()===String(n).toLowerCase())||null);

  /* 01 概要 */
  function sOverview(){const o=P.overview;return screen('overview','overview',null,`<div class="pl-ov"><div class="pl-ov-text"><div class="pl-ov-brand">${typeof companyLogo==='function'?companyLogo('p','pl-logo'):''}<div><h1>${esc(o.title)}</h1><small>${esc(o.ticker)}</small></div></div><p class="pl-ov-lead">${esc(o.lead)}</p></div><div class="pl-kpis">${o.kpis.map(k=>`<article class="pl-kpi"><small>${esc(k.label)}</small><b>${esc(k.value)}</b><span class="pl-yen">${esc(k.yen)}</span><em>${esc(k.note)}</em></article>`).join('')}</div></div>`,'is-cover')}
  function daysTo(d){const now=new Date(),j=new Date(now.getTime()+9*3600e3),t=Date.UTC(j.getUTCFullYear(),j.getUTCMonth(),j.getUTCDate()),[y,m,dd]=d.split('-').map(Number);return Math.round((Date.UTC(y,m-1,dd)-t)/864e5)}
  function sWeek(){const w=R.week;if(!w)return '';
    return screen('week','overview',{h:esc(P.weekTitle),lead:`国内外の投資・テック系チャンネルの再生数の集計から、${esc(w.period)}の動きをまとめました。`},`<div class="pl-week"><ol class="pl-week-lines">${w.lines.map(l=>`<li>${esc(l)}</li>`).join('')}</ol></div><p class="pl-foot">集計：${jdate(w.asof)}。</p>`)}
  function sNext(){const n=P.next;if(!n)return '';const d=daysTo(n.date);
    return screen('next','overview',{h:'次の決算まで',lead:esc(n.label)+(n.confirmed?'の発表日です。':'の発表見込み日です。')},`<div class="pl-week pl-next"><article class="pl-count"><small>${esc(n.label)}まで</small><b>${d>0?`あと<em>${d}</em>日`:d===0?'<em>今日</em>':'発表済み'}</b><span>${jdate(n.date)}（米国時間）${n.confirmed?'':'・見込み'}</span></article><p class="pl-next-note">${esc(n.note)}</p></div><p class="pl-foot">日数は日本時間の今日から数えています。</p>`)}



  /* 02 成長 */
  function sAnnual(){const a=P.annual,max=Math.max(...a.rows.map(r=>r.value));
    return screen('growth','growth',{h:esc(a.title),lead:esc(a.lead)},`<div class="pl-bars" role="img" aria-label="年間売上の推移">${a.rows.map(r=>`<div class="pl-bar${r.forecast?' is-fc':''}" title="${r.year}年 ${usd(r.value)}（${yen(r.value)}）"><span class="pl-bar-v"><b>${usd(r.value).replace('億ドル','')}</b><small>${yen(r.value)}</small></span><i style="height:${(r.value/max*100).toFixed(1)}%"></i><span class="pl-bar-y">${r.year}${r.forecast?'<small>見通し</small>':''}</span></div>`).join('')}</div><p class="pl-foot">単位：億ドル。${esc(a.foot)}</p>`)}

  function sKessan(){const k=P.kessan;if(!k)return '';const q=k.quarters[st.kq];
    return screen('kessan','growth',{h:esc(k.title),lead:esc(k.lead)},`<div class="pl-ks-tabs" role="tablist" aria-label="四半期">${k.quarters.map((x,j)=>`<button role="tab" aria-selected="${j===st.kq}" onclick="plPick('kq',${j})"><b>${esc(x.q)}</b><span>${jdate(x.date)}発表　${esc(x.react)}</span></button>`).join('')}</div><div class="pl-ks" role="tabpanel"><div class="pl-ks-row pl-ks-h"><span>決算の前に見ると書いた点</span><span>結果</span><span>判定</span></div>${q.rows.map((r,j)=>`<div class="pl-ks-row"><div><b>${j+1}　${esc(r.point)}</b><small>${esc(r.why)}</small></div><p>${esc(r.result)}</p><em class="is-${r.mark==='当たり'?'hit':r.mark==='外れ'?'miss':'mid'}">${esc(r.mark)}</em></div>`).join('')}</div><p class="pl-foot">${esc(k.foot)}</p>`,'',q.clip)}


  /* 03 エコシステム */
  function sEco(){const e=P.eco,i=st.eco,p=e.partners[i];
    const logo=x=>x.logo?`<span class="pl-plogo" style="background:${x.logoBg||'#fff'}"><img src="${x.logo}" alt=""></span>`:`<span class="pl-plogo is-text">${esc(x.name.slice(0,1))}</span>`;
    return screen('eco','eco',{h:esc(e.title),lead:esc(e.lead)},`<p class="pl-legend-text">${esc(e.legend)}</p><div class="pl-eco"><div class="pl-plist" role="tablist" aria-label="提携先">${e.partners.map((x,j)=>`<button role="tab" aria-selected="${j===i}" onclick="plPick('eco',${j})">${logo(x)}<b>${esc(x.name)}</b>${stars(x.stars)}</button>`).join('')}</div><article class="pl-pcard" role="tabpanel"><div class="pl-pcard-head">${logo(p)}<div><h3>${esc(p.name)}</h3><small>${esc(p.kind)}　${esc(p.since)}</small></div>${stars(p.stars)}</div><p>${esc(p.text)}</p>${coKey(p.name)?`<button class="pl-golink" onclick="setCompany('${coKey(p.name)}')">${esc(p.name)}のページへ</button>`:''}</article></div>`)}




  function sLinks(){const l=P.links;if(!l||typeof catalog==='undefined')return '';
    return screen('links','eco',{h:esc(l.title),lead:esc(l.lead)},`<div class="pl-links">${l.items.filter(x=>catalog.companies[x.k]).map(x=>`<button class="pl-link${x.stars?' is-direct':''}" onclick="setCompany('${x.k}')"><span class="pl-link-head">${typeof companyLogo==='function'?companyLogo(x.k,'pl-link-logo'):''}<b>${esc(coName(x.k))}</b>${x.stars?stars(x.stars):''}</span><small>${esc(x.rel)}</small><p>${esc(x.text)}</p><span class="pl-link-go">${esc(coName(x.k))}のページへ</span></button>`).join('')}</div>`)}

  /* 04 競合比較 */



  function sModel(){const m=P.model,ln=k=>m.lanes.find(x=>x.key===k);
    const who=l=>`<div class="pl-md-who is-${l.key}"><div class="pl-md-share"><b>${esc(l.name)}</b><em>${esc(l.share)}</em></div><small>${esc(l.split)}</small><p>${esc(l.who)}</p></div>`;
    const prod=(x,cls)=>`<div class="pl-md-prod ${cls}"><b>${esc(x.product||x.name)}</b><span>${esc(x.psub||x.sub)}</span></div>`;
    return screen('model','overview',{h:esc(m.title),lead:esc(m.lead)},`<div class="pl-md"><span class="pl-md-cap c1">お客さん（売上の割合）</span><span class="pl-md-cap c3">製品</span><span class="pl-md-cap c5">稼ぎ方</span>
      ${prod(m.aip,'is-aip')}${who(ln('gov'))}<i class="pl-md-ar r2" aria-hidden="true"></i>${prod(ln('gov'),'is-gov')}${who(ln('com'))}<i class="pl-md-ar r3" aria-hidden="true"></i>${prod(ln('com'),'is-com')}${prod(m.apollo,'is-apollo')}
      <i class="pl-md-ar2" aria-hidden="true"></i>
      <div class="pl-md-money">${m.money.map(x=>`<div><b>${esc(x.name)}</b><span>${esc(x.sub)}</span></div>`).join('')}<div class="pl-md-big"><small>${esc(m.big.label)}</small><b>${esc(m.big.value)}</b><span class="pl-yen">${esc(m.big.yen)}</span><em>${esc(m.big.note)}</em></div></div></div><p class="pl-foot">${m.notes.map(esc).join('　')}</p>`)}
  function sMix(){const m=P.mix,v=k=>m.parts.find(p=>p.key===k),tot=m.parts.reduce((a,b)=>a+b.value,0);
    const tile=p=>`<div class="pl-mo-t is-${p.key}" style="flex:${p.value}"><small>${esc(p.label)}</small><b>${usd(p.value)}</b><span>${yen(p.value)}　${(p.value/tot*100).toFixed(0)}%${p.growth?`　前年比${esc(p.growth.replace('+',''))}増`:''}</span></div>`;
    const col=(name,a,b)=>{const s=a.value+b.value;return `<div class="pl-mo-c" style="flex:${s}"><h3>${name}<em>${(s/tot*100).toFixed(1)}%</em></h3><div class="pl-mo-tiles">${tile(a)}${tile(b)}</div></div>`};
    return screen('mix','overview',{h:esc(m.title),lead:esc(m.lead)},`<div class="pl-mo" role="img" aria-label="${esc(m.period)}の売上の内訳">${col('政府',v('usg'),v('ig'))}${col('企業',v('usc'),v('ic'))}</div><p class="pl-foot">${esc(m.foot)}</p>`)}
  function sQuarter(){const q=P.quarterly,n=q.labels.length,W=1200,H=420,L=70,Rr=150,T=40,B=50,max=1000;
    const X=i=>L+i*(W-L-Rr)/(n-1),Y=v=>T+(1-v/max)*(H-T-B),C={usg:'#14324a',usc:'#0078bb'};
    const grid=[0,250,500,750,1000].map(g=>`<line x1="${L}" x2="${W-Rr+20}" y1="${Y(g)}" y2="${Y(g)}" class="g"/><text x="${L-12}" y="${Y(g)+6}" class="ax" text-anchor="end">${g/100}</text>`).join('');
    const xs=q.labels.map((l,i)=>`<text x="${X(i)}" y="${H-14}" class="ax" text-anchor="middle">${esc(l)}</text>`).join('');
    const line=s=>{const c=C[s.key],pts=s.values.map((v,i)=>[X(i),Y(v)]);return `<polyline points="${pts.map(p=>p.join(',')).join(' ')}" fill="none" stroke="${c}" stroke-width="4" stroke-linejoin="round"/>${pts.map((p,i)=>`<circle cx="${p[0]}" cy="${p[1]}" r="${i===n-1?9:6}" fill="${i===n-1?c:'#fff'}" stroke="${c}" stroke-width="3"><title>${esc(q.labels[i])} ${esc(s.label)} ${usd(s.values[i])}（${yen(s.values[i])}）</title></circle>`).join('')}<text x="${X(0)}" y="${pts[0][1]+(s.key==='usc'?30:-16)}" class="v" text-anchor="middle" fill="${c}">${usd(s.values[0]).replace('億ドル','')}</text><text x="${X(n-1)+18}" y="${pts[n-1][1]+(s.key==='usc'?-6:22)}" class="v vl" fill="${c}">${usd(s.values[n-1]).replace('億ドル','')}<tspan class="vn" x="${X(n-1)+18}" dy="${s.key==='usc'?-30:26}">${esc(s.label)}</tspan></text>`};
    return screen('quarterly','growth',{h:esc(q.title),lead:esc(q.lead)},`<div class="pl-lc"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="米国政府と米国の民間企業の四半期売上の推移">${grid}${xs}${q.series.map(line).join('')}</svg></div><p class="pl-foot">縦軸は億ドル。${esc(q.foot)}</p>`)}
  function sHistory(){const h=P.history,i=st.hist<0?h.events.length-1:st.hist,e=h.events[i];
    return screen('history','growth',{h:esc(h.title),lead:esc(h.lead)},`<div class="pl-tl2" role="tablist" aria-label="年">${h.events.map((x,j)=>`<button role="tab" aria-selected="${j===i}" onclick="plPick('hist',${j})"><b>${esc(x.year)}</b><i aria-hidden="true"></i><span>${esc(x.title)}</span></button>`).join('')}</div><article class="pl-tl-card" role="tabpanel"><div class="pl-tl-year">${esc(e.year)}</div><div><h3>${esc(e.title)}</h3><p>${esc(e.text)}</p><div class="pl-change"><b>何が変わったか</b><p>${esc(e.change)}</p></div></div></article>`)}
  function sNews(){const e=P.eco;return screen('news','eco',{h:esc(e.newsTitle),lead:esc(e.newsLead||'')},`<div class="pl-nw">${e.news.map((n,j)=>{const m=String(n.date).match(/(\d{4})-(\d{2})-(\d{2})/);return `<article class="${j===0?'is-top':''}"><div class="pl-nw-d"><b>${+m[2]}.${m[3]}</b><small>${m[1]}</small></div><div class="pl-nw-t"><h3>${esc(n.title)}</h3><p>${esc(n.text)}</p></div><div class="pl-nw-f"><b>${esc(n.fig||'')}</b><small>${esc(n.figSub||'')}</small></div></article>`}).join('')}</div>`)}
  const LG=(src,name,bg,cls)=>src?`<span class="pl-lg ${cls||''}"${bg?` style="background:${bg}"`:''}><img src="${src}" alt="${esc(name)}"></span>`:`<span class="pl-lg is-text ${cls||''}">${esc(name)}</span>`;
  function sJapan(){const j=P.japan;if(!j)return '';
    return screen('japan','eco',{h:esc(j.title),lead:esc(j.lead)},`<div class="pl-jd"><div class="pl-jd-hub">${LG('assets/logo-p.svg','Palantir','#0078bb','is-hub')}<b>Palantir</b></div><div class="pl-jd-cols">${j.items.map(x=>`<div class="pl-jd-col"><span class="pl-jd-rel">${esc(x.rel)}</span><article><div class="pl-jd-head">${LG(x.logo,x.name)}<div><h3>${esc(x.name)}</h3><small>${esc(x.since)}</small></div></div><dl>${x.facts.map(f=>`<div><dt>${esc(f.v)}</dt><dd>${esc(f.l)}</dd></div>`).join('')}</dl><p>${esc(x.text)}</p></article></div>`).join('')}</div></div><p class="pl-foot">${esc(j.note||'')}${esc(j.foot)}</p>`)}
  function sJpeers(){const j=P.jpeers;if(!j)return '';const mo=Math.max(...j.rows.map(r=>r.oku)),mg=Math.max(...j.rows.map(r=>r.g));
    return screen('jpeers','eco',{h:esc(j.title),lead:esc(j.lead)},`<div class="pl-cmp"><div class="pl-cmp-h"><span></span><span>売上の規模</span><span>伸び（前年比）</span></div>${j.rows.map(x=>`<div class="pl-cmp-r${x.self?' is-self':''}"><div class="pl-cmp-n">${LG(x.logo,x.name,x.logoBg)}<div><b>${esc(x.name)}</b><small>${esc(x.biz)}</small></div></div><div class="pl-cmp-b"><i style="width:${(x.oku/mo*100).toFixed(1)}%"></i><span><b>${esc(x.self?x.yen:x.rev)}</b><small>${esc(x.self?x.rev+'　':'')+esc(x.period)}</small></span></div><div class="pl-cmp-b is-g"><i style="width:${(x.g/mg*100).toFixed(1)}%"></i><span><b>${esc(x.growth)}</b></span></div></div>`).join('')}</div><ul class="pl-jp-notes">${j.notes.map(n=>`<li>${esc(n)}</li>`).join('')}</ul><p class="pl-foot">${esc(j.foot)}</p>`)}
  function sRivals(){const r=P.rivals,ma=Math.max(...r.rows.map(x=>x.ann)),mg=Math.max(...r.rows.map(x=>Math.abs(x.g)));
    return screen('rivals','rivals',{h:esc(r.title),lead:esc(r.lead)},`<div class="pl-cmp is-rv"><div class="pl-cmp-h"><span></span><span>年間の売上</span><span>直近の売上と伸び</span></div>${r.rows.map(x=>`<div class="pl-cmp-r${x.self?' is-self':''}"><div class="pl-cmp-n">${LG(x.logo,x.name,x.logoBg,x.wide?'is-wide':'')}<div><b>${esc(x.name)}${x.private?'<em>非上場</em>':''}</b><small>${esc(x.field)}</small></div></div><div class="pl-cmp-b"><i style="width:${(x.ann/ma*100).toFixed(1)}%"></i><span><b>${x.ann.toLocaleString('ja-JP')}億ドル${x.name==='Databricks'?'超':''}</b><small>${esc(x.annual==='非上場'?'':x.annual.replace(/^.*?（/,'（'))}</small></span></div><div class="pl-cmp-b is-g${x.g<0?' is-neg':''}"><i style="width:${(Math.abs(x.g)/mg*100).toFixed(1)}%"></i><span><b>${esc(x.growth)}</b><small>${esc(x.revenue)}（${esc(x.yen)}）${esc(x.period)}</small></span></div></div>`).join('')}</div><p class="pl-foot">${esc(r.foot)}</p>`)}
  function sRivals2(){const r=P.rivals,row=n=>r.rows.find(x=>x.name===n)||{name:n};
    return screen('rivals2','rivals',{h:'Palantirと比べて　どの層で重なるか',lead:'同じ「データとAI」でも、売っている層が違う。上から現場、意思決定、データの順。'},`<div class="pl-ly">${r.layers.map(l=>`<div class="pl-ly-r${l.self?' is-self':''}"><h3>${esc(l.name)}</h3><div class="pl-ly-who">${l.who.map(n=>{const x=row(n);return `<span class="pl-ly-co${n==='Palantir'?' is-p':''}">${LG(x.logo,n,x.logoBg,x.wide?'is-wide':'')}<b>${esc(n)}</b></span>`}).join('')}</div><p>${esc(l.text)}</p></div>`).join('')}</div>`)}

  /* 05 CEOと製品 */
  function sCeo(){const c=P.ceo,q=c.quotes[st.quote];
    return screen('ceo','ceo',null,`<div class="pl-ceo"><figure class="pl-ceo-photo"><img src="${c.photo}" alt="${esc(c.name)}"><figcaption><b>${esc(c.name)}</b>${esc(c.role)}</figcaption></figure><div class="pl-ceo-q"><h2>${esc(c.title)}</h2><blockquote><p>「${esc(q.ja)}」</p><p class="pl-en" lang="en">${esc(q.en)}</p></blockquote><p class="pl-when">${esc(q.when)}　${esc(q.where)}</p><p class="pl-point">${esc(q.point)}</p><div class="pl-qnav" role="tablist" aria-label="発言">${c.quotes.map((x,j)=>`<button role="tab" aria-selected="${j===st.quote}" onclick="plPick('quote',${j})">${j+1}<span>${esc(x.when)}</span></button>`).join('')}</div></div></div>`)}
  function sProduct(){const p=P.product,b=p.boxes[st.box];
    return screen('product','ceo',{h:esc(p.title),lead:esc(p.lead)},`<div class="pl-prod"><div class="pl-shot"><img src="${p.image}" alt="Foundryの工程シミュレーション画面">${p.boxes.map((x,j)=>`<button class="pl-box${j===st.box?' is-on':''}" style="left:${x.x}%;top:${x.y}%;width:${x.w}%;height:${x.h}%" onclick="plPick('box',${j})" aria-label="${x.n} ${esc(x.title)}"><span>${x.n}</span></button>`).join('')}</div><ol class="pl-boxnotes">${p.boxes.map((x,j)=>`<li class="${j===st.box?'is-on':''}"><button onclick="plPick('box',${j})"><span>${x.n}</span><b>${esc(x.title)}</b></button>${j===st.box?`<p>${esc(x.text)}</p>`:''}</li>`).join('')}</ol></div><p class="pl-foot">${esc(p.caption)}</p>`)}

  /* 06 動画・X */
  function myVideos(){return (typeof videos!=='undefined'?videos.items:[]).filter(v=>v.company==='p'&&v.publisher==='柏原迅'&&v.kind!=='インタビュー'&&!/#shorts/i.test(v.title)).map(v=>({...v,date:v.date||(v.id==='WCmi-EHclTY'?'2026-11-03':'')})).sort((a,b)=>b.date.localeCompare(a.date))}
  const thumb=v=>v.thumbnailRemote?`https://i.ytimg.com/vi/${v.id}/hqdefault.jpg`:`assets/video-${v.id}.jpg`;
  function pager(kind,page,per,total,unit){const pages=Math.ceil(total/per);if(pages<=1)return '';return `<div class="pl-pager"><button onclick="plPage('${kind}',-1)" ${page<=0?'disabled':''}>前へ</button><span>${page*per+1}〜${Math.min(total,(page+1)*per)}${unit}目／全${total}${unit}</span><button onclick="plPage('${kind}',1)" ${page>=pages-1?'disabled':''}>次へ</button></div>`}
  const VPER=()=>desk()?8:4,XPER=()=>desk()?3:3;
  function sVideos(){const m=P.media,list=myVideos(),per=VPER(),pg=Math.min(st.vid,Math.max(0,Math.ceil(list.length/per)-1));
    return screen('videos','media',{h:esc(m.videoTitle),lead:esc(m.videoLead)},`<div class="pl-vgrid">${list.slice(pg*per,pg*per+per).map(v=>`<button class="pl-vcard" onclick="plPlay('${v.id}')"><span class="pl-thumb"><img loading="lazy" src="${thumb(v)}" alt=""><i aria-hidden="true">▶</i></span><b>${esc(v.title.replace(/[\u{1F300}-\u{1FAFF}☀-➿️]/gu,''))}</b><small>${jdate(v.date)}</small></button>`).join('')}</div>${pager('vid',pg,per,list.length,'本')}`)}
  function sX(){const m=P.media,list=X.items||[],per=XPER(),pg=Math.min(st.x,Math.max(0,Math.ceil(list.length/per)-1));if(!list.length)return '';
    return screen('x','media',{h:esc(m.xTitle),lead:esc(m.xLead)+`全${list.length}件。`},`<div class="pl-xgrid">${list.slice(pg*per,pg*per+per).map(p=>`<article class="pl-xcard"><small>${jdate(p.date)}${p.imp?`　表示${Number(p.imp).toLocaleString('ja-JP')}回`:''}</small><p>${esc(p.text)}</p>${p.text.length>200?`<button class="pl-more" onclick="plPost('${p.id}')">全文を読む</button>`:''}</article>`).join('')}</div>${pager('x',pg,per,list.length,'件')}`)}
  function sRadar(){const m=P.media,list=(R.items||[]).filter(x=>x.ratio>=1);if(!list.length)return '';const max=Math.max(...list.map(x=>x.ratio));
    return screen('radar','media',{h:esc(m.radarTitle),lead:esc(m.radarLead)+'倍率は各チャンネルの普段の再生数（中央値）を1倍としたものです。'},`<ol class="pl-radar">${list.map(x=>`<li><button class="pl-rthumb" onclick="plPlay('${esc(x.id)}')" aria-label="再生"><img loading="lazy" src="https://i.ytimg.com/vi/${esc(x.id)}/mqdefault.jpg" alt=""></button><div class="pl-rbody"><b>${esc(x.title.replace(/[\u{1F300}-\u{1FAFF}\u2600-\u27BF\uFE0F]/gu,''))}</b><small>${esc(x.channel)}　${jdate(x.date)}　${Number(x.views).toLocaleString('ja-JP')}回再生</small></div><div class="pl-rratio"><b>${x.ratio.toFixed(1)}倍</b><i style="width:${(x.ratio/max*100).toFixed(0)}%"></i></div></li>`).join('')}</ol><p class="pl-foot">${esc(R.note||'')}　再生数の確認日：${(()=>{const c=list.map(x=>x.checked).filter(Boolean).sort();return c.length?(c[0]===c[c.length-1]?jdate(c[0]):jdate(c[0])+'〜'+jdate(c[c.length-1])):jdate(R.updated)})()}</p>`)}

  /* 07 用語 */
  function sTerms(){const t=P.terms,x=t.items[st.term];
    return screen('terms','terms',{h:esc(t.title),lead:esc(t.lead)},`<div class="pl-terms"><div class="pl-tlist" role="tablist" aria-label="用語">${t.items.map((y,j)=>`<button role="tab" aria-selected="${j===st.term}" onclick="plPick('term',${j})">${esc(y.term)}</button>`).join('')}</div><article class="pl-tcard" role="tabpanel"><h3>${esc(x.term)}<small>${esc(x.read)}</small></h3><p>${esc(x.text)}</p></article></div><p class="pl-source">${esc(P.sourceNote)}</p>`)}

  const parts=[sOverview,sModel,sMix,sAnnual,sQuarter,sKessan,sHistory,sEco,sNews,sJapan,sJpeers,sLinks,sRivals,sRivals2,sCeo,sProduct,sVideos,sX,sRadar,sTerms];
  function root(){let el=document.getElementById('pltr');if(!el){el=document.createElement('div');el.id='pltr';el.hidden=true;const f=document.querySelector('.site-footer');f.parentNode.insertBefore(el,f)}return el}
  function bar(){let el=document.getElementById('pltr-bar');if(!el){el=document.createElement('nav');el.id='pltr-bar';el.setAttribute('aria-label','Palantirの目次');el.hidden=true;document.querySelector('header').after(el)}return el}
  function dots(){let el=document.getElementById('pltr-dots');if(!el){el=document.createElement('nav');el.id='pltr-dots';el.setAttribute('aria-label','画面の位置');el.hidden=true;document.body.appendChild(el)}return el}
  function renderBar(){const cs=catalog.companies;bar().innerHTML=`<div class="pl-co" role="group" aria-label="会社を選ぶ">${Object.keys(cs).map(k=>`<button onclick="setCompany('${k}')" aria-pressed="${k==='p'}" title="${esc(cs[k].name)}">${typeof companyLogo==='function'?companyLogo(k,'pl-co-logo'):''}<em class="pl-co-name">${esc(cs[k].name)}</em></button>`).join('')}</div><div class="pl-toc">${P.toc.map(t=>`<button data-toc="${t.id}" onclick="plGo('${t.id}')">${esc(t.label)}</button>`).join('')}</div>`}
  function render(){if(!P)return;root().innerHTML=parts.map(f=>f()).join('');renderBar();const ss=screens();dots().innerHTML=ss.map((s,i)=>`<button aria-label="${esc(s.querySelector('h1,h2')?.textContent||'')}" onclick="plTo(${i})"></button>`).join('');rendered=true;measure();track()}
  function rerender(id){const old=document.getElementById('s-'+id);if(!old)return;const fn={kessan:sKessan,history:sHistory,eco:sEco,ceo:sCeo,product:sProduct,terms:sTerms,videos:sVideos,x:sX}[id];const tmp=document.createElement('div');tmp.innerHTML=fn();old.replaceWith(tmp.firstElementChild)}
  const screens=()=>[...document.querySelectorAll('#pltr .pl-screen')];
  function measure(){const h=document.querySelector('body>header'),b=bar();if(!h)return;const hh=h.offsetHeight;document.documentElement.style.setProperty('--pl-hh',hh+'px');document.documentElement.style.setProperty('--pl-chrome',(hh+(b.hidden?0:b.offsetHeight))+'px')}
  function current(){const ss=screens(),top=parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--pl-chrome'))||0;let best=0,d=1e9;ss.forEach((s,i)=>{const x=Math.abs(s.getBoundingClientRect().top-top);if(x<d){d=x;best=i}});return best}
  function track(){if(!on)return;const i=current(),s=screens()[i];document.querySelectorAll('#pltr-dots button').forEach((b,j)=>b.setAttribute('aria-current',j===i?'true':'false'));const t=s?.dataset.toc;document.querySelectorAll('#pltr-bar [data-toc]').forEach(b=>b.setAttribute('aria-current',b.dataset.toc===t?'true':'false'))}
  window.plTo=function(i){const ss=screens();i=Math.max(0,Math.min(ss.length-1,i));ss[i]?.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'})};
  window.plGo=function(id){const i=screens().findIndex(s=>s.dataset.toc===id);if(i>=0)plTo(i)};
  window.plPick=function(k,j){const map={hist:'history',eco:'eco',quote:'ceo',box:'product',term:'terms',kq:'kessan'};st[k]=j;rerender(map[k]);const el=document.querySelector(`#s-${map[k]} [aria-selected=true], #s-${map[k]} .pl-box.is-on`);el?.focus({preventScroll:true})};
  window.plPage=function(k,d){st[k]=Math.max(0,st[k]+d);rerender(k==='vid'?'videos':'x');document.querySelector(`#s-${k==='vid'?'videos':'x'} .pl-pager button:not([disabled])`)?.focus({preventScroll:true})};
  function openDialog(html){returnFocus=document.activeElement;$('media-content').innerHTML=html;$('media-dialog').showModal()}
  window.plPlay=function(id){openDialog(`<iframe title="動画の再生" src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?rel=0" allow="encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>`)};
  window.plClip=function(v,t){openDialog(`<iframe title="動画の再生" src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(v)}?start=${Math.max(0,t|0)}&rel=0" allow="encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>`)};
  window.plPost=function(id){const p=(X.items||[]).find(x=>x.id===id);if(p)openDialog(`<article class="pl-xfull"><small>柏原迅のX投稿　${jdate(p.date)}</small>${p.text.split(/\n+/).map(t=>`<p>${esc(t)}</p>`).join('')}</article>`)};

  /* 他の5社のページ：エコシステムにサイト内の会社が出てくるとき、その会社のページへのボタンを1行だけ足す */
  function backlinks(){if(typeof company==='undefined'||company==='p'||typeof ecosystems==='undefined')return;const intro=document.querySelector('#profile .company-intro');if(!intro||intro.querySelector('.site-links'))return;
    const names=(ecosystems[company]?.nodes||[]).map(n=>n.name),ks=Object.keys(catalog.companies).filter(k=>k!==company&&names.some(n=>n.toLowerCase()===catalog.companies[k].name.toLowerCase()));if(!ks.length)return;
    const el=document.createElement('p');el.className='site-links';el.innerHTML='このサイトでつながる会社：'+ks.map(k=>`<button type="button" onclick="setCompany('${k}')">${esc(catalog.companies[k].name)}</button>`).join('');intro.appendChild(el)}
  function sync(){const want=typeof company!=='undefined'&&company==='p'&&typeof view!=='undefined'&&view!=='comparison'&&!!P;
    if(want&&typeof presenterState==='function'&&presenterState().presenting)togglePresenter();
    on=want;document.documentElement.classList.toggle('pltr-on',on);root().hidden=!on;bar().hidden=!on;dots().hidden=!on;
    if(on){if(!rendered)render();measure();track()}else backlinks()}
  document.addEventListener('keydown',e=>{if(!on||!desk()||document.querySelector('dialog[open]')||e.metaKey||e.ctrlKey||e.altKey)return;if(/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName))return;const k=e.key;let d=0;if(k==='ArrowDown'||k==='PageDown'||(k===' '&&!e.shiftKey))d=1;else if(k==='ArrowUp'||k==='PageUp'||(k===' '&&e.shiftKey))d=-1;else if(k==='Home'){e.preventDefault();plTo(0);return}else if(k==='End'){e.preventDefault();plTo(1e3);return}if(!d)return;e.preventDefault();plTo(current()+d)});
  let raf=0;addEventListener('scroll',()=>{if(!on||raf)return;raf=requestAnimationFrame(()=>{raf=0;track()})},{passive:true});
  let lastDesk=desk();addEventListener('resize',()=>{if(!on)return;measure();const d=desk();if(d!==lastDesk){lastDesk=d;render()}});
  if(typeof setView==='function'){const b=setView;window.setView=function(){const r=b.apply(this,arguments);sync();return r}}
  if(typeof setCompany==='function'){const b=setCompany;window.setCompany=function(){const r=b.apply(this,arguments);sync();if(on&&arguments.length&&rendered)scrollTo(0,0);return r}}
  Promise.all([fetch('pltr.json').then(r=>r.json()),fetch('pltr-x.json').then(r=>r.ok?r.json():{items:[]}).catch(()=>({items:[]})),fetch('pltr-radar.json').then(r=>r.ok?r.json():{items:[]}).catch(()=>({items:[]}))]).then(([p,x,r])=>{P=p;X=x;R=r;const wait=()=>{if(typeof catalog!=='undefined'&&catalog&&typeof videos!=='undefined'&&videos)sync();else setTimeout(wait,50)};wait()}).catch(e=>console.warn('pltr.json を読めませんでした',e));
})();
