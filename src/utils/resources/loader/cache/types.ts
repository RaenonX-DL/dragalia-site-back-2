import {MongoClient} from 'mongodb';

import {UnitNameRefData} from '../../../../api-def/api';
import {UnitInfoMap} from '../../../../api-def/resources';
import {ResourceCache} from '../../types';


export enum CacheKey {
  UNIT_INFO,
  UNIT_NAME_2_ID,
}

export type Cache = {
  [CacheKey.UNIT_INFO]: ResourceCache<UnitInfoMap<number>>,
  [CacheKey.UNIT_NAME_2_ID]: ResourceCache<UnitNameRefData>,
}

type CacheRequireClient = {
  [CacheKey.UNIT_INFO]: false,
  [CacheKey.UNIT_NAME_2_ID]: true,
}

export type CacheRequireClientType<K extends CacheKey> = CacheRequireClient[K] extends true ? MongoClient : undefined;
