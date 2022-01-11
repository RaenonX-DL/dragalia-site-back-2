import {isCacheExpired} from '../../utils/cache/func';
import {getPeriodicActiveUser} from './data/periodicActive';
import {getPeriodicCountryUser} from './data/periodicCountry';
import {getPeriodicLanguageUser} from './data/periodicTotal';
import {GACache} from './type';


const generateNewCache = (): GACache => ({
  data: {
    perCountry: {
      D1: {countries: [], total: 0},
      D7: {countries: [], total: 0},
      D30: {countries: [], total: 0},
    },
    perLang: {
      data: [],
      toppedLang: [],
    },
    active: {
      data: [],
    },
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
      perCountry: await getPeriodicCountryUser(6),
      perLang: await getPeriodicLanguageUser(30, 3),
      active: await getPeriodicActiveUser(30),
    },
    lastFetchedEpoch: currentEpoch,
  };

  return cache;
};
