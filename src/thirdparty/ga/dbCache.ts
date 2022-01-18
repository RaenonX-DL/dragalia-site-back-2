import {Collection, MongoClient} from 'mongodb';

import {CollectionInfo} from '../../base/controller/info';
import {CACHE_LIFE_SECS} from '../../utils/cache/const';
import {getCollection} from '../../utils/mongodb';
import {GACache} from './type';


const dbInfo: CollectionInfo = {
  dbName: 'cache',
  collectionName: 'ga',
};

export enum GACacheKey {
  data = 'd',
  generationTimestamp = 'g'
}

export type GACacheDocument = {
  [GACacheKey.data]: GACache,
  [GACacheKey.generationTimestamp]: Date,
};

const getCacheCollection = (mongoClient: MongoClient): Collection<GACacheDocument> => {
  return getCollection<GACacheDocument>(mongoClient, dbInfo, (collection) => {
    // Enable data auto-expiration
    collection.createIndex(
      GACacheKey.generationTimestamp,
      {expireAfterSeconds: CACHE_LIFE_SECS},
      // Empty function to avoid `createdIndex` returning promise
      // https://github.com/nodkz/mongodb-memory-server/issues/598#issuecomment-1015311729
      () => void 0,
    );
  });
};

export const getCache = async (mongoClient: MongoClient): Promise<GACache | null> => {
  const collection = getCacheCollection(mongoClient);

  const cacheEntry = await collection.findOne();

  if (!cacheEntry) {
    return null;
  }

  return cacheEntry[GACacheKey.data];
};

export const setCache = async (mongoClient: MongoClient, data: GACache): Promise<void> => {
  const collection = getCacheCollection(mongoClient);

  await collection.insertOne({
    [GACacheKey.data]: data,
    [GACacheKey.generationTimestamp]: new Date(),
  });
};

export const resetCache = async (mongoClient: MongoClient): Promise<void> => {
  const collection = getCacheCollection(mongoClient);

  await collection.deleteMany({});
};
