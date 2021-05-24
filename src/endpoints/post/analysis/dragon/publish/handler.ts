import {ApiResponseCode, DragonAnalysisPublishPayload} from '../../../../../api-def/api';
import {ApiResponse} from '../../../../../base/response';
import {processDragonAnalysisPublishPayload} from '../../../../../utils/payload';
import {PayloadKeyDeprecatedError} from '../../../../error';
import {HandlerParams} from '../../../../lookup';
import {GoogleUserController} from '../../../../userControl/controller';
import {handlePublishPost} from '../../../base/handler/publish';
import {ApiFailedResponse} from '../../../base/response/failed';
import {AnalysisController} from '../../controller';
import {DragonAnalysisPublishedResponse} from './response';

export const handlePublishDragonAnalysis = async (
  {payload, mongoClient}: HandlerParams<DragonAnalysisPublishPayload>,
): Promise<ApiResponse> => {
  try {
    payload = processDragonAnalysisPublishPayload(payload);
  } catch (e) {
    if (e instanceof PayloadKeyDeprecatedError) {
      return new ApiFailedResponse(ApiResponseCode.FAILED_PAYLOAD_KEY_DEPRECATED, {message: e.message});
    }
  }

  // Check if the user has the admin privilege
  if (!await GoogleUserController.isAdmin(mongoClient, payload.googleUid)) {
    return new ApiFailedResponse(ApiResponseCode.FAILED_INSUFFICIENT_PERMISSION);
  }

  return handlePublishPost(
    mongoClient,
    payload,
    AnalysisController.publishDragonAnalysis,
    (seqId) => new DragonAnalysisPublishedResponse(seqId),
  );
};
