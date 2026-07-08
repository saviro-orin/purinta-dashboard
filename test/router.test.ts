import { describe, expect, test } from 'bun:test';
import { matchPath } from '../client/router';

describe('matchPath', () => {
  test('matches static paths exactly', () => {
    expect(matchPath('/', '/')).toEqual({});
    expect(matchPath('/', '/market/abc')).toBeNull();
  });

  test('extracts params from dynamic segments', () => {
    expect(matchPath('/market/:id', '/market/0xabc')).toEqual({ id: '0xabc' });
    expect(matchPath('/market/:id', '/market/0xabc/extra')).toBeNull();
    expect(matchPath('/market/:id', '/other/0xabc')).toBeNull();
  });

  test('decodes URI-encoded params', () => {
    expect(matchPath('/market/:id', '/market/a%20b')).toEqual({ id: 'a b' });
  });
});
