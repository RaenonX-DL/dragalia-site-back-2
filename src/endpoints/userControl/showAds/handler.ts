import {ApiResponseCode, UserShowAdsPayload} from '../../../api-def/api';
import {processUserShowAdsPayload} from '../../../utils/payload/userControl';
import {HandlerParams} from '../../lookup';
import {GoogleUserController} from '../controller';
import {UserNotExistsError} from '../error';
import {UserShowAdsResponse} from './response';

export const handleUserShowAds = async (
  {payload, mongoClient}: HandlerParams<UserShowAdsPayload>,
): Promise<UserShowAdsResponse> => {
  // FIXME: To be removed after implementing page meta endpoint
  payload = processUserShowAdsPayload(payload);

  if (!payload.googleUid) {
    return new UserShowAdsResponse(true, ApiResponseCode.FAILED_EMPTY_USER_ID);
  }

  try {
    return new UserShowAdsResponse(
      await GoogleUserController.showAds(mongoClient, payload.googleUid, true),
    );
  } catch (e) {
    if (e instanceof UserNotExistsError) {
      return new UserShowAdsResponse(true, ApiResponseCode.FAILED_USER_NOT_EXISTS);
    }

    throw e;
  }
};
