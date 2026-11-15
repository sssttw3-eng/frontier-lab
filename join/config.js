// 入会導線とゲートの設定。数字・日付・行き先はここだけで直す
window.FL_JOIN = {
  WORKER_URL: '',                       // worker/ をデプロイしたら https://frontier-lab-join.xxxx.workers.dev
  JOIN_URL: '/frontier-lab/mock-design/join.html',   // ゲートの「参加する」ボタンの行き先
  PAYMENT_LINK: '',                     // 2月以降用のStripe決済リンク（stripe_setup_test.sh が出す）
  FREE_DEADLINE: '2027-01-31T23:59:59+09:00',   // これを過ぎるとゲートの「無料です」の文が消える
  CONTACT_CONFIRMED: false,      // frontierlab.jp@gmail.com の受信を柏原が確かめたら true
  PORTAL_LOGIN_CONFIRMED: false, // Stripe契約管理のログインリンクを有効にしたら true
  FREE_NOTE: '1月31日までに入会すると、2月1日まで無料です',
  PRICE_YEN: 2980, FREE_UNTIL: '2027年1月31日', FIRST_BILL: '2027年2月1日',
  NEXT_PRICE_YEN: 5000, NEXT_PRICE_FROM: '2027年4月以降',
  // 動画など、会員以外にはロック表示にするリンク
  LOCK_LINKS: 'a[href*="youtube.com/watch"],a[href*="youtu.be/"],[data-fl-lock]'
};
