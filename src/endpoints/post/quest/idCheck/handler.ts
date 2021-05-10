import {QuestPostIdCheckPayload} from '../../../../api-def/api';
import {processQuestIdCheckPayload} from '../../../../utils/payload';
import {HandlerParams} from '../../../lookup';
import {handlePostIdCheck} from '../../base/handler/idCheck';
import {QuestPostController} from '../controller';
import {QuestPostIdCheckResponse} from './response';

export const handleQuestPostIdCheck = async (
  {payload, mongoClient}: HandlerParams<QuestPostIdCheckPayload>,
): Promise<QuestPostIdCheckResponse> => {
  payload = processQuestIdCheckPayload(payload);

  return handlePostIdCheck(
    mongoClient,
    payload,
    QuestPostController.isPostIdAvailable,
    (isAdmin, isAvailable) => {
      return new QuestPostIdCheckResponse(isAdmin, isAvailable);
    },
  );
};
