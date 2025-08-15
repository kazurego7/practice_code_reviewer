# Repository Guidelines

## プロジェクト構成 / モジュール配置
- `app/`: App Router の UI とルート構成。
- `pages/`: Pages Router と `pages/api/` の API ルート。
- `public/`: 画像・フォントなどの静的アセット。
- `tests/`: Jest/RTL のテストとセットアップ（例: `tests/setupTests.ts`）。
- `docs/`: 補助ドキュメント。
- ルート: `next.config.ts`, `jest.config.ts`, `tsconfig*.json`, `package.json`。

## ビルド・テスト・開発コマンド
- `npm run dev`: 開発サーバーを起動（Turbopack）。
- `npm run build`: 本番ビルドを生成。
- `npm start`: ビルド成果物を起動。
- `npm run lint`: ESLint（Next.js 推奨ルール）を実行。
- `npm test`: Jest でユニット/コンポーネントテストを実行。
例: 初回起動は `npm ci && npm run dev`。

## コーディング規約・命名
- 言語: TypeScript、React 19、Next.js 15。
- インデント: 2 スペース、セミコロンあり、シングルクォート優先。
- コンポーネントは PascalCase（例: `UserCard.tsx`）。ディレクトリ/ルートは kebab-case。
- API は `pages/api/*.ts`。共有ロジックは `@/` エイリアスで参照（例: `import x from '@/app/...';`）。
- スタイルは Tailwind CSS（PostCSS 経由）。グローバル/レイアウトは各セグメントのレイアウト内に配置。

## テストガイドライン
- フレームワーク: Jest + ts-jest、環境: `jsdom`、`@testing-library/react` を使用。
- 配置と命名: `tests/**` または隣接、`*.test.ts`/`*.test.tsx`。
- 実行: `npm test`。監視: `npx jest --watch`。失敗は再現手順を PR に記載。
- 目安: 新規コードは主要分岐をカバー（参考: ステートフル/条件分岐 80%+）。

## コミット & プルリクエスト
- コミットは命令形。可能なら Conventional Commits（例: `feat:`, `fix:`, `docs:`）。履歴に `docs:` あり。
- PR には目的・変更点・テスト結果を明記。関連 Issue をリンクし、UI 変更はスクリーンショット添付。
- チェックリスト: `npm run lint`/`npm test` がグリーン、差分が最小、レビュー観点を箇条書きで提示。

## セキュリティ & 設定
- 環境変数は `.env.local` に保存し、コミットしない。クライアント公開は `NEXT_PUBLIC_` 接頭辞のみ。
- 秘密鍵・トークンはコード直書き禁止。`public/` には機密を置かない。

