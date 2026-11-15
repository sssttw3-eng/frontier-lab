// flow.js：ミューズが作る申込ページ・確認ページ・完了ページに付ける「動きだけ」の部品（見た目は持たない）
// 置き方：<script src="/frontier-lab/join/config.js"></script><script src="/frontier-lab/join/flow.js" defer></script>
//
// [入力ページ] <form data-fl-apply> の中に name="nickname" / name="email" / name="email2" / name="source"
//              送信すると確認ページ（data-fl-next の値、既定 confirm.html）へ。入力は sessionStorage に一時保存
// [確認ページ] [data-fl-show="nickname|email"] に入力内容を差し込む。
//              同意チェック input[data-fl-agree] が全部ONで button[data-fl-pay] が押せる → Stripeへ
//              エラーは [data-fl-error] に出る
// [完了ページ] [data-fl-invite] に「Discordに参加する」ボタンと期限を出す。[data-fl-hello] にニックネーム入りの一文
//              a[data-fl-portal] は解約・カード変更ページ（Stripe）へ。この端末を会員として記憶する
(function () {
  var C = window.FL_JOIN || {}, api = (C.WORKER_URL || '').replace(/\/$/, '');
  var q = new URLSearchParams(location.search);
  function get() { try { return JSON.parse(sessionStorage.getItem('fl_apply') || '{}'); } catch (e) { return {}; } }
  function $(s) { return document.querySelector(s); }
  function err(m) { var e = $('[data-fl-error]'); if (e) e.textContent = m; }

  // 入力
  var f = $('form[data-fl-apply]');
  if (f) {
    var s = get(), ref = q.get('src') || s.ref || '';
    ['nickname', 'email', 'source'].forEach(function (k) { if (s[k] && f[k]) f[k].value = s[k]; });
    if (s.email && f.email2) f.email2.value = s.email;
    if (ref && f.source && !f.source.value) f.source.value = ref;
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var n = f.nickname.value.trim(), m = f.email.value.trim();
      if (!n) return err('ニックネームを入力してください。');
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(m)) return err('メールアドレスの形をご確認ください。');
      if (f.email2 && f.email2.value.trim() !== m) return err('確認用のメールアドレスが一致しません。');
      sessionStorage.setItem('fl_apply', JSON.stringify({ nickname: n, email: m, source: f.source ? f.source.value : '', ref: ref }));
      location.href = f.getAttribute('data-fl-next') || 'confirm.html';
    });
  }

  // 確認
  var pay = $('button[data-fl-pay]');
  if (pay) {
    var a = get();
    if (!a.email) { location.replace(pay.getAttribute('data-fl-back') || 'apply.html'); return; }
    document.querySelectorAll('[data-fl-show]').forEach(function (el) { el.textContent = a[el.getAttribute('data-fl-show')] || ''; });
    var boxes = document.querySelectorAll('input[data-fl-agree]');
    var upd = function () { pay.disabled = [].some.call(boxes, function (b) { return !b.checked; }); };
    [].forEach.call(boxes, function (b) { b.addEventListener('change', upd); }); upd();
    if (q.get('canceled')) err('決済は完了していません。内容を確かめて、もう一度お進みください。');
    pay.addEventListener('click', function () {
      if (!api) { location.href = (pay.getAttribute('data-fl-thanks') || 'thanks.html') + '?demo=1'; return; }
      var label = pay.textContent; pay.disabled = true; pay.textContent = '決済画面を準備しています';
      fetch(api + '/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickname: a.nickname, email: a.email, source: a.source || a.ref || '', agreed: true }) })
        .then(function (r) { return r.json(); })
        .then(function (d) { if (!d.url) throw 0; location.href = d.url; })
        .catch(function () { err('決済画面を開けませんでした。少し時間をおいて、もう一度お試しください。'); pay.textContent = label; upd(); });
    });
  }

  // 完了
  var box = $('[data-fl-invite]');
  if (box) {
    var sid = q.get('session_id');
    var show = function (d) {
      var h = $('[data-fl-hello]'); if (h && d.nickname) h.textContent = d.nickname + 'さん、フロンティアラボへようこそ。';
      if (d.member_token) { try { localStorage.setItem('fl_member', d.member_token); } catch (e) {} }
      box.textContent = '';
      var b = document.createElement('a'); b.href = d.invite_url; b.target = '_blank'; b.rel = 'noopener'; b.className = box.getAttribute('data-fl-btn-class') || '';
      b.textContent = 'Discordに参加する';
      var n = document.createElement('p'); n.textContent = '1回だけ使えるリンクです。有効期限：' + new Date(d.expires_at).toLocaleString('ja-JP') + 'まで';
      box.append(b, n);
    };
    if (q.get('demo')) show({ invite_url: 'https://discord.gg/demo', expires_at: Date.now() + 7 * 864e5, nickname: get().nickname || 'テスト', member_token: 'demo' });
    else if (sid && api) {
      var tries = 0;
      (function poll() {
        fetch(api + '/invite?session_id=' + encodeURIComponent(sid)).then(function (r) { return r.json(); }).then(function (d) {
          if (d.invite_url) show(d);
          else if (++tries < 15) setTimeout(poll, 2000);
          else box.textContent = '招待リンクの発行に時間がかかっています。数分後にこのページを再読み込みしてください。';
        }).catch(function () { if (++tries < 15) setTimeout(poll, 2000); });
      })();
    } else box.textContent = '申込みの情報が見つかりませんでした。決済が終わっている場合、frontierlab.jp@gmail.com までご連絡ください。';
    sessionStorage.removeItem('fl_apply');
  }
  document.querySelectorAll('a[data-fl-portal]').forEach(function (p) {
    p.addEventListener('click', function (e) {
      e.preventDefault(); if (!api) return;
      var tok = ''; try { tok = localStorage.getItem('fl_member') || ''; } catch (x) {}
      var qs = q.get('session_id') ? 'session_id=' + encodeURIComponent(q.get('session_id')) : 'token=' + encodeURIComponent(tok);
      fetch(api + '/portal?' + qs).then(function (r) { return r.json(); }).then(function (d) { if (d.url) location.href = d.url; });
    });
  });
})();
