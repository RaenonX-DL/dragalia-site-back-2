import {Request, Response} from 'express';
import {MongoClient} from 'mongodb';

import {ApiResponseCode, CharaAnalysisPublishPayload} from '../../../../../api-def/api';
import {ApiResponse} from '../../../../../base/response';
import {GoogleUserController} from '../../../../userControl/controller';
import {handlePublishPost} from '../../../base/handler/publish';
import {ApiFailedResponse} from '../../../base/response/failed';
import {QuestPostPublishSuccessResponse} from '../../../quest/publish/response';
import {processCharaAnalysisPublishPayload} from '../../../utils/payload';
import {AnalysisController} from '../../controller';

export const handlePublishCharacterAnalysis = async (
  req: Request, res: Response, mongoClient: MongoClient,
): Promise<ApiResponse> => {
  const payload = processCharaAnalysisPublishPayload(req.query as unknown as CharaAnalysisPublishPayload);

  // Check if the user has the admin privilege
  if (!await GoogleUserController.isAdmin(mongoClient, payload.googleUid)) {
    return new ApiFailedResponse(ApiResponseCode.FAILED_INSUFFICIENT_PERMISSION);
  }

  return handlePublishPost(
    mongoClient,
    payload,
    AnalysisController.publishCharaAnalysis,
    (seqId) => new QuestPostPublishSuccessResponse(seqId),
  );
};
