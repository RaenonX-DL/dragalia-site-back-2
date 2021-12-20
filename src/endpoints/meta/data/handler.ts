import {ApiResponseCode, DataPageMetaPayload} from '../../../api-def/api';
import {processDataMetaPayload} from '../../../utils/payload';
import {HandlerParams} from '../../lookup';
import {ApiFailedResponse} from '../../post/base/response/failed';
import {UserController} from '../../userControl/controller';
import {dataMetaHandlers} from './handlers';
import {DataPageMetaResponse} from './response';


export const handleDataMeta = async ({
  payload,
  mongoClient,
}: HandlerParams<DataPageMetaPayload>): Promise<DataPageMetaResponse | ApiFailedResponse> => {
  payload = processDataMetaPayload(payload);

  if (!Object.keys(dataMetaHandlers).includes(payload.type)) {
    return new ApiFailedResponse(ApiResponseCode.FAILED_UNHANDLED_DATA_TYPE);
  }

  const user = await UserController.getUserData(mongoClient, payload.uid);

  return dataMetaHandlers[payload.type]({mongoClient, payload, user});
};
