import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Home from '@/app/page';

// Next.js App Router のフックをモック
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), prefetch: jest.fn() }),
}));

describe('P-02: PR 入力とレビュー実行（最小UI）', () => {
  beforeEach(() => {
    // 認証済みとしてモック
    (global as any).fetch = jest.fn().mockResolvedValue({
      json: async () => ({ authenticated: true }),
    });
  });

  test('URL 検証によりボタンが有効/無効になる', async () => {
    render(<Home />);

    const input = (await screen.findByLabelText('GitHub PR の URL')) as HTMLInputElement;
    const button = await screen.findByRole('button', { name: 'レビュー' });

    expect(button).toBeDisabled();

    fireEvent.change(input, { target: { value: 'invalid-url' } });
    expect(button).toBeDisabled();

    fireEvent.change(input, {
      target: { value: 'https://github.com/owner/repo/pull/123' },
    });
    expect(button).toBeEnabled();
  });

  test('送信中は「レビュー実行中…」表示と入力無効化', async () => {
    render(<Home />);

    const input = (await screen.findByLabelText('GitHub PR の URL')) as HTMLInputElement;
    const button = await screen.findByRole('button', { name: 'レビュー' });

    fireEvent.change(input, {
      target: { value: 'https://github.com/owner/repo/pull/456' },
    });

    fireEvent.click(button);

    expect(button).toBeDisabled();
    expect(input).toBeDisabled();
    expect(await screen.findByText('レビュー実行中…')).toBeInTheDocument();

    await waitFor(async () => {
      expect(screen.queryByText('レビュー実行中…')).not.toBeInTheDocument();
    });
  });
});
