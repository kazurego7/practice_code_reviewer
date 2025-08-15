import 'iron-session';

declare module 'iron-session' {
  interface IronSessionData {
    ghAccessToken?: string;
  }
}

