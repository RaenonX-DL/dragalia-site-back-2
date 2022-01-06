import {isCacheExpired} from '../../utils/cache/func';
import {getPeriodicCountryUser} from './data/periodicCountry';
import {getPeriodicTotalUser} from './data/periodicTotal';
import {GACache} from './type';


const generateNewCache = (): GACache => ({
  data: {
    perCountry: {
      D1: {countries: [], total: 0},
      D7: {countries: [], total: 0},
      D30: {countries: [], total: 0},
    },
    period: [],
  },
  lastFetchedEpoch: 0,
});

let cache: GACache = generateNewCache();

export const resetGaData = (): void => {
  cache = generateNewCache();
};

export const getGaData = async (): Promise<GACache> => {
  const currentEpoch = Date.now();

  if (!isCacheExpired(cache, currentEpoch)) {
    return cache;
  }

  cache = {
    data: {
      perCountry: await getPeriodicCountryUser(),
      period: await getPeriodicTotalUser(30),
    },
    lastFetchedEpoch: currentEpoch,
  };

  return cache;
};
