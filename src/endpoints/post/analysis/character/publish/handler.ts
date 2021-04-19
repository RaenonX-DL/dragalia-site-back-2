import {ApiResponseCode, CharaAnalysisPublishPayload} from '../../../../../api-def/api';
import {ApiResponse} from '../../../../../base/response';
import {HandlerParams} from '../../../../lookup';
import {GoogleUserController} from '../../../../userControl/controller';
import {handlePublishPost} from '../../../base/handler/publish';
import {ApiFailedResponse} from '../../../base/response/failed';
import {processCharaAnalysisPublishPayload} from '../../../utils/payload';
import {AnalysisController} from '../../controller';
import {CharaAnalysisPublishedResponse} from './response';

export const handlePublishCharacterAnalysis = async (
  {payload, mongoClient}: HandlerParams<CharaAnalysisPublishPayload>,
): Promise<ApiResponse> => {
  payload = processCharaAnalysisPublishPayload(payload);

  // Check if the user has the admin privilege
  if (!await GoogleUserController.isAdmin(mongoClient, payload.googleUid)) {
    return new ApiFailedResponse(ApiResponseCode.FAILED_INSUFFICIENT_PERMISSION);
  }

  return handlePublishPost(
    mongoClient,
    payload,
    AnalysisController.publishCharaAnalysis,
    (seqId) => new CharaAnalysisPublishedResponse(seqId),
  );
};
