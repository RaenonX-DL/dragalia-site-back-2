import {Collection, Filter, MongoClient} from 'mongodb';

import {PostInfo, PostType, SubscriptionKey, SupportedLanguages} from '../../../../api-def/api';
import {PostDocumentBaseNoTitle} from '../model/postNoTitle';
import {PostDocumentBase} from '../model/sequencedPost';
import {PostGetResult, ResultConstructFunction} from './get';


export type GetPostOptions = {
  mongoClient: MongoClient,
  uid: string,
  lang?: SupportedLanguages,
  incCount?: boolean,
};

export type GetSequentialPostOptions = GetPostOptions & {
  seqId: number,
};

export type InternalGetPostOptions<D extends PostDocumentBaseNoTitle, T extends PostGetResult<D>> = {
  mongoClient: MongoClient,
  collection: Collection<D>,
  uid: string,
  findCondition: Filter<D>,
  resultConstructFunction: ResultConstructFunction<D, T>,
  isSubscribed: (key: SubscriptionKey, post: D) => boolean,
  lang?: SupportedLanguages,
  incCount?: boolean,
};

export type PostEntryTransformFunction<E extends PostInfo> = (post: PostDocumentBase, userSubscribed: boolean) => E;

export type ListPostOptions = {
  mongoClient: MongoClient,
  uid: string,
  lang: SupportedLanguages,
  limit?: number,
};

export type InternalListPostOptions<E extends PostInfo, D extends PostDocumentBase> = {
  mongoClient: MongoClient,
  postCollection: Collection<D>,
  postType: PostType,
  uid: string,
  lang: SupportedLanguages,
  projection?: { [K in keyof D]?: 0 | 1 },
  transformFunc: PostEntryTransformFunction<E>,
  limit?: number,
  globalSubscriptionKey: SubscriptionKey,
};
