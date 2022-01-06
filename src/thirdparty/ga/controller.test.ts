import {periodicCountryData, periodicLangData} from '../../../test/data/thirdparty/ga';
import {Application, createApp} from '../../app';
import {CACHE_LIFE_SECS} from '../../utils/cache/const';
import {getGaData, resetGaData} from './controller';
import * as periodicCountry from './data/periodicCountry';
import * as periodicTotal from './data/periodicTotal';


describe('Google Analytics data cache', () => {
  let app: Application;
  let fnFetchTotal: jest.SpyInstance;
  let fnFetchCountry: jest.SpyInstance;

  beforeAll(async () => {
    app = await createApp();
  });

  beforeEach(async () => {
    fnFetchTotal = jest.spyOn(periodicTotal, 'getPeriodicLanguageUser')
      .mockResolvedValue(periodicLangData);
    fnFetchCountry = jest.spyOn(periodicCountry, 'getPeriodicCountryUser')
      .mockResolvedValue(periodicCountryData);
  });

  afterEach(() => {
    resetGaData();
  });

  afterAll(async () => {
    await app.close();
  });

  it('fetches data on initial request', async () => {
    await getGaData();
    expect(fnFetchTotal).toHaveBeenCalledTimes(1);
    expect(fnFetchCountry).toHaveBeenCalledTimes(1);
  });

  it('does not re-fetch data twice', async () => {
    await getGaData();
    fnFetchTotal.mockClear();
    fnFetchCountry.mockClear();
    await getGaData();
    expect(fnFetchTotal).not.toHaveBeenCalled();
    expect(fnFetchCountry).not.toHaveBeenCalled();
  });

  it('re-fetches after the cache expires', async () => {
    await getGaData();
    expect(fnFetchTotal).toHaveBeenCalledTimes(1);
    expect(fnFetchCountry).toHaveBeenCalledTimes(1);

    // Accelerate time
    const now = Date.now();
    jest
      .spyOn(Date, 'now')
      .mockImplementation(() => now + CACHE_LIFE_SECS * 1000 + 100000);

    await getGaData();
    expect(fnFetchTotal).toHaveBeenCalledTimes(2);
    expect(fnFetchCountry).toHaveBeenCalledTimes(2);

    jest.restoreAllMocks();
  });
});
