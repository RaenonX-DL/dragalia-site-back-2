import fetch from 'node-fetch';

import {CharaInfo, DragonInfo, ResourcePaths, toUnitInfoMap} from '../../../../api-def/resources';
import {UnitNameRefController} from '../../../../endpoints/data/unitNameRef/controller';
import {CACHE_LIFE_SECS} from '../../const';
import {ResourceCache} from '../../types';
import {Cache, CacheKey, CacheRequireClientType} from './types';


const generateCacheBody = <T>(lastFetchedEpoch: number, data: T): ResourceCache<T> => ({lastFetchedEpoch, data});

const generateNewCache = (): Cache => ({
  [CacheKey.UNIT_INFO]: generateCacheBody(0, new Map()),
  [CacheKey.UNIT_NAME_2_ID]: generateCacheBody(0, {}),
});

let cache: Cache = generateNewCache();

const isCacheExpired = (cacheKey: CacheKey, currentEpoch: number) => {
  return currentEpoch - cache[cacheKey].lastFetchedEpoch > CACHE_LIFE_SECS;
};

const setCache = async <K extends CacheKey>(
  epoch: number,
  mongoClient: CacheRequireClientType<K>,
): Promise<void> => {
  // Fetch unit info data if not yet fetched
  if (!cache[CacheKey.UNIT_INFO].data.size || isCacheExpired(CacheKey.UNIT_INFO, epoch)) {
    const [charaInfo, dragonInfo] = await Promise.all([
      fetch(ResourcePaths.INFO_CHARA)
        .then((response) => response.json()) as unknown as CharaInfo,
      fetch(ResourcePaths.INFO_DRAGON)
        .then((response) => response.json()) as unknown as DragonInfo,
    ]);

    cache[CacheKey.UNIT_INFO] = generateCacheBody(
      epoch,
      toUnitInfoMap(charaInfo, dragonInfo, (info) => info.id),
    );
  }

  // Get the unit name reference if `mongoClient` is specified
  if (mongoClient) {
    const unitNameRef = await UnitNameRefController.getData(mongoClient);
    // Attach official names
    cache[CacheKey.UNIT_INFO].data.forEach((value) => {
      Object.values(value.name).forEach((name) => unitNameRef[name] = value.id);
    });
    cache[CacheKey.UNIT_NAME_2_ID] = generateCacheBody(epoch, unitNameRef);
  }
};

export const resetCache = (): void => {
  cache = generateNewCache();
};

export const getCache = async <K extends CacheKey>(
  cacheKey: K,
  mongoClient: CacheRequireClientType<K>,
): Promise<Cache[K]['data']> => {
  const currentEpoch = Math.round(Date.now() / 1000);

  if (isCacheExpired(cacheKey, currentEpoch)) {
    await setCache<K>(currentEpoch, mongoClient);
  }

  return cache[cacheKey].data;
};
