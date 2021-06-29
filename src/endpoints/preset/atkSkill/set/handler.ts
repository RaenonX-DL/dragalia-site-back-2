import {ApiResponseCode, SetAtkSkillPresetPayload} from '../../../../api-def/api';
import {HandlerParams} from '../../../lookup';
import {ApiFailedResponse} from '../../../post/base/response/failed';
import {UserController} from '../../../userControl/controller';
import {AtkSkillPresetController} from '../controller';
import {SetAtkSkillPresetResponse} from './response';


export const handleSetAtkSkillPreset = async ({
  payload,
  mongoClient,
}: HandlerParams<SetAtkSkillPresetPayload>): Promise<SetAtkSkillPresetResponse | ApiFailedResponse> => {
  if (!payload.uid) {
    return new ApiFailedResponse(ApiResponseCode.FAILED_NO_ANONYMOUS_ACCESS);
  }
  const userData = await UserController.getUserData(mongoClient, payload.uid);
  if (!userData) {
    return new ApiFailedResponse(ApiResponseCode.FAILED_USER_NOT_SIGNED_UP);
  }

  const presetId = await AtkSkillPresetController.makePreset(mongoClient, payload.preset);

  return new SetAtkSkillPresetResponse({presetId});
};
