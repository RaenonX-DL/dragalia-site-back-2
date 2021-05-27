import {QuestPostEditPayload} from '../../../../api-def/api';
import {ApiResponse} from '../../../../base/response';
import {processQuestEditPayload} from '../../../../utils/payload';
import {HandlerParams} from '../../../lookup';
import {handleEditSequencedPost} from '../../base/handler/edit/sequenced';
import {QuestPostController} from '../controller';
import {QuestPostEditResponse} from './response';

export const handleEditQuestPost = async (
  {payload, mongoClient}: HandlerParams<QuestPostEditPayload>,
): Promise<ApiResponse> => {
  payload = processQuestEditPayload(payload);

  return handleEditSequencedPost(
    mongoClient,
    payload,
    QuestPostController.editQuestPost,
    ({seqId}) => new QuestPostEditResponse(seqId),
  );
};
