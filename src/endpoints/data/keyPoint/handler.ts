import {ApiResponseCode, KeyPointInfoPayload} from '../../../api-def/api';
import {processKeyPointInfoPayload} from '../../../utils/payload/data';
import {HandlerParams} from '../../lookup';
import {ApiFailedResponse} from '../../post/base/response/failed';
import {KeyPointController} from '../../tier/points/controller';
import {KeyPointInfoResponse} from './response';


export const handleGetKeyPointData = async ({
  payload,
  mongoClient,
}: HandlerParams<KeyPointInfoPayload>): Promise<KeyPointInfoResponse | ApiFailedResponse> => {
  payload = processKeyPointInfoPayload(payload);

  const [entry, linkedUnits] = await Promise.all([
    KeyPointController.getEntry(mongoClient, payload.id),
    KeyPointController.getReferencedUnitIds(mongoClient, payload.id),
  ]);

  if (!entry) {
    return new ApiFailedResponse(ApiResponseCode.FAILED_DATA_NOT_EXISTS);
  }

  return new KeyPointInfoResponse({info: {entry: entry.toEntry(payload.lang), linkedUnits}});
};
