import {periodicActiveData, periodicCountryData, periodicLangData} from '../../../test/data/thirdparty/ga';
import {Application, createApp} from '../../app';
import {getGaData} from './controller';
import * as periodicActive from './data/periodicActive';
import * as periodicCountry from './data/periodicCountry';
import * as periodicTotal from './data/periodicTotal';
import {resetCache} from './dbCache';


describe('Google Analytics data cache', () => {
  let app: Application;
  let fnFetchTotal: jest.SpyInstance;
  let fnFetchCountry: jest.SpyInstance;
  let fnFetchActive: jest.SpyInstance;

  beforeAll(async () => {
    app = await createApp();
  });

  beforeEach(async () => {
    await app.reset();

    fnFetchTotal = jest.spyOn(periodicTotal, 'getPeriodicLanguageUser')
      .mockResolvedValue(periodicLangData);
    fnFetchCountry = jest.spyOn(periodicCountry, 'getPeriodicCountryUser')
      .mockResolvedValue(periodicCountryData);
    fnFetchActive = jest.spyOn(periodicActive, 'getPeriodicActiveUser')
      .mockResolvedValue(periodicActiveData);
  });

  afterAll(async () => {
    await app.close();
  });

  it('fetches data on initial request', async () => {
    await getGaData(app.mongoClient);
    expect(fnFetchTotal).toHaveBeenCalledTimes(1);
    expect(fnFetchCountry).toHaveBeenCalledTimes(1);
    expect(fnFetchActive).toHaveBeenCalledTimes(1);
  });

  it('does not re-fetch data twice', async () => {
    await getGaData(app.mongoClient);
    fnFetchTotal.mockClear();
    fnFetchCountry.mockClear();
    fnFetchActive.mockClear();
    await getGaData(app.mongoClient);
    expect(fnFetchTotal).not.toHaveBeenCalled();
    expect(fnFetchCountry).not.toHaveBeenCalled();
    expect(fnFetchActive).not.toHaveBeenCalled();
  });

  it('re-fetches after the cache expires', async () => {
    await getGaData(app.mongoClient);
    expect(fnFetchTotal).toHaveBeenCalledTimes(1);
    expect(fnFetchCountry).toHaveBeenCalledTimes(1);
    expect(fnFetchActive).toHaveBeenCalledTimes(1);

    await resetCache(app.mongoClient);

    await getGaData(app.mongoClient);
    expect(fnFetchTotal).toHaveBeenCalledTimes(2);
    expect(fnFetchCountry).toHaveBeenCalledTimes(2);
    expect(fnFetchActive).toHaveBeenCalledTimes(2);

    jest.restoreAllMocks();
  });

  it('does not re-fetch before the cache expires', async () => {
    await getGaData(app.mongoClient);
    expect(fnFetchTotal).toHaveBeenCalledTimes(1);
    expect(fnFetchCountry).toHaveBeenCalledTimes(1);
    expect(fnFetchActive).toHaveBeenCalledTimes(1);

    await getGaData(app.mongoClient);
    expect(fnFetchTotal).toHaveBeenCalledTimes(1);
    expect(fnFetchCountry).toHaveBeenCalledTimes(1);
    expect(fnFetchActive).toHaveBeenCalledTimes(1);

    jest.restoreAllMocks();
  });
});
