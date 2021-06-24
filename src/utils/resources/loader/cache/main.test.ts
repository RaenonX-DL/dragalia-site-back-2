import * as fetch from 'node-fetch';

import {Application, createApp} from '../../../../app';
import {UnitNameRefController} from '../../../../endpoints/data/unitNameRef/controller';
import {CACHE_LIFE_SECS} from '../../const';
import {getCache, resetCache} from './main';
import {CacheKey} from './types';


describe('Resource loader cache', () => {
  let app: Application;
  let fnFetch: jest.SpyInstance;
  let fnGetUnitName: jest.SpyInstance;

  beforeAll(async () => {
    app = await createApp();
  });

  beforeEach(async () => {
    fnFetch = jest.spyOn(fetch, 'default');
    fnGetUnitName = jest.spyOn(UnitNameRefController, 'getData');
  });

  afterEach(() => {
    resetCache();
  });

  afterAll(async () => {
    await app.close();
  });

  it('fetches unit info but not unit name if request unit info by ID', async () => {
    await getCache(CacheKey.UNIT_INFO, undefined);
    expect(fnFetch).toHaveBeenCalledTimes(2);
  });

  it('does not re-fetch unit info if request twice', async () => {
    await getCache(CacheKey.UNIT_INFO, undefined);
    fnFetch.mockClear();
    await getCache(CacheKey.UNIT_INFO, undefined);
    expect(fnFetch).not.toHaveBeenCalled();
  });

  it('fetches unit info and name if requested unit ID by name', async () => {
    await getCache(CacheKey.UNIT_NAME_2_ID, app.mongoClient);
    expect(fnFetch).toHaveBeenCalledTimes(2);
    expect(fnGetUnitName).toHaveBeenCalledTimes(1);
  });

  it('does not re-fetch if request unit name twice', async () => {
    await getCache(CacheKey.UNIT_NAME_2_ID, app.mongoClient);
    fnFetch.mockClear();
    fnGetUnitName.mockClear();
    await getCache(CacheKey.UNIT_NAME_2_ID, app.mongoClient);
    expect(fnFetch).not.toHaveBeenCalled();
    expect(fnGetUnitName).not.toHaveBeenCalled();
  });

  it('fetches unit name only if request unit info first then request unit name', async () => {
    await getCache(CacheKey.UNIT_INFO, undefined);
    fnFetch.mockClear();
    fnGetUnitName.mockClear();
    await getCache(CacheKey.UNIT_NAME_2_ID, app.mongoClient);
    expect(fnFetch).not.toHaveBeenCalled();
    expect(fnGetUnitName).toHaveBeenCalledTimes(1);
  });

  it('does not re-fetch if request unit name first then unit info', async () => {
    await getCache(CacheKey.UNIT_NAME_2_ID, app.mongoClient);
    fnFetch.mockClear();
    fnGetUnitName.mockClear();
    await getCache(CacheKey.UNIT_INFO, undefined);
    expect(fnFetch).not.toHaveBeenCalled();
    expect(fnGetUnitName).not.toHaveBeenCalled();
  });

  it('re-fetches after the cache expires', async () => {
    await getCache(CacheKey.UNIT_NAME_2_ID, app.mongoClient);
    expect(fnFetch).toHaveBeenCalledTimes(2);

    // Accelerate time
    const now = Date.now();
    jest
      .spyOn(Date, 'now')
      .mockImplementation(() => now + CACHE_LIFE_SECS * 1000 + 100000);

    await getCache(CacheKey.UNIT_NAME_2_ID, app.mongoClient);
    expect(fnFetch).toHaveBeenCalledTimes(4);

    jest.restoreAllMocks();
  });
});
