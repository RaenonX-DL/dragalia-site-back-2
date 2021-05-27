import {QuestPostIdCheckPayload} from '../../../../api-def/api';
import {processQuestIdCheckPayload} from '../../../../utils/payload';
import {HandlerParams} from '../../../lookup';
import {handlePostIdCheck} from '../../base/handler/idCheck/main';
import {QuestPostController} from '../controller';
import {QuestPostIdCheckResponse} from './response';

export const handleQuestPostIdCheck = async (
  {payload, mongoClient}: HandlerParams<QuestPostIdCheckPayload>,
): Promise<QuestPostIdCheckResponse> => {
  payload = processQuestIdCheckPayload(payload);

  return handlePostIdCheck(
    mongoClient,
    payload,
    (payload) => QuestPostController.isPostIdAvailable(mongoClient, payload.lang, payload.seqId),
    (isAdmin, isAvailable) => {
      return new QuestPostIdCheckResponse(isAdmin, isAvailable);
    },
  );
};
