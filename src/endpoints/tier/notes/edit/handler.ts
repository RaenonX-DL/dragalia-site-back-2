import {UnitTierNoteEditPayload} from '../../../../api-def/api';
import {processTierNoteEditPayload} from '../../../../utils/payload/tier';
import {HandlerParams} from '../../../lookup';
import {TierNoteController} from '../controller';
import {UnitTierNoteEditResponse} from './response';


export const handleTierNoteEdit = async ({
  payload,
  mongoClient,
}: HandlerParams<UnitTierNoteEditPayload>): Promise<UnitTierNoteEditResponse> => {
  payload = processTierNoteEditPayload(payload);

  const data = await TierNoteController.getUnitTierNoteEdit(mongoClient, payload.lang, payload.unitId);

  return new UnitTierNoteEditResponse({data});
};
