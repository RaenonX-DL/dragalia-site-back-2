import {MongoClient} from 'mongodb';

import {PostEditPayload} from '../../../../../api-def/api';
import {UpdateResult} from '../../../../../base/enum/updateResult';
import {PostEditResponse} from '../../response/post/edit/common';


export type FunctionEditPost<P extends PostEditPayload> = (
  mongoClient: MongoClient, payload: P,
) => Promise<UpdateResult>;

export type FunctionConstructResponse<P extends PostEditPayload, R extends PostEditResponse> = (payload: P) => R;
