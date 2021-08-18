import {UnitTierNoteGetPayload} from '../../../../api-def/api';
import {processPayloadBase} from '../../../../utils/payload/base';
import {HandlerParams} from '../../../lookup';
import {TierNoteController} from '../controller';
import {UnitTierNoteGetResponse} from './response';


export const handleTierNoteGet = async ({
  payload,
  mongoClient,
}: HandlerParams<UnitTierNoteGetPayload>): Promise<UnitTierNoteGetResponse> => {
  payload = processPayloadBase(payload);

  const data = await TierNoteController.getAllTierNotes(mongoClient, payload.lang);

  return new UnitTierNoteGetResponse({data});
};
