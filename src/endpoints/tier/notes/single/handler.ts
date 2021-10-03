import {UnitTierNoteEditPayload} from '../../../../api-def/api';
import {processTierNoteSinglePayload} from '../../../../utils/payload/tier';
import {HandlerParams} from '../../../lookup';
import {TierNoteController} from '../controller';
import {UnitTierNoteSingleResponse} from './response';


export const handleTierNoteSingle = async ({
  payload,
  mongoClient,
}: HandlerParams<UnitTierNoteEditPayload>): Promise<UnitTierNoteSingleResponse> => {
  payload = processTierNoteSinglePayload(payload);

  const data = await TierNoteController.getUnitTierNoteSingle(mongoClient, payload.lang, payload.unitId);

  return new UnitTierNoteSingleResponse({data});
};
