import {QuestPostGetPayload, ApiResponseCode} from '../../../../api-def/api';
import {ApiResponse} from '../../../../base/response';
import {processQuestGetPayload} from '../../../../utils/payload';
import {HandlerParams} from '../../../lookup';
import {handleGetPost} from '../../base/handler/get';
import {ApiFailedResponse} from '../../base/response/failed';
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
