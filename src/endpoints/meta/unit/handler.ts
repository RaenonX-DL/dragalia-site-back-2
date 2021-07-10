import {ApiResponseCode, UnitPageMetaPayload} from '../../../api-def/api';
import {processUnitMetaPayload} from '../../../utils/payload';
import {getUnitInfo} from '../../../utils/resources/loader/unitInfo';
import {getUnitIdByName} from '../../../utils/resources/loader/unitName2Id';
import {HandlerParams} from '../../lookup';
import {ApiFailedResponse} from '../../post/base/response/failed';
import {UserController} from '../../userControl/controller';
import {generateResponse} from '../utils';
import {UnitPageMetaResponse} from './response';


export const handleUnitMeta = async ({
  payload,
  mongoClient,
}: HandlerParams<UnitPageMetaPayload>): Promise<UnitPageMetaResponse | ApiFailedResponse> => {
  payload = processUnitMetaPayload(payload);

  const userData = await UserController.getUserData(mongoClient, payload.uid);

  let unitId: number;
  if (typeof payload.unitIdentifier === 'string') {
    const unitIdInternal = await getUnitIdByName(payload.unitIdentifier, mongoClient);
    if (!unitIdInternal) {
      return new ApiFailedResponse(ApiResponseCode.FAILED_UNIT_NOT_EXISTS);
    }
    unitId = unitIdInternal;
  } else {
    unitId = payload.unitIdentifier;
  }

  const unitInfo = await getUnitInfo(unitId);
  if (!unitInfo) {
    return new ApiFailedResponse(ApiResponseCode.FAILED_UNIT_NOT_EXISTS);
  }

  return await generateResponse(
    payload,
    mongoClient,
    userData,
    (options) => new UnitPageMetaResponse({
      ...options,
      params: {unitName: unitInfo.name[payload.lang], unitId: unitId},
    }),
  );
};
