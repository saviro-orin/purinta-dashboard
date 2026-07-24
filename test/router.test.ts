import { describe, expect, test } from 'bun:test';
import { matchPath } from '../client/router';

describe('matchPath', () => {
  test('matches static paths exactly', () => {
    expect(matchPath('/', '/')).toEqual({});
    expect(matchPath('/', '/market/1/abc')).toBeNull();
  });

  test('extracts params from dynamic segments', () => {
    expect(matchPath('/market/:chainId/:id', '/market/4663/0xabc')).toEqual({ chainId: '4663', id: '0xabc' });
    expect(matchPath('/market/:chainId/:id', '/market/0xabc')).toBeNull();
    expect(matchPath('/market/:chainId/:id', '/other/4663/0xabc')).toBeNull();
  });

  test('decodes URI-encoded params', () => {
    expect(matchPath('/market/:chainId/:id', '/market/1/a%20b')).toEqual({ chainId: '1', id: 'a b' });
  });
});
