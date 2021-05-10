import {QuestPostListPayload} from '../../../../api-def/api';
import {processQuestListPayload} from '../../../../utils/payload';
import {HandlerParams} from '../../../lookup';
import {handleListPost} from '../../base/handler/list';
import {QuestPostController} from '../controller';
import {QuestPostListResponse} from './response';

export const handleListQuestPost = async (
  {payload, mongoClient}: HandlerParams<QuestPostListPayload>,
): Promise<QuestPostListResponse> => {
  payload = processQuestListPayload(payload);

  return handleListPost(
    mongoClient,
    payload,
    QuestPostController.getPostList,
    (
      userData,
      postUnits,
      startIdx,
      availableCount,
    ) => {
      return new QuestPostListResponse(
        userData ? userData.isAdmin : false,
        userData ? !userData.isAdsFree : true,
        postUnits,
        startIdx,
        availableCount,
      );
    },
  );
};
