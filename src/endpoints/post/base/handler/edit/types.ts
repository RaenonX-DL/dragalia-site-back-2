import {MongoClient} from 'mongodb';

import {PostEditPayload} from '../../../../../api-def/api';
import {PostEditResponse} from '../../response/post/edit/common';
import {PostEditResultCommon} from '../../type';


export type FunctionEditPost<P extends PostEditPayload, T extends PostEditResultCommon> = (
  mongoClient: MongoClient, payload: P,
) => Promise<T>;

export type FunctionConstructResponse<
  P extends PostEditPayload,
  R extends PostEditResponse,
  T extends PostEditResultCommon
> = (
  payload: P, result: T,
) => R;
