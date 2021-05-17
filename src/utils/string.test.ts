import {trim} from './string';

describe('String utils', () => {
  test('over-length string is trimmed', () => {
    expect(trim('123456', 5)).toBe('12345...');
  });

  test('sub-length string is not trimmed', () => {
    expect(trim('123', 5)).toBe('123');
  });
});
