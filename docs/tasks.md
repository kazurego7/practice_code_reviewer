## チェックリスト

### Vercel Node.js Functions の設定
- [ ] 実装: `maxDuration` を 300 秒に設定
- [ ] テスト: デプロイ後に設定が反映されていることを確認

### GitHub OAuth (`public_repo` スコープ)
- [ ] 実装: OAuth フローの実装
- [ ] テスト: 認可〜トークン取得までの結合テスト

### リポジトリ指定画面の作成
- [ ] 実装: ユーザーが対象リポジトリを入力・選択できる画面
- [ ] テスト: 画面操作を確認する E2E テスト

### `GET /api/prs?owner=&repo=` エンドポイント
 - [x] 実装: PR 一覧取得ロジックと API レスポンス整形
 - [x] テスト: 上記ロジックの単体テスト
 - [x] テスト: ルーティングやヘッダー処理を含む結合テスト

### `POST /api/review` エンドポイント
 - [x] 実装: diff 取得・検証ロジックと LLM 呼び出しのリトライ
 - [x] テスト: 上記ロジックの単体テスト
 - [x] テスト: ルーティングと PR 指定エラー処理を含む結合テスト

### diff サイズ上限チェック
- [ ] 実装: 200,000 文字超過で HTTP 413 を返すガードを実装
- [ ] テスト: ガード処理の単体テスト

### OpenAI 呼び出し・リトライ
- [ ] 実装: 失敗時の指数バックオフを実装
- [ ] テスト: リトライ動作の単体テスト

### ログ出力
- [ ] 実装: `openai.tokens_prompt` などのログを出力
- [ ] テスト: 出力内容を確認する単体テスト

### GitHub レート制限対策
- [ ] 実装: 残回数 < 100 で待機し、`X-RateLimit-Reset` から再試行時刻を計算
- [ ] テスト: 上記ロジックの単体テスト

### アクセストークン管理とセキュリティ
- [ ] 実装: トークンをサーバ側で安全に保持し、クライアントから diff を送らない
- [ ] テスト: トークン格納と取扱いを確認する結合テスト

### コスト上限チェック
- [ ] 実装: 1 実行あたりの概算コスト計算と上限超過時の警告表示
- [ ] テスト: 計算ロジックの単体テスト
- [ ] テスト: 警告表示を含む結合テスト

### レビュー結果の表示 UI
- [ ] 実装: 改善ポイントを画面に表示
- [ ] テスト: UI 表示を確認する E2E テスト

### UI の最小構成
- [ ] 実装: スピナー等を省いたシンプルな UI
- [ ] テスト: 表示遅延が問題ないか確認する E2E テスト
