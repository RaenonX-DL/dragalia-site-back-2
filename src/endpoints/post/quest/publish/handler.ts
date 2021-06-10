import {ApiResponseCode, QuestPostPublishPayload} from '../../../../api-def/api';
import {ApiResponse} from '../../../../base/response';
import {processQuestPublishPayload} from '../../../../utils/payload';
import {HandlerParams} from '../../../lookup';
import {UserController} from '../../../userControl/controller';
import {handlePublishPost} from '../../base/handler/publish';
import {ApiFailedResponse} from '../../base/response/failed';
import {QuestPostController} from '../controller';
import {QuestPostPublishResponse} from './response';

export const handlePublishQuestPost = async (
  {payload, mongoClient}: HandlerParams<QuestPostPublishPayload>,
): Promise<ApiResponse> => {
  payload = processQuestPublishPayload(payload);

  // Check if the user has the admin privilege
  if (!await UserController.isAdmin(mongoClient, payload.uid)) {
    return new ApiFailedResponse(ApiResponseCode.FAILED_INSUFFICIENT_PERMISSION);
  }

  return handlePublishPost(
    mongoClient,
    payload,
    QuestPostController.publishPost,
    (seqId) => new QuestPostPublishResponse(seqId),
  );
};
