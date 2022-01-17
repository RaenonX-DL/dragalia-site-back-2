import {MongoClient} from 'mongodb';

import {DataPageMetaPayload} from '../../../api-def/api';
import {ApiFailedResponse} from '../../post/base/response/failed';
import {User} from '../../userControl/model';
import {DataPageMetaResponse} from './response';


export type DataMetaHandlerOptions = {
  payload: DataPageMetaPayload,
  mongoClient: MongoClient,
  user: User | null,
};

export type DataMetaHandler = (
  options: DataMetaHandlerOptions
) => Promise<DataPageMetaResponse | ApiFailedResponse>;
