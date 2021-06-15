import {MongoClient} from 'mongodb';

import {PostIdCheckPayload} from '../../../../../api-def/api/post/base/payload/common';
import {PostIdCheckResponse} from '../../response/post/idCheck';
import {FunctionCheckIdAvailability, FunctionConstructResponse} from './types';


export const handlePostIdCheck = async <P extends PostIdCheckPayload, R extends PostIdCheckResponse>(
  mongoClient: MongoClient, payload: P,
  fnCheckId: FunctionCheckIdAvailability<P>, fnConstructResponse: FunctionConstructResponse<R>,
): Promise<R> => {
  // Check post ID availability
  const isAvailable = await fnCheckId(payload);

  return fnConstructResponse(isAvailable);
};
