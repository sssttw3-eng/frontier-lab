/* v2-ui.js : v2 の共通部品。atlas.js などの描画関数から呼ばれる。 */
const YEN_PER_USD=154;
/* 百万ドル → 円の参考換算（1ドル=154円） */
function yenM(m){const y=m*1e6*YEN_PER_USD;if(y>=1e12)return '約'+(y/1e12).toLocaleString('ja-JP',{maximumFractionDigits:1})+'兆円';if(y>=1e8)return '約'+Math.round(y/1e8).toLocaleString('ja-JP')+'億円';return '約'+Math.round(y/1e4).toLocaleString('ja-JP')+'万円'}
/* 6社そろう最新の会計年度 */
function growthLatest(){try{return Math.min(...Object.values(growth.companies).map(g=>Math.max(...g.revenue.map(r=>+r.year))))}catch{return 2024}}
/* お金の流れ：使っている色だけの凡例 */
const MONEY_KEYS=[['income','#098b9b','会社への対価'],['cost','#b66d29','会社が払う費用'],['principal','#6384a6','預金・元本など'],['mixed','#6d62b9','元本＋利息'],['other','#526e7c','他社間の支払い']];
function moneyLegend(m){const used=new Set(m.edges.map(e=>e[3]));return `<div class="money-legend">${MONEY_KEYS.filter(k=>used.has(k[0])).map(k=>`<span style="--key:${k[1]}">${k[2]}</span>`).join('')}</div>`}
/* お金の流れ：スマホでは縦に並べる */
function moneyListHtml(m){const col=Object.fromEntries(MONEY_KEYS.map(k=>[k[0],k[1]]));return `<ol class="money-vlist">${m.edges.map((e,i)=>`<li><button type="button" data-flow="${i}" style="--key:${col[e[3]]}" onclick="selectMoneyFlow(${i})"><span class="num">${i+1}</span><b>${escapeHTML(m.nodes[e[0]][0])}</b><span class="via">↓ ${escapeHTML(e[2])}</span><b>${escapeHTML(m.nodes[e[1]][0])}</b></button></li>`).join('')}</ol>`}
/* エコシステム：スマホでは縦に並べる */
function ecoListHtml(d,nodes){return `<ol class="eco-vlist"><li class="eco-vcenter">${companyLogo(company,'chart-logo')}<b>${escapeHTML(d.name)}</b></li>${nodes.map((n,i)=>`<li><button type="button" data-eco-pick="${i}" onclick="selectEcosystem(${i})"><span class="pill">${escapeHTML(n.type)}</span>${n.logo?`<span class="eco-vlogo" style="background:${n.logoBackground||'#fff'}"><img src="${n.logo}" alt=""></span>`:''}<b>${escapeHTML(n.name)}</b></button></li>`).join('')}</ol>`}
/* 成長：スマホ用の棒（年度・百万ドル・円換算） */
function growthBarsHtml(rows,g){const max=Math.max(...rows.map(r=>r.value));return `<ol class="growth-bars" aria-label="${escapeHTML(g.name)}の売上の推移">${rows.map(r=>`<li><span class="gb-year">FY${r.year}</span><span class="gb-track"><i style="width:${Math.max(2,r.value/max*100).toFixed(1)}%"></i></span><span class="gb-val">${r.value.toLocaleString('en-US',{maximumFractionDigits:1})}<small>${yenM(r.value)}</small></span></li>`).join('')}</ol>`}
/* 動画：最初は8本、押すと8本ずつ */
let videoLimit=8;
function moreVideos(total){const grid=$('video-grid');if(!grid)return;grid.parentElement.querySelector('.video-more')?.remove();if(total>videoLimit)grid.insertAdjacentHTML('afterend',`<button type="button" class="video-more" onclick="videoLimit+=8;filterVideos(videoFilter,true)">もっと見る（残り${total-videoLimit}本）</button>`)}
