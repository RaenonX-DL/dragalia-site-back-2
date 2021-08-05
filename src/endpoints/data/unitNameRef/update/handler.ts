import {ApiResponseCode, UnitNameRefUpdatePayload} from '../../../../api-def/api';
import {processUnitNameRefUpdatePayload} from '../../../../utils/payload/data';
import {HandlerParams} from '../../../lookup';
import {UnitNameRefController} from '../controller';
import {DuplicatedNamesError} from '../error';
import {UnitNameRefUpdateResponse} from './response';


export const handleUnitNameRefUpdate = async ({
  payload,
  mongoClient,
}: HandlerParams<UnitNameRefUpdatePayload>): Promise<UnitNameRefUpdateResponse> => {
  payload = processUnitNameRefUpdatePayload(payload);

  try {
    await UnitNameRefController.updateRefs(mongoClient, payload.lang, payload.refs);
  } catch (e) {
    if (e instanceof DuplicatedNamesError) {
      return new UnitNameRefUpdateResponse({code: ApiResponseCode.FAILED_UNIT_NAME_DUPLICATED});
    } else {
      throw e;
    }
  }

  return new UnitNameRefUpdateResponse({code: ApiResponseCode.SUCCESS});
};
