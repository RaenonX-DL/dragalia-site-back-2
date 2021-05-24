import {ApiResponseCode, UserIsAdminPayload} from '../../../api-def/api';
import {processUserIsAdminPayload} from '../../../utils/payload';
import {HandlerParams} from '../../lookup';
import {GoogleUserController} from '../controller';
import {UserNotExistsError} from '../error';
import {UserIsAdminResponse} from './response';

export const handleUserIsAdmin = async (
  {payload, mongoClient}: HandlerParams<UserIsAdminPayload>,
): Promise<UserIsAdminResponse> => {
  payload = processUserIsAdminPayload(payload);

  if (!payload.googleUid) {
    return new UserIsAdminResponse(false, ApiResponseCode.FAILED_EMPTY_USER_ID);
  }

  try {
    return new UserIsAdminResponse(
      await GoogleUserController.isAdmin(mongoClient, payload.googleUid, true),
    );
  } catch (e) {
    if (e instanceof UserNotExistsError) {
      return new UserIsAdminResponse(false, ApiResponseCode.FAILED_USER_NOT_EXISTS);
    }

    throw e;
  }
};
