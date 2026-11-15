# FRONTIER LAB サイト全体像（共有用）

最終更新：2026年11月15日 / 作成：Muse
公開先：https://sssttw3-eng.github.io/frontier-lab/ （GitHub Pages、リポジトリ sssttw3-eng/frontier-lab）

## 1. ページ一覧と公開状態

### 誰でも見られるページ
| ページ | URL | 役割 |
|---|---|---|
| サイトTOP（本番入口） | / （ルートの index.html） | 論点・6社資料への入口・99社マップ・決算カレンダー・理念 |
| 会員募集ページ | /mock-design/join.html | 料金（月額2,980円・1月31日までの入会は2月1日まで無料）と申込への導線 |
| Palantir資料 | /mock-design/j7.html | **1本だけ全文を無料公開**（32スライド）。他の資料の見本 |
| 法務ページ | /mock-design/legal.html | 特商法・利用規約・プライバシー・免責 |
| 活用ガイド | /mock-design/guide.html | 入会した人が最初に開くページ（毎週の流れ5つ） |
| 上場予定ページ | /ipo.html | 本編側の既存ページ |

### 冒頭だけ見られるページ（ロックされた見せ方）
| ページ | URL | 状態 |
|---|---|---|
| 他5社の資料 | /mock-design/deck-n.html（NVIDIA）・deck-s（SoFi）・deck-i（IonQ）・deck-a（AMD）・deck-t（Tesla） | カバーだけ鮮明、以降はぼかし＋会員案内。各13スライド＋論点スライド |
| 資料保管庫の各回 | /mock-design/archive-<動画ID>.html | 動画と最初の2ページ分は表示、以降はぼかし。現在はPalantir 3Qの回のみ |
| 見解ページ | /mock-design/view.html?c=<会社> | 95社分のひな形。日付と「見る数字」は表示、見解本文は決算後に会員向けに公開 |

これは**見せ方（視覚的なロック）**であり、本当のアクセス制御ではない。会員だけが読める実ゲートは、独自ドメイン＋Cloudflare Worker の方式（案B）で別途実装する（Claude担当、ドメイン決定待ち）。

### 会員向け・手続きのページ
| ページ | URL | 役割 |
|---|---|---|
| 資料保管庫の一覧 | /mock-design/archive.html | 動画ごとの資料・一次情報の置き場。講座動画（会員ライブ）の欄もここ |
| 申込フォーム | /mock-design/apply.html | ニックネーム・メール・きっかけを入力 |
| 確認画面 | /mock-design/confirm.html | 特商法の最終確認画面。同意2件にチェックすると決済へ進める |
| 完了画面 | /mock-design/thanks.html | Discord招待リンク（1回だけ使える）の表示、会員サイトと契約管理へのリンク |
| 旧・会員向けマップ | /map.html | 従来の会員ページ。稼働中（新TOPとは別に残してある） |
| TOPの試作 | /mock-design/top.html（A案）・top-b.html（B案＝本番の元） | 試作置き場。本番入口はB案 |

申込の流れ：募集ページ → 申込フォーム → 確認画面 → Stripeの決済画面 → 完了画面（Discord招待）→ 会員サイト。
裏側の処理（Stripe決済、招待リンクの発行、契約管理ページへの接続）は Worker（Claude担当）が担い、未デプロイの間はデモ遷移になる。接続先などの設定値はリポジトリ直下の `join/config.js` が正。

## 2. 更新の仕組み

- ページは全て「生成器」（プログラム）から作る。HTMLを直接編集しても次の生成で上書きされるため、**編集は生成器経由（Muse）か、データファイル経由**で行う
- 今週の論点：Claudeが毎週月曜6時にリポジトリ直下の `map_themes.json` を差し替え → Muse側が月曜7時過ぎに自動で検知し、TOPと本番ページを作り直して公開する
- 決算カレンダー：データは生成器側の `earn-data.json`（99社分の次回決算日・見る数字・出典）。各社のIRで確認し、確定16社・見込み79社・未上場で対象外4社
- 各社資料：対象6社の決算から48時間以内に更新する運用（手順は UPDATE_RUNBOOK.md）
- 役割分担：サイトのデザインと構造＝Muse／論点の自動切替・StripeとDiscord招待の仕組み・メルマガ下書き・ライブ再編集・解約ルールの文案＝Claude／詳細は HANDOVER.md

## 3. アカウントと操作権限

| サービス | 状態 | 青木さんの操作 |
|---|---|---|
| GitHub（サイト本体） | リポジトリ sssttw3-eng/frontier-lab。frontierlab.jp@gmail.com 宛にコラボレーター招待を送信 | 招待メールからGitHubアカウントを作成し承認すると、リポジトリを直接編集できる |
| 運営Gmail | frontierlab.jp@gmail.com（パスワードは1Passwordで共有済み） | 受信・送信とも操作可 |
| Mailchimp | 既存アカウントのログインメールを frontierlab.jp@gmail.com に変更済み（新規作成・課金なし） | ログインメール＋パスワード（1Password共有）で操作可 |
| Discord | 運営用アカウント「FRONTIER LAB」を作成中。既存のJINサーバーを使い、サーバー参加と管理者ロールはClaudeが設定 | 作成完了後、ログイン情報を1Passwordで共有 |
| Stripe | 既存アカウントへ frontierlab.jp@gmail.com を管理者として招待予定（柏原のログインが必要） | 招待承認後は管理者として操作可 |

## 4. 未決事項（柏原の判断待ち）
- 料金の最終決定（2,980円は仮置き）
- 独自ドメインの有無（実ゲートの方式が決まる）
- Stripeのログインリンク有効化の確認
