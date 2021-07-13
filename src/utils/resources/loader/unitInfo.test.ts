import * as fetch from 'node-fetch';

import {UnitType} from '../../../api-def/api';
import {CACHE_LIFE_SECS} from '../const';
import {resetCache} from './cache/main';
import {getUnitInfo} from './unitInfo';


describe('Unit info loader', () => {
  let fetchFunc: jest.SpyInstance;

  beforeEach(() => {
    fetchFunc = jest.spyOn(fetch, 'default');
  });

  afterEach(() => {
    jest.clearAllMocks();
    resetCache();
  });

  it('fetches the data', async () => {
    const unitInfo = await getUnitInfo(10930401);

    expect(fetchFunc).toHaveBeenCalledTimes(2);
    expect(unitInfo).not.toBeUndefined();
    expect(unitInfo?.id).toBe(10930401);
  });

  it('fetches the data even if unit ID has no corresponding info', async () => {
    const unitInfo = await getUnitInfo(10100101);

    expect(fetchFunc).toHaveBeenCalledTimes(2);
    expect(unitInfo).toBeUndefined();
  });

  it('fetches the data after the cache expires', async () => {
    await getUnitInfo(10100101);
    expect(fetchFunc).toHaveBeenCalledTimes(2);

    // Accelerate time
    const now = Date.now();
    jest
      .spyOn(Date, 'now')
      .mockImplementation(() => now + CACHE_LIFE_SECS * 1000 + 100000);

    await getUnitInfo(10100101);
    expect(fetchFunc).toHaveBeenCalledTimes(4);
  });

  it('records unit data type correctly', async () => {
    expect((await getUnitInfo(10950101))?.type).toBe(UnitType.CHARACTER);
    expect((await getUnitInfo(20040405))?.type).toBe(UnitType.DRAGON);
  });

  it('does not re-fetch within the cache life period', async () => {
    await getUnitInfo(10100101);
    expect(fetchFunc).toHaveBeenCalledTimes(2);
    await getUnitInfo(10100101);
    expect(fetchFunc).toHaveBeenCalledTimes(2);
  });
});
