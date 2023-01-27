import { createUUID } from '../utils/uuid';

import { ExpiringCookieStore, InMemoryStore } from './stores';

interface Store {
  read: (key: string) => string | undefined;
  write: (key: string, value: string) => string;
}

export type UserTokenOptions = Partial<{
  anonmyousId: { enabled: boolean; lease: number };
  userToken: { cookie: boolean; lease: number };
}>;

const DefaultUserTokenOptions = {
  anonmyousId: { enabled: true, lease: 60 },
  userToken: { cookie: true, lease: 1440 },
};

/*

By default we want an anonmyousId with a configurabale lease.
This id should be read each time we send an event, to renew its lease.

If a builder explicitly sets a userToken, we want to clear this anonmyousId and use the explicit one,
and if the configuration has cookie storage enabled, store the userToken in a cookie.

*/

export const USER_TOKEN_KEY = 'alg:userToken';
export const ANONYMOUS_ID_KEY = 'alg:anonymousId';

export class UserToken {
  private anonmyousIdStore?: ExpiringCookieStore;
  private userTokenStore: Store;

  constructor(opts: UserTokenOptions = DefaultUserTokenOptions) {
    if (opts.anonmyousId?.enabled) {
      this.anonmyousIdStore = new ExpiringCookieStore(opts.anonmyousId.lease);
    }

    if (opts.userToken?.cookie) {
      this.userTokenStore = new ExpiringCookieStore(opts.userToken.lease);
    } else {
      this.userTokenStore = new InMemoryStore();
    }
  }

  setUserToken(userToken: string) {
    this.userTokenStore.write(USER_TOKEN_KEY, userToken);
    this.anonmyousIdStore?.delete(ANONYMOUS_ID_KEY);
  }

  getUserToken() {
    const userToken = this.userTokenStore.read(USER_TOKEN_KEY);
    if (userToken) {
      return userToken;
    }

    return this.anonId();
  }

  private anonId() {
    if (!this.anonmyousIdStore) {
      return undefined;
    }

    const id = this.anonmyousIdStore?.read(ANONYMOUS_ID_KEY);
    if (id) {
      return id;
    }

    return this.anonmyousIdStore?.write(
      ANONYMOUS_ID_KEY,
      `anon-${createUUID()}`
    );
  }
}
