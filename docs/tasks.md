## MVP バックログ（小さく速く届ける）

凡例: Priority=P0(最重要)/P1、Status=Todo/Doing/Done、Estimate=pt（相対）

---

### Epic: 認証の最小実装（OAuth ベースライン）
- ユーザーストーリー: 開発者として、GitHub でサインインして保護画面に入れるようにしたい。
  - 受け入れ条件:
    - `GET /api/auth/login` → GitHub へリダイレクト（`public_repo`）
    - `GET /api/auth/callback` → アクセストークンをサーバーセッションへ保存
    - `GET /api/auth/session` → `{ authenticated: boolean }` を返す
  - Priority: P0 / Estimate: 3pt / Status: Doing
  - 備考: `IRON_SESSION_PASSWORD` を `.env.local` 管理（Git 追跡外）

---

### Epic: PR 入力とレビュー実行（最小UI）
- ユーザーストーリー: 開発者として、PR の URL を入力して [レビュー] を押したい。
  - 受け入れ条件:
    - 入力欄 + [レビュー] ボタン（URL 形式チェック、無効化制御）
    - 実行時は「レビュー実行中…」表示と入力無効化
  - Priority: P0 / Estimate: 3pt / Status: Todo
  - 依存: 認証ベースライン

---

### Epic: レビュー API 最小版（`POST /api/review`）
- ユーザーストーリー: 開発者として、PR URL を渡すとレビュー結果（箇条書き）を受け取りたい。
  - 受け入れ条件:
    - リクエスト: `{ pr_url: string }`
    - サーバーで `.diff` をプロキシ取得（クライアントから diff を送らない）
    - サイズ上限: 200,000 chars 超過で HTTP 413
    - モデル: `gpt-5` 固定、呼び出し 1 回（リトライはポストMVP）
    - レスポンス: `{ issues: Array<{ message: string }> }`
  - Priority: P0 / Estimate: 5pt / Status: Todo

---

### Epic: 結果表示 UI（最小）
- ユーザーストーリー: 開発者として、改善ポイントを一覧で確認したい。
  - 受け入れ条件:
    - 箇条書きで表示（Diff 折りたたみはポストMVP）
  - Priority: P1 / Estimate: 2pt / Status: Todo

---

### Epic: テスト最小（スモーク）
- ユーザーストーリー: 主要フローが壊れていないことを最小限で担保したい。
  - 受け入れ条件:
    - 単体: 413 ガード、API 正常系のレスポンス整形
    - E2E: OAuth → レビュー実行 → 結果表示（ハッピーパス）
  - Priority: P0 / Estimate: 3pt / Status: Todo

---

## ポストMVP バックログ（Parking Lot）

- PR 一覧から選択（`GET /api/prs` と UI 連携）
- レビュー UI の「＋ Diff を表示」展開
- OpenAI 呼び出しの指数バックオフ（最大 2 回リトライ）
- ロギング・メトリクス（OpenAI/GitHub/KPI/コスト見積）
- GitHub レート制限対策（残回数<100の自動バックオフ）
- コスト制御（¥50 超過見込み時の警告）
- デプロイ設定（Vercel `maxDuration=300s`）
- 環境変数ドキュメント整備（`GITHUB_CLIENT_ID/SECRET`, `NEXT_PUBLIC_BASE_URL` 等）
- テスト拡充（エッジケース/E2E 全網羅、OpenAI モック）

---

## 備考
- 仕様ソース: `docs/requirements.md`, `docs/specifications.md`
- MVP は「ログイン → PR 入力 → レビュー結果一覧」の最短価値提供にフォーカス。
- PostMVP の項目は MVP 完了後に段階導入する。
