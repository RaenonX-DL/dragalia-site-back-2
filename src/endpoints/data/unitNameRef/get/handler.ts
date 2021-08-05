import {UnitNameRefPayload} from '../../../../api-def/api';
import {processPageMetaPayload} from '../../../../utils/payload/meta';
import {HandlerParams} from '../../../lookup';
import {UnitNameRefController} from '../controller';
import {UnitNameRefResponse} from './response';


export const handleDataUnitNameRef = async ({
  payload,
  mongoClient,
}: HandlerParams<UnitNameRefPayload>): Promise<UnitNameRefResponse> => {
  payload = processPageMetaPayload(payload);

  const unitNameRefs = await UnitNameRefController.getData(mongoClient, payload.lang);

  return new UnitNameRefResponse({data: unitNameRefs});
};
