import {QuestPostGetPayload} from '../../../../api-def/api/post/quest/payload';
import {ApiResponseCode} from '../../../../api-def/api/responseCode';
import {ApiResponse} from '../../../../base/response';
import {HandlerParams} from '../../../lookup';
import {handleGetPost} from '../../base/handler/get';
import {ApiFailedResponse} from '../../base/response/failed';
import {processQuestGetPayload} from '../../utils/payload';
import {QuestPostController} from '../controller';
import {QuestPostGetSuccessResponse} from './response';

export const handleGetQuestPost = async (
  {payload, mongoClient}: HandlerParams<QuestPostGetPayload>,
): Promise<ApiResponse> => {
  payload = processQuestGetPayload(payload);

  if (!payload.seqId) {
    return new ApiFailedResponse(ApiResponseCode.FAILED_POST_ID_NOT_SPECIFIED, {httpCode: 400});
  }

  return handleGetPost(
    mongoClient,
    payload,
    QuestPostController.getQuestPost,
    (userData, getResult) => {
      return new QuestPostGetSuccessResponse(
        userData ? userData.isAdmin : false,
        userData ? !userData.isAdsFree : true,
        getResult.toResponseReady(),
      );
    },
  );
};
