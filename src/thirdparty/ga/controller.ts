import env from 'env-var';
import {MongoClient} from 'mongodb';

import {periodicActiveData, periodicCountryData, periodicLangData} from '../../../test/data/thirdparty/ga';
import {isCi} from '../../api-def/utils';
import {getPeriodicActiveUser} from './data/periodicActive';
import {getPeriodicCountryUser} from './data/periodicCountry';
import {getPeriodicLanguageUser} from './data/periodicTotal';
import {getCache, setCache} from './dbCache';
import {GACache} from './type';


export const getGaData = async (mongoClient: MongoClient): Promise<GACache> => {
  const currentEpoch = Math.round(Date.now() / 1000);

  const cache = await getCache(mongoClient);

  if (cache) {
    return cache;
  } else if (!isCi() && env.get('GA_DEV').asBool()) {
    return {
      data: {
        perCountry: periodicCountryData,
        perLang: periodicLangData,
        active: periodicActiveData,
      },
      lastFetchedEpoch: currentEpoch,
    };
  }

  const newCache: GACache = {
    data: {
      perCountry: await getPeriodicCountryUser(6),
      perLang: await getPeriodicLanguageUser(30, 3),
      active: await getPeriodicActiveUser(30),
    },
    lastFetchedEpoch: currentEpoch,
  };

  await setCache(mongoClient, newCache);

  return newCache;
};
