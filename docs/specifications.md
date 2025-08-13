# 仕様書

- [1. ランタイム](#1-ランタイム)
- [2. OAuth スコープ](#2-oauth-スコープ)
- [3. エンドポイント](#3-エンドポイント)
- [4. モデル](#4-モデル)
- [5. diff サイズ上限](#5-diff-サイズ上限)
- [6. チャンク分割](#6-チャンク分割)
- [7. OpenAI 呼び出し](#7-openai-呼び出し)
- [8. ログ出力](#8-ログ出力)
- [9. レート制限対策（GitHub）](#9-レート制限対策github)
- [10. セキュリティ](#10-セキュリティ)
- [11. コスト上限](#11-コスト上限)
- [12. テスト要件](#12-テスト要件)
- [13. 用語集](#13-用語集)

---

## 1. ランタイム

* Vercel **Node.js Functions**
* `maxDuration`: **300 秒**

## 2. OAuth スコープ

* `public_repo`（公開リポジトリのみ）
* ※ 将来的にプライベート対応を行う場合は `repo` を追加

## 3. エンドポイント

* `POST /api/review`

  * リクエストボディ: `{ pr_url: string }`
  * サーバー側で GitHub の `.diff` URL（`https://github.com/{owner}/{repo}/pull/{number}.diff`）を取得
  * CORS 問題を回避するため、サーバー経由（Proxy）でフェッチ
  * `.diff` テキストを LLM に一度だけ送信
  * レスポンス: `{ issues: Array<{ message: string; diff_range?: {start: number;end: number} }>; }`

## 4. モデル

* **gpt-5 固定**（モデル切替なし）

## 5. diff サイズ上限

* **200,000 chars**（概算 ≤ 50k tokens）
* 超過時の挙動:

  * **HTTP 413** を返却
  * クライアントに「PR が大きすぎます。diff を分割するか小規模な PR にしてください」とガイダンス表示

## 6. チャンク分割

* **行わない**（小規模 PR 前提）
* 大規模 PR は 5. diff サイズ上限のガイドを参照

## 7. OpenAI 呼び出し

* 実行は **1 回**
* エラー時は **最大 2 回リトライ**（指数バックオフ）

## 8. ログ出力

* `openai.tokens_prompt`
* `openai.tokens_completion`
* `openai.cost_est_jpy`
* `github.rateRemaining`
* `github.rateResetEpoch`
* **KPI用**:
  * OpenAI エラー率
  * GitHub API 呼び出し成功率

## 9. レート制限対策（GitHub）

* `X-RateLimit-Remaining` が **100 未満**になったら自動バックオフ
* `X-RateLimit-Reset` を参照して再試行時刻を調整

## 10. セキュリティ

* GitHub アクセストークンはサーバー側で安全に保管（環境変数／暗号化ストレージ）
* クライアントから **diff を送信しない**（Vercel 本体のサイズ制限回避・トークン露出防止）

## 11. コスト上限

* 1 実行あたりの概算コストを **¥50 以内**に制御
* 超過見込み時は警告を表示してユーザー確認

## 12. テスト要件

* **ユニットテスト**

  * API レスポンス整形
  * サイズ上限ガード
  * リトライロジック
* **E2E テスト**

  * OAuth → レビュー実行 → 結果表示
  * 413 エラー時の画面動作確認
  * レート制限発火時のバックオフ動作
* **モックテスト**

  * OpenAI API をスタブ化し安定検証

## 13. 用語集

* **GitHub レート残量**: `X-RateLimit-Remaining`（残回数）
* **GitHub リセット時刻**: `X-RateLimit-Reset`（リセット UNIX epoch 時刻）
