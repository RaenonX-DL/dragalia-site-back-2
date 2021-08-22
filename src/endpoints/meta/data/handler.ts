import {ApiResponseCode, DataPageMetaPayload} from '../../../api-def/api';
import {processDataMetaPayload} from '../../../utils/payload';
import {HandlerParams} from '../../lookup';
import {ApiFailedResponse} from '../../post/base/response/failed';
import {KeyPointController} from '../../tier/points/controller';
import {UserController} from '../../userControl/controller';
import {generateResponse} from '../utils';
import {DataPageMetaResponse} from './response';


export const handleDataMeta = async ({
  payload,
  mongoClient,
}: HandlerParams<DataPageMetaPayload>): Promise<DataPageMetaResponse | ApiFailedResponse> => {
  payload = processDataMetaPayload(payload);

  const userData = await UserController.getUserData(mongoClient, payload.uid);

  if (payload.type === 'tierKeyPoint') {
    const title = await KeyPointController.getDescription(mongoClient, payload.lang, payload.id);

    if (!title) {
      return new ApiFailedResponse(ApiResponseCode.FAILED_DATA_NOT_EXISTS);
    }

    return await generateResponse(
      payload,
      mongoClient,
      userData,
      (options) => new DataPageMetaResponse({...options, params: {title}}),
    );
  }

  return new ApiFailedResponse(ApiResponseCode.FAILED_UNHANDLED_DATA_TYPE);
};
