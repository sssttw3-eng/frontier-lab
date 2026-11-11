/* presenter.js : 講師モード。画面いっぱいの1枚（#stage）に、見出しと図だけを出して送る。
   送る順：柏原の見立て → 論点1〜3 → お金の流れ → エコシステム → 成長 → CEO → 基礎の辞書8テーマ。
   キー：→ ← Space Enter PageDown PageUp（市販リモコン）、数字でジャンプ、Home/End、Escで終了。
   URL：?company=p&view=…&step=… に今の枚目を書き、そのURLを開くと同じ枚目から始まる。会社を切り替えたら01枚目へ戻る。 */
(function(){
  const BASE=28;
  let slides=[],stage=null,tabChosen=false,digitBuf='',digitTimer=null,booted=false;
  readingSize=BASE;
  const esc=s=>escapeHTML(s),pad=n=>String(n).padStart(2,'0');
  const isFace=v=>/ceo|karp|portrait|顔/i.test((v.src||'')+' '+(v.alt||'')+' '+(v.caption||''));
  function visualOnly(v){
    if(!v)return '';
    if(v.type==='image')return `<img class="stage-img${isFace(v)?' is-face':''}" src="${v.src}" alt="${esc(v.alt)}">`;
    return `<div class="stage-html">${sheetVisual(v)}</div>`;
  }
  function cloneSvg(sel){
    const el=document.querySelector(sel);if(!el)return '';
    let h=el.outerHTML;
    [...new Set([...h.matchAll(/id="([^"]+)"/g)].map(m=>m[1]))].forEach(id=>{h=h.split(`id="${id}"`).join(`id="${id}-stage"`).split(`url(#${id})`).join(`url(#${id}-stage)`).split(`href="#${id}"`).join(`href="#${id}-stage"`)});
    return `<div class="stage-svg">${h.replace(/ tabindex="0"/g,'').replace(/ onclick="[^"]*"/g,'').replace(/ onkeydown="[^"]*"/g,'')}</div>`;
  }
  function visionHtml(){
    const v=companyVisions[company],r=research[company];if(!v)return '';
    return `<div class="stage-html stage-vision"><p class="stage-who">${r.ceoImage?`<img src="${r.ceoImage}" alt="">`:''}<b>${esc(r.ceo)}</b></p><div class="stage-steps">${v.steps.map((s,i)=>`<div>${lessonIcon(['search','tools','check'][i])}<small>${pad(i+1)}</small><b>${s}</b></div>`).join('')}</div></div>`;
  }
  function dictTitle(i){return combined?.[company]?.[i]?.sheet?.title||(typeof simpleLessons!=='undefined'&&simpleLessons[company]?.[i]?.[0])||catalog.labels[i]}
  function dictVisual(i){
    const sh=combined?.[company]?.[i]?.sheet;
    if(sh)return visualOnly(sh.visual);
    if(i===3&&typeof profitDiagramHtml==='function')return `<div class="stage-html stage-profit">${profitDiagramHtml()}</div>`;
    if(typeof simpleLessons!=='undefined'&&simpleLessons[company]?.[i])return `<div class="stage-html stage-lesson">${visualLesson(i)}</div>`;
    return '';
  }
  function buildSlides(){
    const out=[],d=catalog.companies[company],A=window.anglesData?.companies?.[company];
    if(A){
      out.push({view:'money',anchor:'#angles-band',label:'柏原の見立て',kicker:`${d.name}`,title:'柏原の見立て',html:()=>`<div class="stage-html stage-story"><p class="stage-view">${esc(A.view)}</p>${A.story.map(s=>`<p>${esc(s)}</p>`).join('')}</div>`});
      A.cards.forEach((c,i)=>out.push({view:'money',anchor:`#angles-band [data-sheet="angle-${i+1}"]`,label:`論点${i+1}`,kicker:`論点${i+1}`,title:c.title,html:()=>visualOnly(c.visual)}));
    }
    out.push({view:'money',label:'お金の流れ',kicker:'お金の流れ',title:`${d.name}のお金の流れ`,svgText:1.15,html:()=>cloneSvg('#view-money .money-canvas svg')});
    out.push({view:'relations',label:'エコシステム',kicker:'エコシステム',title:`${d.name}のエコシステム`,html:()=>cloneSvg('#view-relations .ecosystem-canvas svg')});
    out.push({view:'growth',label:'成長の変遷',kicker:'成長の変遷',title:`${d.name}の売上の推移（百万ドル）`,html:()=>cloneSvg('#view-growth .growth-line svg')});
    if(typeof companyVisions!=='undefined'&&companyVisions[company])out.push({view:'vision',label:'CEO',kicker:'CEOと会社の考え方',title:companyVisions[company].title,html:visionHtml});
    catalog.labels.forEach((l,i)=>out.push({view:'map',topic:i,label:`基礎の辞書 ${l}`,kicker:`基礎の辞書 ${i+1}/8　${l}`,title:dictTitle(i),html:()=>dictVisual(i)}));
    return out;
  }
  function ensureStage(){
    if(stage)return stage;
    stage=document.createElement('div');stage.id='stage';stage.hidden=true;stage.tabIndex=-1;
    stage.setAttribute('role','dialog');stage.setAttribute('aria-label','講師モード');
    stage.innerHTML=`<div class="stage-head"><p class="stage-kicker"></p><h2 class="stage-title"></h2></div><div class="stage-visual"></div>
<div class="stage-bar"><p class="stage-pos" aria-live="polite"><b class="stage-count"></b><span class="stage-label"></span><span class="stage-next"></span></p>
<div class="stage-buttons"><button type="button" data-act="prev">前へ</button><button type="button" data-act="next">次へ</button><button type="button" data-act="smaller" aria-label="文字を小さく">文字 −</button><button type="button" data-act="bigger" aria-label="文字を大きく">文字 ＋</button><button type="button" data-act="full">全画面</button><button type="button" data-act="exit">終了</button></div></div>`;
    stage.addEventListener('click',e=>{const a=e.target.closest('[data-act]')?.dataset.act;if(!a)return;({prev:()=>step(-1),next:()=>step(1),smaller:()=>changeReadingSize(-1),bigger:()=>changeReadingSize(1),full:()=>toggleFullscreen(),exit:()=>stop()})[a]()});
    document.body.appendChild(stage);
    return stage;
  }
  function fit(){
    if(!stage||stage.hidden)return;
    const box=stage.querySelector('.stage-visual'),inner=box.querySelector('.stage-fit');if(!inner)return;
    const W=box.clientWidth,H=box.clientHeight,k=readingSize/BASE*(slides[presentIndex]?.svgText||1);
    inner.style.transform='';inner.style.top='0px';inner.style.height='';
    if(inner.querySelector(':scope>img.stage-img')||inner.querySelector(':scope>.stage-svg')){
      inner.style.width=W+'px';inner.style.height=H+'px';
      inner.querySelectorAll('.stage-svg text').forEach(t=>{if(!t.dataset.fs){t.style.fontSize='';t.dataset.fs=parseFloat(getComputedStyle(t).fontSize)||14}t.style.fontSize=(t.dataset.fs*k)+'px'});
      return;
    }
    const want=1.7*k;let s=want;
    for(let it=0;it<5;it++){inner.style.width=(W/s)+'px';const h=inner.scrollHeight||1;const ns=Math.min(want,H/h);if(Math.abs(ns-s)<.005){s=ns;break}s=ns}
    inner.style.width=(W/s)+'px';
    const h=inner.scrollHeight;
    if(h*s>H)s=H/h;
    inner.style.transform=`scale(${s})`;
    inner.style.left=Math.max(0,(W-(W/s)*s)/2)+'px';
    inner.style.top=Math.max(0,(H-h*s)/2)+'px';
  }
  function show(i){
    if(!slides.length)slides=buildSlides();
    presentIndex=Math.max(0,Math.min(slides.length-1,i));
    const s=slides[presentIndex];
    if(view!==s.view)setView(s.view);
    if(s.topic!=null){openTopics=new Set([s.topic]);renderTree()}
    ensureStage();
    stage.querySelector('.stage-kicker').textContent=s.kicker;
    stage.querySelector('.stage-title').textContent=s.title||'';
    const box=stage.querySelector('.stage-visual');
    box.innerHTML=`<div class="stage-fit">${s.html()}</div>`;
    stage.querySelector('.stage-count').textContent=`${pad(presentIndex+1)} / ${pad(slides.length)}`;
    stage.querySelector('.stage-label').textContent=s.label;
    stage.querySelector('.stage-next').textContent=slides[presentIndex+1]?`次は ${slides[presentIndex+1].label}`:'最後の1枚';
    stage.dataset.slide=s.anchor?'band':s.view;
    box.querySelectorAll('img').forEach(im=>{if(!im.complete)im.addEventListener('load',fit,{once:true})});
    fit();requestAnimationFrame(fit);
    syncURL();
  }
  function step(d){show(presentIndex+d)}
  function startIndex(){
    if(!tabChosen)return 0;
    const j=slides.findIndex(s=>!s.anchor&&s.view===view);
    return j<0?0:j;
  }
  function start(i){
    presenting=true;document.body.classList.add('presenting');
    slides=buildSlides();ensureStage();stage.hidden=false;
    document.documentElement.style.setProperty('--rs',readingSize+'px');
    show(i==null?startIndex():i);stage.focus({preventScroll:true});
  }
  function stop(){
    if(!presenting)return;
    presenting=false;document.body.classList.remove('presenting');
    const s=slides[presentIndex];if(stage)stage.hidden=true;
    if(document.fullscreenElement)document.exitFullscreen?.();
    syncURL();
    const el=s&&(s.anchor?document.querySelector(s.anchor):document.querySelector('.view-tabs'));
    if(el){const d=el.closest('details');if(d&&d!==el)d.open=true;el.scrollIntoView({block:'start'})}
  }
  function syncURL(){
    try{const p=new URLSearchParams(location.search);p.set('company',company);p.set('view',view);if(presenting)p.set('step',presentIndex+1);else p.delete('step');history.replaceState(null,'','?'+p.toString())}catch{}
  }
  window.syncURL=syncURL;
  window.togglePresenter=function(){presenting?stop():start()};
  window.focusPresentation=i=>show(i);
  window.presentStep=d=>step(d);
  window.changeReadingSize=function(d){readingSize=Math.max(20,Math.min(44,readingSize+d*2));document.documentElement.style.setProperty('--rs',readingSize+'px');fit()};
  window.presenterState=()=>({presenting,index:presentIndex,total:slides.length,view,company,readingSize,labels:slides.map(s=>s.label)});
  addEventListener('resize',fit);document.addEventListener('fullscreenchange',()=>setTimeout(fit,50));
  document.addEventListener('click',e=>{if(e.target.closest('.view-tabs [data-view]'))tabChosen=true});
  document.addEventListener('keydown',e=>{
    if(!presenting||document.querySelector('dialog[open]')||e.metaKey||e.ctrlKey||e.altKey)return;
    const k=e.key;
    if(k==='ArrowRight'||k==='ArrowDown'||k==='PageDown'||k==='Enter'||(k===' '&&!e.shiftKey)){e.preventDefault();step(1)}
    else if(k==='ArrowLeft'||k==='ArrowUp'||k==='PageUp'||(k===' '&&e.shiftKey)){e.preventDefault();step(-1)}
    else if(k==='Home'){e.preventDefault();show(0)}
    else if(k==='End'){e.preventDefault();show(slides.length-1)}
    else if(k==='Escape'){e.preventDefault();stop()}
    else if(/^[0-9]$/.test(k)){
      e.preventDefault();digitBuf+=k;clearTimeout(digitTimer);
      const n=+digitBuf,go=()=>{const m=+digitBuf;digitBuf='';if(m>=1)show(m-1)};
      if(digitBuf.length>=2||n*10>slides.length)go();else digitTimer=setTimeout(go,700);
    }
  },true);
  /* 画面切り替えのたびに URL を合わせる */
  const baseView=window.setView;
  window.setView=function(v){const r=baseView.apply(this,arguments);syncURL();return r};
  /* 会社を切り替えたら 01枚目から。会社を開いた直後は帯と最初のタブ（お金の流れ） */
  const baseCompany=window.setCompany;
  window.setCompany=function(k){
    const changed=booted&&k!==company,firstStep=booted?0:+new URLSearchParams(location.search).get('step');
    if(changed){presentIndex=0;tabChosen=false;if(!presenting&&view!=='comparison')view='money'}
    const was=presenting;presenting=false;
    const r=baseCompany.apply(this,arguments);
    presenting=was;slides=[];
    const d=catalog.companies[company];
    document.title=`${d.name}｜柏原迅の企業理解アトラス`;
    if(presenting)show(changed?0:presentIndex);
    syncURL();
    if(!booted){booted=true;if(firstStep>0)(window.anglesReady||Promise.resolve()).finally(()=>start(firstStep-1))}
    return r;
  };
})();
