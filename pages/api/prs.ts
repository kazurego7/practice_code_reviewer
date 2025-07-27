import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { owner, repo } = req.query;
  const data = {
    owner,
    repo,
    prs: [
      { id: 1, title: 'Mock PR 1' },
      { id: 2, title: 'Mock PR 2' }
    ]
  };

  res.status(200).json(data);
}
