import {ApiResponseCode, GetAtkSkillPresetPayload} from '../../../../api-def/api';
import {HandlerParams} from '../../../lookup';
import {ApiFailedResponse} from '../../../post/base/response/failed';
import {UserController} from '../../../userControl/controller';
import {AtkSkillPresetController} from '../controller';
import {GetAtkSkillPresetResponse} from './response';


export const handleGetAtkSkillPreset = async ({
  payload,
  mongoClient,
}: HandlerParams<GetAtkSkillPresetPayload>): Promise<GetAtkSkillPresetResponse | ApiFailedResponse> => {
  if (!payload.uid) {
    return new ApiFailedResponse(ApiResponseCode.FAILED_NO_ANONYMOUS_ACCESS);
  }
  const userData = await UserController.getUserData(mongoClient, payload.uid);
  if (!userData) {
    return new ApiFailedResponse(ApiResponseCode.FAILED_USER_NOT_SIGNED_UP);
  }

  const preset = await AtkSkillPresetController.getPreset(mongoClient, payload.presetId);

  if (!preset) {
    return new ApiFailedResponse(ApiResponseCode.FAILED_PRESET_NOT_EXISTS);
  }

  return new GetAtkSkillPresetResponse({preset});
};
