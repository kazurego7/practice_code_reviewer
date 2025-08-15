"use client";

import Image from 'next/image';
import React from 'react';

function isValidPrUrl(value: string): boolean {
  try {
    const u = new URL(value);
    if (!/^https?:$/.test(u.protocol)) return false;
    if (u.hostname !== 'github.com') return false;
    // /owner/repo/pull/123 (optionally with more segments)
    const parts = u.pathname.split('/').filter(Boolean);
    if (parts.length < 4) return false;
    const [owner, repo, pull, id] = parts;
    return Boolean(owner && repo && pull === 'pull' && /^\d+$/.test(id ?? ''));
  } catch {
    return false;
  }
}

export default function Home() {
  const [prUrl, setPrUrl] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [auth, setAuth] = React.useState<null | { authenticated: boolean }>(null);

  const valid = isValidPrUrl(prUrl);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!valid || isSubmitting) return;
    setIsSubmitting(true);
    // P-03 実装まではダミー実行。将来は POST /api/review へ。
    // eslint-disable-next-line no-console
    console.log('レビュー実行: ', prUrl);
    await new Promise((r) => setTimeout(r, 1200));
    setIsSubmitting(false);
  }

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch('/api/auth/session', { cache: 'no-store' });
        const json = (await res.json()) as { authenticated: boolean };
        if (mounted) setAuth(json);
      } catch {
        if (mounted) setAuth({ authenticated: false });
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="font-sans min-h-screen p-8 sm:p-12">
      <main className="mx-auto w-full max-w-[720px] flex flex-col gap-6">
        <header className="flex items-center gap-3">
          <Image className="dark:invert" src="/next.svg" alt="logo" width={120} height={28} />
          <h1 className="text-lg font-semibold">PR レビュー</h1>
        </header>

        {auth === null && (
          <div className="text-sm text-gray-600 dark:text-gray-300">セッション確認中…</div>
        )}

        {auth?.authenticated === false && (
          <div className="rounded border p-4 flex items-center justify-between">
            <p className="text-sm">レビューを実行するには GitHub でログインしてください。</p>
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a className="rounded bg-black text-white px-3 py-1.5 text-sm" href="/api/auth/login">
              ログイン
            </a>
          </div>
        )}

        {auth?.authenticated && (
          <section className="w-full">
            <h2 className="mb-3 text-base font-semibold">PR 入力とレビュー実行（最小UI）</h2>
            <form onSubmit={onSubmit} className="flex flex-col gap-3">
              <label className="text-sm text-gray-700 dark:text-gray-300" htmlFor="pr-url">
                GitHub PR の URL
              </label>
              <input
                id="pr-url"
                type="url"
                inputMode="url"
                placeholder="https://github.com/owner/repo/pull/123"
                className="w-full rounded border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
                value={prUrl}
                onChange={(e) => setPrUrl(e.target.value.trim())}
                disabled={isSubmitting}
                aria-invalid={prUrl.length > 0 && !valid}
              />
              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  className="rounded bg-blue-600 text-white px-4 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700"
                  disabled={!valid || isSubmitting}
                >
                  レビュー
                </button>
                {isSubmitting && (
                  <span className="text-sm text-gray-600 dark:text-gray-300">レビュー実行中…</span>
                )}
              </div>
            </form>
            <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
              入力は URL 形式を検証し、無効な場合はボタンが無効化されます。
            </p>
          </section>
        )}
      </main>
    </div>
  );
}
