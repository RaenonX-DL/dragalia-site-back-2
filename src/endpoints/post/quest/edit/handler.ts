import {QuestPostEditPayload} from '../../../../api-def/api';
import {ApiResponse} from '../../../../base/response';
import {processQuestEditPayload} from '../../../../utils/payload';
import {HandlerParams} from '../../../lookup';
import {handleEditPost} from '../../base/handler/edit';
import {QuestPostController} from '../controller';
import {QuestPostEditSuccessResponse} from './response';

export const handleEditQuestPost = async (
  {payload, mongoClient}: HandlerParams<QuestPostEditPayload>,
): Promise<ApiResponse> => {
  payload = processQuestEditPayload(payload);

  return handleEditPost(
    mongoClient,
    payload,
    QuestPostController.editQuestPost,
    (seqId) => new QuestPostEditSuccessResponse(seqId),
  );
};
