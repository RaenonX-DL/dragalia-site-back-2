import {MongoClient} from 'mongodb';

import {PostIdCheckPayload} from '../../../../api-def/api';
import {GoogleUserController} from '../../../userControl/controller';
import {PostIdCheckResponse} from '../response/post/idCheck';

type FunctionCheckIdAvailability = (
  mongoClient: MongoClient, lang: string, seqId?: number
) => Promise<boolean>;

type FunctionConstructResponse<R extends PostIdCheckResponse> = (
  isAdmin: boolean, isAvailable: boolean,
) => R;

export const handlePostIdCheck = async <P extends PostIdCheckPayload, R extends PostIdCheckResponse>(
  mongoClient: MongoClient, payload: P,
  fnCheckId: FunctionCheckIdAvailability, fnConstructResponse: FunctionConstructResponse<R>,
): Promise<R> => {
  // Check the user privilege
  const isAdmin = await GoogleUserController.isAdmin(mongoClient, payload.googleUid);
  if (!isAdmin) {
    return fnConstructResponse(false, false);
  }

  // Check post ID availability
  const isAvailable = await fnCheckId(mongoClient, payload.lang, payload.seqId);

  return fnConstructResponse(isAdmin, isAvailable);
};
