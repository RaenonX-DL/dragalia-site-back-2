import {Request, Response} from 'express';
import {MongoClient} from 'mongodb';

import {ApiResponseCode, UserLoginPayload} from '../../../api-def/api';
import {ApiFailedResponse} from '../../post/base/response/failed';
import {processUserLoginPayload} from '../../post/utils/payload/userControl';
import {GoogleUserController} from '../controller';
import {UserLoginResponse} from './response';

export const handleUserLogin = async (
  req: Request, res: Response, mongoClient: MongoClient,
): Promise<UserLoginResponse | ApiFailedResponse> => {
  const payload = processUserLoginPayload(req.query as unknown as UserLoginPayload);

  if (!payload.googleUid || !payload.googleEmail) {
    return new ApiFailedResponse(ApiResponseCode.FAILED_EMPTY_LOGIN_DATA);
  }

  return new UserLoginResponse(
    await GoogleUserController.userLogin(mongoClient, payload.googleUid, payload.googleEmail),
  );
};
