import fetch from 'node-fetch';

import {CharaInfo, DragonInfo, ResourcePaths, UnitInfoDataBase} from '../../../api-def/resources';
import {CACHE_LIFE_SECS} from '../const';
import {ResourceCache} from '../types';

const cache: ResourceCache<{ [UnitID in number]: UnitInfoDataBase }> = {
  lastFetchedEpoch: 0,
  data: {},
};

export const resetCache = (): void => {
  cache.lastFetchedEpoch = 0;
  cache.data = {};
};

export const getUnitInfo = async (unitId: number): Promise<UnitInfoDataBase | undefined> => {
  const currentEpoch = Math.round(Date.now() / 1000);
  if (currentEpoch - cache.lastFetchedEpoch > CACHE_LIFE_SECS) {
    // Fetch unit info data
    const charaData: CharaInfo = await fetch(ResourcePaths.INFO_CHARA)
      .then((response) => response.json()) as unknown as CharaInfo;
    const dragonData: DragonInfo = await fetch(ResourcePaths.INFO_DRAGON)
      .then((response) => response.json()) as unknown as DragonInfo;

    cache.lastFetchedEpoch = currentEpoch;
    cache.data = Object.fromEntries([...charaData, ...dragonData].map((data) => [data.id, data]));
  }

  return cache.data[unitId];
};
