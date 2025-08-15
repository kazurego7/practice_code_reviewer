import type { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from '@/lib/session';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const session = await getSession(req, res);
  if (!session.githubToken) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { owner, repo } = req.query as { owner?: string; repo?: string };
  if (!owner || !repo) {
    return res.status(400).json({ error: 'Missing owner or repo' });
  }

  try {
    const gh = await fetch(
      `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/pulls?state=open&per_page=10`,
      {
        headers: {
          Authorization: `token ${session.githubToken}`,
          Accept: 'application/vnd.github.v3+json',
          'User-Agent': 'practice-code-reviewer',
        },
      }
    );

    if (!gh.ok) {
      // フォールバック: ネットワーク不可や 4xx/5xx 時は最小のモックを返す
      return res.status(200).json({
        owner,
        repo,
        prs: [
          { id: 1, title: 'Mock PR 1' },
          { id: 2, title: 'Mock PR 2' },
        ],
        note: 'GitHub API 呼び出しに失敗したためモックを返却',
      });
    }

    type GitHubPr = { id: number; title: string; number: number; html_url: string };
    const list = (await gh.json()) as GitHubPr[];
    const prs = list.map((pr) => ({ id: pr.id, title: pr.title, number: pr.number, url: pr.html_url }));
    return res.status(200).json({ owner, repo, prs });
  } catch {
    return res.status(200).json({
      owner,
      repo,
      prs: [
        { id: 1, title: 'Mock PR 1' },
        { id: 2, title: 'Mock PR 2' },
      ],
      note: '例外発生のためモックを返却',
    });
  }
}
