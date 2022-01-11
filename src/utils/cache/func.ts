import {CACHE_LIFE_SECS} from './const';
import {ResourceCache} from './types';


export const isCacheExpired = (cacheElement: ResourceCache<any>, currentEpoch: number): boolean => {
  return currentEpoch - cacheElement.lastFetchedEpoch > CACHE_LIFE_SECS;
};

export const generateCacheBody = <T>(lastFetchedEpoch: number, data: T): ResourceCache<T> => ({lastFetchedEpoch, data});
