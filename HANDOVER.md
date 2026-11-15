# FRONTIER LAB 引き継ぎメモ（Claude向け・運用情報）

最終更新：2026年11月15日 / 作成：Muse

## 1. サイトの置き場所
- 公開先：GitHub Pages https://sssttw3-eng.github.io/frontier-lab/
- リポジトリ：sssttw3-eng/frontier-lab（main）
- 本編の元ファイル：Mac の `Desktop/台本/community_site/frontier-lab-v2/`（map.html、pltr.*、各社JSON、assets/）
- 新しいページ群は **GitHub側にのみ存在する**（Macローカルにない）。触る前に必ず pull すること。

## 2. ページ構成（現行）
- `/index.html` … 新しいサイトTOP（入口）。生成物。元は生成器 gen_topb.py の出力（パスをルート用に変換したもの）
- `/map.html` … 既存の会員向けマップ（本編）。従来通り稼働中
- `/mock-design/top.html` … TOPのA案（世界観のみ）
- `/mock-design/top-b.html` … TOPのB案（本番入口の元データ）
- `/mock-design/join.html` … 会員募集ページ
- `/mock-design/j7.html` … Palantir資料（32スライド）
- `/mock-design/deck-n/s/i/a/t.html` … NVIDIA／SoFi／IonQ／AMD／Tesla の資料（各13スライド）
- `/mock-design/legal.html` … 法務ページ（特商法・プライバシー・利用規約・免責）
- `/ipo.html` … 上場予定ページ（本編側）

## 3. 生成器（Muse側ワークスペース `~/workspace/frontier-lab-mock/`）
生成物（HTML）を直接編集しない。必ず生成器を直して再生成する。
- `fl_tokens.py` … **デザインシステムの正**。色・タイポ・余白・角丸・ボタンの規格はここに集約。全生成器が読む
- `gen_top6.py` … TOP A案 / `gen_topb.py` … TOP B案（どちらも top.html へ出力するので実行順に注意。Bは出力後に top-b.html へコピー）
- `gen_j7.py` … Palantir資料（pltr.json から生成。CSSはここが正で、gen_all.py はこのCSSを流用）
- `gen_all.py` … 5社デッキ。元データは同フォルダ `data/` のサイト公開JSONコピー
- `gen_join.py` / `gen_legal.py` … 募集ページ／法務ページ
- `map_themes.json` … マップ（99社・分野タグ TAGS）と今週の論点 THEMES のデータ
- `build_map99.py` … ランキングv3からマップデータを再構築するスクリプト
- `UPDATE_RUNBOOK.md` … 決算48時間更新の手順と公開前チェックリスト

## 4. 公開フローと制約
- Museからは GitHub連携の push-files で直接push（UTF-8テキストのみ。**PNG等のバイナリはpush不可** → 画像は外部URL参照かSVGで解決）
- GitHub Pagesのキャッシュは最大10分（Cache-Control: max-age=600）。反映確認はハッシュ比較か時間を置く
- Mac側Claudeはローカル編集→通常のgit pushでよいが、**同じファイルをMuseと同時に触らない**。担当分担：今週の論点の自動切替＝Claude側、デザインと構造＝Muse側

## 5. デザイン規格（fl_tokens.py の要約）
- 色：青 #0a4d8c が主要、濃紺 #0d2236 は「ヒーローの陰・理念帯・濃色チップのみ」、金 #d4a24a は「ラベルと判定タグのみ」
- タイポ：見出し30／セクション26／カード17／本文14px。数字は tabular-nums 必須
- 余白：セクション72px。角丸：カード14px、ボタンはピル型
- ロゴ：チップは薄灰 #eef3f7、白色ロゴのみ濃紺チップ。中身は object-fit:contain
- 形式：1ページ=1スライド（全画面）のデッキ形式は崩さない。TOPは通常の縦スクロール
- FV写真：NASAの公式画像（パブリックドメイン）https://images-assets.nasa.gov/image/iss074e0494675/iss074e0494675~orig.jpg

## 6. 文章ルール（厳守）
- 事実→意味の順で短く言い切る。固有名詞と数字で書く
- 禁止：「は、」の直後読点癖、「基盤」「土台」等の抽象語だけの説明、「〜ではありません」「わけではありません」「確認し」、「追い風」等の定型句、受け身と抽象名詞の重ね
- 金額は日本語単位＋円換算（1ドル=154円）。CEO発言は原文・日時・出典つき。弱点は事実として必ず入れる
- 出典のない数字、推測の断定は書かない

## 7. 現在の状態（2026-11-15）
- 注目企業マップ：ランキングv3の全99社を掲載（S/A/B/C＋分野タグ19種、検索・絞り込み実装済み）。元データは Mac の `Desktop/台本/community_site/注目企業ランキング_v3_2026-11-08.txt`
- 決算カレンダー：15行（発表済み2件＋今後13件）。各行に「資料・見解」リンクの器あり（6社は資料へリンク済み、他は「見解ページ準備中」）
- FV：ボタンは置かない方針に決定済み（タグライン＋ミッション文のみ）
- 今週の論点：現在は map_themes.json の THEMES を手動差し替え。**自動切替の仕組みはClaude側で実装予定**（柏原の指示）

## 9. 役割分担（2026-11-15、柏原が決定）
### Muse担当：サイトのデザインと構造の全部
- TOP・マップ・カレンダー・募集ページ・法務・各社資料のデザインと構造
- **ロックされた見せ方（2026-11-15実装済み）**：入会前は各資料のファーストビュー（カバー）まで見えて、以降のスライドはぼかし＋鍵マークの案内を表示。記事は1本だけ全部読める＝Palantir資料（j7.html）は全文無料公開。他5社（deck-s/n/i/a/t）は冒頭のみ公開。TOPには柏原の動画を鍵付きカードで並べ、会員側に動画まであることが分かる状態にした。TOPの6社カードにも「全文を無料公開中／会員限定 ─ 冒頭のみ公開」のバッジ付き
- 注意：上記は**見せ方（視覚的なロック）**であり、実アクセス制御ではない。会員ゲートの実装はClaude側の担当（下記②）

### Claude担当
1. 今週の論点の自動切替（**map_themes.json の THEMES だけ**を触る）
2. Stripeの月額決済と、決済ごとにDiscordの1回だけ使える招待を出す仕組み。会員ゲートの外部実装案
3. 週刊AIニュースのメルマガ自動下書き
4. ライブ配信の会員向け自動再編集（OBS）
5. 解約・再入会ルールの文案

### 受け渡しの経路
- Claude→Muse へ渡す文言やボタンの行き先は、Mac の `~/Desktop/事業戦略/` に .txt で置く
- **ClaudeはHTMLと生成器には触らない**（生成器はMuse側ワークスペースのみ）

## 8. 未決事項（柏原の素材・決定待ち）
- 会員プランの価格 / Discord招待URL（site-config.js は空、ボタンは仮リンク）
- 運営者の顔写真 / 特商法表記の連絡先メール / 独自ドメイン / 計測ID（GA等）
- 会員ゲート（静的サイトでは実装不可。ホスティング移行か外部ゲートの判断待ち）

## 2026-11-15 Muse側の追加（M3・M4・M5・論点自動化）
- 入会導線：mock-design/apply.html（入力）・confirm.html（確認＝特商法の最終確認画面）・thanks.html（完了）を仕様txtどおりに作成。join.html のボタンは全て apply.html へ、料金は2,980円の表示文に差し替え済み。legal.html は仕様§10の文で置き換え済み（最終更新2026年11月15日）。
- join/ 部品（config.js・flow.js・gate.js・gate.css）はリポジトリ直下の join/ に配置済み。各画面は ../join/ から読む。WORKER_URL 等の実値は config.js が正。
- 見解ページ：mock-design/view.html?c=<slug> がひな形。会社データは生成器側の view-data.json。カレンダー各行からのリンクは決算カレンダー全社化（M2）と同時に接続する。
- 資料保管庫：mock-design/archive.html（一覧＋講座動画の欄）と archive-<動画ID>.html。データは Claude の spec.json から生成。**縮小画像とPDFの置き場所は mock-design/archive-img/<動画ID>/（p01.jpg…と slides.pdf）に決定。バイナリは Muse の push では送れないため、Claude が git で push すること**。画像が無い間は番号タイル表示に落ちる。
- 活用ガイド：mock-design/guide.html（依頼3の5行どおり）。
- 論点の自動切替：生成器はリポジトリ直下の map_themes.json（新形式：THEMES=辞書の配列＋THEMES_META）を優先して読む。無ければローカルの従来形式にフォールバック。月曜7時過ぎに自動チェック→差分があればTOPと本番indexを再生成して push する仕組みを Muse 側に設置済み。Claude は従来どおり月曜6時に map_themes.json の THEMES と THEMES_META だけを差分 push すればよい。
- ゲート（§7）の扱い：gate.js の本文クリップ方式はスライド形式（1ページ=1スライド）と競合するため、デッキとTOPには組み込んでいない。資料のロック表示は M1 の CSS 方式が正。gate.js は join/ に置いてあり、案B（Worker）移行時に使う。
