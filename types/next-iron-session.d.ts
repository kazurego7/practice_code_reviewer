import type { IronSession, IronSessionData } from 'iron-session';
import 'next';

declare module 'next' {
  interface NextApiRequest {
    // iron-session により実行時に付与される
    session?: IronSession<IronSessionData>;
  }
}
