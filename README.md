# GitHub PR 自動レビューサンプル

本リポジトリは [Next.js](https://nextjs.org) と ChatGPT を組み合わせ、GitHub の Pull Request を自動でレビューするサンプルアプリです。

## 概要
Next.js アプリから GitHub OAuth 認証を行い、選択した PR の diff を ChatGPT API に送信して改善点を取得します。

## 主要機能
- GitHub OAuth を用いたユーザー認証
- 指定リポジトリのオープン PR 一覧取得
- PR の diff を取得して ChatGPT へレビュー依頼
- AI から返された改善点の一覧表示

## 開発手順
1. 依存関係をインストール
   ```bash
   npm install
   ```
2. 開発サーバを起動
   ```bash
   npm run dev
   ```

## テスト方法
Jest を利用した単体テストを以下のコマンドで実行できます。
```bash
npm test
```

詳細な要件は [docs/requirements.md](docs/requirements.md) を参照してください。
