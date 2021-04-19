import {ApiResponseCode, QuestPostPublishPayload} from '../../../../api-def/api';
import {ApiResponse} from '../../../../base/response';
import {HandlerParams} from '../../../lookup';
import {GoogleUserController} from '../../../userControl/controller';
import {handlePublishPost} from '../../base/handler/publish';
import {ApiFailedResponse} from '../../base/response/failed';
import {processQuestPublishPayload} from '../../utils/payload';
import {QuestPostController} from '../controller';
import {QuestPostPublishSuccessResponse} from './response';

export const handlePublishQuestPost = async (
  {payload, mongoClient}: HandlerParams<QuestPostPublishPayload>,
): Promise<ApiResponse> => {
  payload = processQuestPublishPayload(payload);

  // Check if the user has the admin privilege
  if (!await GoogleUserController.isAdmin(mongoClient, payload.googleUid)) {
    return new ApiFailedResponse(ApiResponseCode.FAILED_INSUFFICIENT_PERMISSION);
  }

  return handlePublishPost(
    mongoClient,
    payload,
    QuestPostController.publishPost,
    (seqId) => new QuestPostPublishSuccessResponse(seqId),
  );
};
