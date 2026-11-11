/* angles.js : 会社ページ最上部の帯（見立て＋いまの論点3つ）。データは angles.json。
   論点1つ＝1枚：上にビジュアル（sheetVisual：atlas.js）、下に見出し・言い切り・根拠の数字・発言・決算資料の場所・出典と時点。
   講師モード（body.presenting）ではビジュアルと見出しだけを残す（atlas.css）。既存の setCompany を包むだけで、既存処理は変えない。 */
(function(){
  let angles=null;
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const tabLabel=v=>{const b=document.querySelector(`.view-tabs [data-view="${v}"]`);return b?b.textContent.replace(/^\d+\s*/,'').trim():v};
  const sources=list=>(list||[]).map(s=>`<a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.label)} ↗</a>`).join('、');
  function band(){
    let el=document.getElementById('angles-band');
    if(!el){
      const tabs=document.querySelector('.view-tabs');
      if(!tabs)return null;
      el=document.createElement('section');
      el.id='angles-band';el.className='angles-band';el.setAttribute('aria-labelledby','angles-title');
      tabs.before(el);
    }
    return el;
  }
  function quote(q){
    if(!q)return '';
    return `<blockquote class="angles-quote"><p>「${esc(q.text)}」</p><cite>${esc(q.who)}・${esc(q.where)}・${esc(q.date)}${q.note?`（${esc(q.note)}）`:''}</cite><small lang="en">${esc(q.original)}</small></blockquote>`;
  }
  function card(c,i){
    const visual=typeof sheetVisual==='function'?sheetVisual(c.visual):'';
    return `<article class="angles-card sheet${i===0?' is-lead':''}" data-sheet="angle-${i+1}">${visual}
<h3 class="sheet-title"><span>論点${i+1}</span>${esc(c.title)}</h3>
<div class="sheet-text"><p class="angles-lead">${esc(c.lead)}</p><p class="angles-basis">${esc(c.text)}</p>${quote(c.quote)}
<p class="angles-check"><span class="check-tag">次の決算で見るところ</span>${esc(c.check)}</p>
<p class="sheet-source">出典：${sources(c.source)}　時点：${esc(c.asOf)}</p>
<div class="angles-links">${(c.links||[]).map(v=>`<button type="button" onclick="anglesGo('${esc(v)}')">${esc(tabLabel(v))}</button>`).join('')}</div></div></article>`;
  }
  function render(){
    const el=band();if(!el||!angles)return;
    const k=typeof company!=='undefined'?company:'p',d=angles.companies[k],m=angles.meta;
    if(!d){el.className='angles-band is-pending';el.innerHTML=`<p class="angles-pending">${esc(m.pending)}</p>`;return}
    el.className='angles-band';
    el.innerHTML=`<div class="angles-head"><h2 id="angles-title">柏原の見立て</h2><div class="angles-meta"><small>${esc(m.asOf)}</small></div></div>
<p class="angles-view"><span>${esc(d.view)}</span></p>
<div class="angles-story">${d.story.map(x=>`<p>${esc(x)}</p>`).join('')}</div>
<div class="angles-cards">${d.cards.map(card).join('')}</div>
<p class="angles-note">${esc(m.note)}</p>`;
  }
  window.anglesGo=function(v){
    if(typeof setView==='function')setView(v);
    const t=document.querySelector('.view-tabs');
    if(t)t.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});
  };
  if(typeof setCompany==='function'){
    const base=setCompany;
    window.setCompany=function(k){const r=base.apply(this,arguments);render();return r};
  }
  window.anglesReady=fetch('angles.json').then(r=>{if(!r.ok)throw new Error(r.status);return r.json()}).then(j=>{angles=j;window.anglesData=j;render()}).catch(e=>console.warn('angles.json を読めませんでした',e));
})();
