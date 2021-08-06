import {UnitNameRefPayload} from '../../../../api-def/api';
import {processPayloadBase} from '../../../../utils/payload/base';
import {HandlerParams} from '../../../lookup';
import {UnitNameRefController} from '../controller';
import {UnitNameRefManageResponse} from './response';


export const handleUnitNameRefManage = async ({
  payload,
  mongoClient,
}: HandlerParams<UnitNameRefPayload>): Promise<UnitNameRefManageResponse> => {
  payload = processPayloadBase(payload);

  const refEntries = await UnitNameRefController.getEntries(mongoClient, payload.lang);

  return new UnitNameRefManageResponse({refs: refEntries});
};
