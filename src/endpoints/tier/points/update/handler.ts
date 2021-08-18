import {ApiResponseCode, KeyPointUpdatePayload} from '../../../../api-def/api';
import {processPayloadBase} from '../../../../utils/payload/base';
import {HandlerParams} from '../../../lookup';
import {ApiFailedResponse} from '../../../post/base/response/failed';
import {UserController} from '../../../userControl/controller';
import {KeyPointController} from '../controller';
import {DuplicatedDescriptionsError} from '../error';
import {KeyPointUpdateResponse} from './response';


export const handleTierPointsUpdate = async ({
  payload,
  mongoClient,
}: HandlerParams<KeyPointUpdatePayload>): Promise<KeyPointUpdateResponse> => {
  payload = processPayloadBase(payload);

  if (!await UserController.isAdmin(mongoClient, payload.uid)) {
    return new ApiFailedResponse(ApiResponseCode.FAILED_INSUFFICIENT_PERMISSION);
  }

  try {
    await KeyPointController.updateEntries(mongoClient, payload.lang, payload.points);
  } catch (e) {
    if (e instanceof DuplicatedDescriptionsError) {
      return new ApiFailedResponse(ApiResponseCode.FAILED_DESCRIPTION_DUPLICATED);
    } else {
      throw e;
    }
  }

  return new KeyPointUpdateResponse();
};
