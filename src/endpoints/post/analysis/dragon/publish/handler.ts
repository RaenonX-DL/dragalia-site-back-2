import {ApiResponseCode, DragonAnalysisPublishPayload} from '../../../../../api-def/api';
import {ApiResponse} from '../../../../../base/response';
import {HandlerParams} from '../../../../lookup';
import {GoogleUserController} from '../../../../userControl/controller';
import {handlePublishPost} from '../../../base/handler/publish';
import {ApiFailedResponse} from '../../../base/response/failed';
import {processDragonAnalysisPublishPayload} from '../../../utils/payload';
import {AnalysisController} from '../../controller';
import {DragonAnalysisPublishedResponse} from './response';

export const handlePublishDragonAnalysis = async (
  {payload, mongoClient}: HandlerParams<DragonAnalysisPublishPayload>,
): Promise<ApiResponse> => {
  payload = processDragonAnalysisPublishPayload(payload);

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
