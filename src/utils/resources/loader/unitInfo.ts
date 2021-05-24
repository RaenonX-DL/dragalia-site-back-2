import fetch from 'node-fetch';

import {UnitType} from '../../../api-def/api';
import {CharaInfo, DragonInfo, ResourcePaths, UnitInfoDataBase} from '../../../api-def/resources';
import {CACHE_LIFE_SECS} from '../const';
import {ResourceCache} from '../types';

type UnitInfo = UnitInfoDataBase & {
  type: UnitType,
};

const cache: ResourceCache<{ [UnitID in number]: UnitInfo }> = {
  lastFetchedEpoch: 0,
  data: {},
};

export const resetCache = (): void => {
  cache.lastFetchedEpoch = 0;
  cache.data = {};
};

export const getUnitInfo = async (unitId: number): Promise<UnitInfo | undefined> => {
  const currentEpoch = Math.round(Date.now() / 1000);
  if (currentEpoch - cache.lastFetchedEpoch > CACHE_LIFE_SECS) {
    // Fetch unit info data
    const charaData: CharaInfo = await fetch(ResourcePaths.INFO_CHARA)
      .then((response) => response.json()) as unknown as CharaInfo;
    const dragonData: DragonInfo = await fetch(ResourcePaths.INFO_DRAGON)
      .then((response) => response.json()) as unknown as DragonInfo;

    const data: Array<UnitInfo> = [];

    data.push(...charaData.map((data) => ({...data, type: UnitType.CHARACTER})));
    data.push(...dragonData.map((data) => ({...data, type: UnitType.DRAGON})));

    cache.lastFetchedEpoch = currentEpoch;
    cache.data = Object.fromEntries(data.map((info) => [info.id, info]));
  }

  return cache.data[unitId];
};
