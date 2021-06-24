import fetch from 'node-fetch';

import {UnitType} from '../../../api-def/api';
import {
  CharaInfo,
  DragonInfo,
  ResourcePaths,
  toUnitInfoMap,
  UnitInfoDataBase,
  UnitInfoMap,
} from '../../../api-def/resources';
import {CACHE_LIFE_SECS} from '../const';
import {ResourceCache} from '../types';

type UnitInfo = UnitInfoDataBase & {
  type: UnitType,
};

const cache: ResourceCache<UnitInfoMap<number>> = {
  lastFetchedEpoch: 0,
  data: new Map(),
};

export const resetCache = (): void => {
  cache.lastFetchedEpoch = 0;
  cache.data = new Map();
};

export const getUnitInfo = async (unitId: number): Promise<UnitInfo | undefined> => {
  const currentEpoch = Math.round(Date.now() / 1000);
  if (currentEpoch - cache.lastFetchedEpoch > CACHE_LIFE_SECS) {
    // Fetch unit info data
    const [charaInfo, dragonInfo] = await Promise.all([
      fetch(ResourcePaths.INFO_CHARA)
        .then((response) => response.json()) as unknown as CharaInfo,
      fetch(ResourcePaths.INFO_DRAGON)
        .then((response) => response.json()) as unknown as DragonInfo,
    ]);

    cache.lastFetchedEpoch = currentEpoch;
    cache.data = toUnitInfoMap(charaInfo, dragonInfo, (info) => info.id);
  }

  return cache.data.get(unitId);
};
