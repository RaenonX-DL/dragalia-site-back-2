import {ApiResponseCode, UnitTierNoteUpdatePayload} from '../../../../api-def/api';
import {processTierNoteUpdatePayload} from '../../../../utils/payload/tier';
import {HandlerParams} from '../../../lookup';
import {ApiFailedResponse} from '../../../post/base/response/failed';
import {UserController} from '../../../userControl/controller';
import {TierNoteController} from '../controller';
import {UnitTierNoteUpdateResponse} from './response';


export const handleTierNoteUpdate = async ({
  payload,
  mongoClient,
}: HandlerParams<UnitTierNoteUpdatePayload>): Promise<UnitTierNoteUpdateResponse> => {
  payload = processTierNoteUpdatePayload(payload);

  if (!await UserController.isAdmin(mongoClient, payload.uid)) {
    return new ApiFailedResponse(ApiResponseCode.FAILED_INSUFFICIENT_PERMISSION);
  }

  await TierNoteController.updateUnitTierNote(mongoClient, payload.lang, payload.unitId, payload.data);

  return new UnitTierNoteUpdateResponse();
};
