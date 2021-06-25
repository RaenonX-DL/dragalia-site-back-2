import {UnitInfoData} from '../../../api-def/resources';
import {getCache} from './cache/main';
import {CacheKey} from './cache/types';


export const getUnitInfo = async (unitId: number): Promise<UnitInfoData | undefined> => {
  const unitInfoMap = await getCache(CacheKey.UNIT_INFO, undefined);

  return unitInfoMap.get(unitId);
};
