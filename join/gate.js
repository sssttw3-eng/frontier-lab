// gate.js：会員以外には最初の画面だけ見せ、下はぼかして参加ボタンを出す
//   ・Workerの後ろでは <html data-fl-state="guest|free|member"> をWorkerが付ける（こちらが本番の守り）
//   ・GitHub Pagesだけのとき、この中で判定する（見た目のロック。12〜1月の無料期間用）
//   ・記事ページは <meta name="fl-article" content="pltr"> を付ける。ゲストが最初に開いた1本だけ全文で読める
// 使い方：各ページの <head> に
//   <script src="/frontier-lab/join/config.js"></script><link rel="stylesheet" href="/frontier-lab/join/gate.css"><script src="/frontier-lab/join/gate.js" defer></script>
(function () {
  var C = window.FL_JOIN || {}, root = document.documentElement;
  function ls(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }

  function decide(cb) {
    var s = root.getAttribute('data-fl-state');
    if (s) return cb(s);
    var tok = ls('fl_member');
    if (tok && C.WORKER_URL) {
      fetch(C.WORKER_URL.replace(/\/$/, '') + '/me?token=' + encodeURIComponent(tok)).then(function (r) { return r.json(); })
        .then(function (d) { cb(d.member ? 'member' : guestOrFree()); }).catch(function () { cb('member'); });
      return;
    }
    cb(tok ? 'member' : guestOrFree());
  }
  function guestOrFree() {
    var m = document.querySelector('meta[name="fl-article"]');
    if (!m) return 'guest';
    var id = m.getAttribute('content'), first = ls('fl_free_article');
    if (!first) { ls('fl_free_article', id); return 'free'; }
    return first === id ? 'free' : 'guest';
  }

  function cta(title, body) {
    var c = document.createElement('div'); c.className = 'fl-card';
    var h = document.createElement('h2'); h.textContent = title;
    var p = document.createElement('p'); p.textContent = body;
    var a = document.createElement('a'); a.className = 'fl-btn'; a.href = C.JOIN_URL || '#'; a.textContent = 'フロンティアラボに参加する';
    var s = document.createElement('span'); s.className = 'fl-sub';
    s.textContent = (C.FREE_NOTE && (!C.FREE_DEADLINE || Date.now() < Date.parse(C.FREE_DEADLINE))) ? C.FREE_NOTE : '';
    c.append(h, p, a, s); return c;
  }

  function lockPage() {
    root.classList.add('fl-guest');
    var v = document.createElement('div'); v.className = 'fl-veil';
    var fv = Math.round(window.innerHeight * 0.92);            // ここまでが「最初の画面」
    document.body.style.setProperty('height', (fv + 520) + 'px', 'important');
    document.body.style.setProperty('max-height', (fv + 520) + 'px', 'important');
    v.style.top = fv + 'px'; v.style.bottom = '0';
    v.appendChild(cta('この先は会員の方だけが読めます', '最初の画面までは誰でも見られます。続きの数字・取引先・CEOの発言と、柏原の講座動画は会員向けです。'));
    document.body.appendChild(v);
  }

  function lockLinks() {
    document.querySelectorAll(C.LOCK_LINKS || '[data-fl-lock]').forEach(function (el) {
      if (el.closest('.fl-card') || el.hasAttribute('data-fl-done')) return;
      el.setAttribute('data-fl-done', '');
      el.setAttribute('href', C.JOIN_URL || '#');
      el.removeAttribute('target');
      var img = el.querySelector('img');
      if (img) {
        img.classList.add('fl-locked');
        el.style.position = 'relative'; if (getComputedStyle(el).display === 'inline') el.style.display = 'inline-block';
        var b = document.createElement('span'); b.className = 'fl-badge'; b.textContent = '会員限定の動画'; el.appendChild(b);
      }
      el.setAttribute('aria-label', '会員限定。参加ページへ移動します');
    });
  }

  function freeNote() {
    var n = document.createElement('div'); n.className = 'fl-free-note';
    n.textContent = 'この記事は会員でなくても最後まで読めます（1本だけ）';
    var a = document.createElement('a'); a.href = C.JOIN_URL || '#'; a.textContent = '参加する'; n.appendChild(a);
    document.body.appendChild(n);
  }

  function apply(state) {
    root.setAttribute('data-fl-state', state);
    if (state === 'member') return;
    lockLinks();
    new MutationObserver(lockLinks).observe(document.body, { childList: true, subtree: true });
    if (state === 'free') freeNote(); else lockPage();
  }
  function start() { decide(apply); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
