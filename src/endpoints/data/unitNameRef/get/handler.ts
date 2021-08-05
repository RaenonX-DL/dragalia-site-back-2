import {UnitNameRefPayload} from '../../../../api-def/api';
import {processPayloadBase} from '../../../../utils/payload/base';
import {HandlerParams} from '../../../lookup';
import {UnitNameRefController} from '../controller';
import {UnitNameRefResponse} from './response';


export const handleDataUnitNameRef = async ({
  payload,
  mongoClient,
}: HandlerParams<UnitNameRefPayload>): Promise<UnitNameRefResponse> => {
  payload = processPayloadBase(payload);

  const unitNameRefs = await UnitNameRefController.getData(mongoClient, payload.lang);

  return new UnitNameRefResponse({data: unitNameRefs});
};
