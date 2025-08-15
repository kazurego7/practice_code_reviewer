import { render, screen, waitFor } from '@testing-library/react';
import Home from '@/app/page';

// Next.js App Router のフックをモック
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), prefetch: jest.fn() }),
}));

describe('トップ: 認証状態で表示切り替え', () => {
  test('未認証だとログイン促しとリンクのみ表示', async () => {
    (global as any).fetch = jest.fn().mockResolvedValue({
      json: async () => ({ authenticated: false }),
    });

    render(<Home />);

    expect(screen.getByText('セッション確認中…')).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByText('セッション確認中…')).not.toBeInTheDocument());

    expect(
      screen.getByText('レビューを実行するには GitHub でログインしてください。')
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'ログイン' })).toHaveAttribute(
      'href',
      '/api/auth/login'
    );
    expect(screen.queryByLabelText('GitHub PR の URL')).not.toBeInTheDocument();
  });

  test('認証済みだと PR 入力フォームが表示', async () => {
    (global as any).fetch = jest.fn().mockResolvedValue({
      json: async () => ({ authenticated: true }),
    });

    render(<Home />);

    await waitFor(() => screen.getByLabelText('GitHub PR の URL'));
    expect(screen.getByRole('button', { name: 'レビュー' })).toBeDisabled();
  });
});
