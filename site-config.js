/* site-config.js : サイト全体の設定。会員DiscordのURLは下の discordUrl に入れる（空のあいだはリンクを出さない）。 */
window.SITE={
  discordUrl:''
};
document.addEventListener('DOMContentLoaded',function(){
  var u=(window.SITE&&window.SITE.discordUrl||'').trim();
  if(!/^https:\/\//.test(u))return;
  function link(){var a=document.createElement('a');a.href=u;a.target='_blank';a.rel='noopener';a.className='discord-link';a.textContent='会員Discord ↗';return a}
  var ipo=document.querySelector('.site-nav a[href="ipo.html"]');
  if(ipo)ipo.after(link());
  var meta=document.querySelector('.site-footer .footer-meta');
  if(meta)meta.appendChild(link());
});
