import {ApiResponseCode, UserLoginPayload} from '../../../api-def/api';
import {processUserLoginPayload} from '../../../utils/payload';
import {HandlerParams} from '../../lookup';
import {ApiFailedResponse} from '../../post/base/response/failed';
import {UserController} from '../controller';
import {UserLoginResponse} from './response';


export const handleUserLogin = async (
  {payload, mongoClient}: HandlerParams<UserLoginPayload>,
): Promise<UserLoginResponse | ApiFailedResponse> => {
  payload = processUserLoginPayload(payload);

  if (!payload.uid || !payload.email) {
    return new ApiFailedResponse(ApiResponseCode.FAILED_EMPTY_LOGIN_DATA);
  }

  return new UserLoginResponse(
    await UserController.userLogin(mongoClient, payload.uid, payload.email),
  );
};
