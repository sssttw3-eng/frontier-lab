"""Palantirページの差し替えデータを作る。
  python3 tools/pltr_refresh.py        → pltr-radar.json（外れ値リサーチ）と pltr-x.json（柏原のX投稿）を作り直す
入力：事業戦略/competitor_radar_latest.json ほか _radar_*.json、09_SNS_ツイート/x_auto/state/real_posts*.jsonl
"""
import json,re,os,glob,datetime
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BIZ=os.path.expanduser('~/Desktop/事業戦略')
PAT=re.compile(r'palantir|パランティア|(?<![A-Za-z])PLTR(?![A-Za-z])|팔란티어|Alex Karp|カープ',re.I)
def items(o):
    if isinstance(o,dict):
        if 'id' in o and 'title' in o and 'views' in o: yield o
        for v in o.values(): yield from items(v)
    elif isinstance(o,list):
        for v in o: yield from items(v)
def norm_date(s,year):
    s=str(s or '')
    m=re.match(r'(\d{4})-(\d{2})-(\d{2})',s)
    if m: return m.group(0)
    m=re.match(r'(\d{1,2})/(\d{1,2})',s)
    if m: return f'{year}-{int(m.group(1)):02d}-{int(m.group(2)):02d}'
    return ''
def radar():
    best={}
    files=['competitor_radar_latest.json','_radar_3d.json','_radar_48h.json','_radar_24h.json','_radar_wide_latest.json']
    for f in files:
        p=os.path.join(BIZ,f)
        if not os.path.exists(p): continue
        d=json.load(open(p))
        asof=(d.get('date') if isinstance(d,dict) else '') or datetime.date.fromtimestamp(os.path.getmtime(p)).isoformat()
        year=asof[:4]
        for it in items(d):
            if not (PAT.search(it.get('title','')) or it.get('topic')=='Palantir'): continue
            r=it.get('ratio')
            if r is None: continue
            if it.get('sec') and it['sec']<180: continue
            row={'id':it['id'],'title':it['title'],'channel':it.get('channel',''),'views':it.get('views'),
                 'ratio':r,'median':it.get('median'),'date':norm_date(it.get('published'),year),'checked':asof}
            k=it['id']
            if k not in best or row['checked']>best[k]['checked']: best[k]=row
    rows=sorted(best.values(),key=lambda x:(-x['ratio']))
    out={'updated':datetime.date.today().isoformat(),'threshold':1.2,
         'note':'各チャンネルの直近動画の再生数の中央値を1倍として、何倍見られているかを示す。',
         'items':rows[:12]}
    out['week']=week()
    json.dump(out,open(os.path.join(ROOT,'pltr-radar.json'),'w'),ensure_ascii=False,indent=1)
    print('radar',len(rows),'week',out['week'])
def jd(s):
    y,m,d=map(int,s.split('-'));return f'{m}月{d}日'
def week():
    """今週の変化3行：外れ値リサーチの最新ファイル（competitor_radar_latest.json）だけから作る"""
    p=os.path.join(BIZ,'competitor_radar_latest.json')
    if not os.path.exists(p): return None
    d=json.load(open(p));asof=d.get('date');days=int(d.get('days') or 3)
    start=(datetime.date.fromisoformat(asof)-datetime.timedelta(days=days)).isoformat()
    chans=d.get('per_channel',[]);vids={}
    for c in chans:
        for v in c.get('recent',[]):
            if str(v.get('published',''))[:10]>=start and PAT.search(v.get('title','')): vids[v['id']]=v
    vs=sorted(vids.values(),key=lambda v:-(v.get('ratio') or 0))
    tags=[t for t in d.get('topic_ranking',[]) if not t['tag'].startswith('(')][:2]
    period=f"{jd(start)}〜{jd(asof)}"
    l1=f"{period}に新しく出た動画のうち、Palantirを題名に入れた動画は{len(vs)}本でした（調べたのは{len(chans)}チャンネル）。"
    if vs:
        v=vs[0];r=v.get('ratio') or 0
        lvl='ほぼ同じ水準' if r<1.2 else ('上回る水準' if r<2 else '2倍を超える水準')
        head='その1本は' if len(vs)==1 else 'いちばん見られたのは'
        l2=f"{head}{v.get('channel','')}の動画で、再生は{int(v.get('views') or 0):,}回。同チャンネルの普段の再生数の{r:.2f}倍で、{lvl}でした。"
    else:
        l2='Palantirを題名に入れた動画はありませんでした。'
    l3='同じ期間は'+'、'.join(f"{t['tag'].replace('/','・')}を{t['distinct_channels']}チャンネル" for t in tags)+'が取り上げました。'
    return {'asof':asof,'period':period,'lines':[l1,l2,l3],'count':len(vs)}
EMOJI=re.compile('[\U0001F300-\U0001FAFF☀-➿️‍]')
def xposts():
    seen={}
    for f in sorted(glob.glob(os.path.join(BIZ,'09_SNS_ツイート/x_auto/state/real_posts*.jsonl'))):
        for l in open(f):
            try:o=json.loads(l)
            except Exception: continue
            t=o.get('text','')
            if not PAT.search(t): continue
            seen[o['id']]=o
    rows=[]
    for o in seen.values():
        if '❶' in o['text']: continue
        t=re.sub(r'https?://\S+','',o['text'])
        t=EMOJI.sub('',t).strip()
        t=re.sub(r'[ \t]+',' ',t)
        # 告知・まとめ投稿、途中で切れた投稿、「！」を含む投稿は外す
        if 'YouTube更新' in t or '！' in t or '!' in t or '❶' in t: continue
        if not t.endswith('。'): continue
        rows.append({'id':o['id'],'date':o['date'][:10],'text':t,'imp':o.get('imp'),'like':o.get('like')})
    rows.sort(key=lambda r:r['date'],reverse=True)
    json.dump({'updated':datetime.date.today().isoformat(),'items':rows},open(os.path.join(ROOT,'pltr-x.json'),'w'),ensure_ascii=False,indent=1)
    print('x',len(rows))
if __name__=='__main__':
    radar();xposts()
