import {MongoClient} from 'mongodb';

import {getCache} from './cache/main';
import {CacheKey} from './cache/types';


export const getUnitIdByName = async (unitName: string, mongoClient: MongoClient): Promise<number | undefined> => {
  const unitNameIdRefMap = await getCache(CacheKey.UNIT_NAME_2_ID, mongoClient);

  return unitNameIdRefMap[unitName];
};
