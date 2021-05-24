import {MongoClient} from 'mongodb';

import {PostIdCheckPayload} from '../../../../../api-def/api/post/base/payload/common';
import {GoogleUserController} from '../../../../userControl/controller';
import {PostIdCheckResponse} from '../../response/post/idCheck';
import {FunctionCheckIdAvailability, FunctionConstructResponse} from './types';

export const handlePostIdCheck = async <P extends PostIdCheckPayload, R extends PostIdCheckResponse>(
  mongoClient: MongoClient, payload: P,
  fnCheckId: FunctionCheckIdAvailability<P>, fnConstructResponse: FunctionConstructResponse<R>,
): Promise<R> => {
  // Check the user privilege
  const isAdmin = await GoogleUserController.isAdmin(mongoClient, payload.googleUid);
  if (!isAdmin) {
    return fnConstructResponse(false, false);
  }

  // Check post ID availability
  const isAvailable = await fnCheckId(payload);

  return fnConstructResponse(isAdmin, isAvailable);
};
