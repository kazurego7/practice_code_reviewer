# 一時ディレクトリ運用（/agents-local）

Codex/各種エージェントがローカルで読み書きする、リポジトリに含めない一時ファイル置き場として `agents-local/` を使用します。

- 版管理: `.gitignore` により `agents-local/` はコミット対象外です。
- Lint/Format/Test: `.eslintignore`/`.prettierignore`/`jest.config.ts` で `agents-local/` を無視します。
- 想定用途: 生成物の下書き、スクラッチの入出力、ワークファイルの退避など。
- 注意事項: 機微情報は置かない（ローカルでも漏洩リスクに留意）。長期保存が必要な成果物は `docs/` か正規の配置へ移動してください。

## 命名の目安
- 形式: `<tool>-<purpose>-<timestamp>-<rand>.<ext>`
  - 例: `codex-review-20250815-7a9f.txt`
- 原子的書き込み: `target.tmp` に出力 → 完了後に目的名へリネーム。
- クリーンアップ: セッション終了時に不要ファイルは削除してください。

## 参照例（Node.js）
```ts
import path from 'node:path';

export const AGENTS_LOCAL = path.resolve(process.cwd(), 'agents-local');
export const tmpPath = (...p: string[]) => path.join(AGENTS_LOCAL, ...p);
```

`AGENTS_LOCAL` は固定で `agents-local/` を指します。必要に応じて環境変数で上書きしても構いません。
