import * as fetch from 'node-fetch';

import {Application, createApp} from '../../../app';
import {UnitNameRefController} from '../../../endpoints/data/unitNameRef/controller';
import {CACHE_LIFE_SECS} from '../const';
import {resetCache} from './cache/main';
import {getUnitIdByName} from './unitName2Id';


describe('Unit name to ID', () => {
  let app: Application;
  let fnFetch: jest.SpyInstance;
  let fnGetUnitName: jest.SpyInstance;

  beforeAll(async () => {
    app = await createApp();
  });

  beforeEach(() => {
    fnFetch = jest.spyOn(fetch, 'default');
    fnGetUnitName = jest.spyOn(UnitNameRefController, 'getData').mockResolvedValue({
      Unit: 10950101,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
    resetCache();
  });

  afterAll(async () => {
    await app.close();
  });

  it('fetches the data', async () => {
    const unitId = await getUnitIdByName('Unit', app.mongoClient);

    expect(fnFetch).toHaveBeenCalledTimes(2);
    expect(fnGetUnitName).toHaveBeenCalledTimes(1);
    expect(unitId).toBe(10950101);
  });

  it('uses the official unit name', async () => {
    const unitId = await getUnitIdByName('Gala Mym', app.mongoClient);

    expect(fnFetch).toHaveBeenCalledTimes(2);
    expect(fnGetUnitName).toHaveBeenCalledTimes(1);
    expect(unitId).toBe(10550101);
  });

  it('fetches the data even if unit name has no corresponding ID', async () => {
    const unitInfo = await getUnitIdByName('NA', app.mongoClient);

    expect(fnFetch).toHaveBeenCalledTimes(2);
    expect(fnGetUnitName).toHaveBeenCalledTimes(1);
    expect(unitInfo).toBeUndefined();
  });

  it('fetches the data after the cache expires', async () => {
    await getUnitIdByName('Gala Mym', app.mongoClient);
    fnFetch.mockClear();
    fnGetUnitName.mockClear();

    // Accelerate time
    const now = Date.now();
    jest
      .spyOn(Date, 'now')
      .mockImplementation(() => now + CACHE_LIFE_SECS * 1000 + 10000);

    await getUnitIdByName('Gala Mym', app.mongoClient);
    expect(fnFetch).toHaveBeenCalledTimes(2);
    expect(fnGetUnitName).toHaveBeenCalledTimes(1);
  });

  it('does not re-fetch within the cache life period', async () => {
    await getUnitIdByName('Gala Mym', app.mongoClient);
    expect(fnFetch).toHaveBeenCalledTimes(2);
    expect(fnGetUnitName).toHaveBeenCalledTimes(1);
    await getUnitIdByName('Gala Mym', app.mongoClient);
    expect(fnFetch).toHaveBeenCalledTimes(2);
    expect(fnGetUnitName).toHaveBeenCalledTimes(1);
  });
});
