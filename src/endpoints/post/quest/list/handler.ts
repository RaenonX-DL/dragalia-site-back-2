import {Request, Response} from 'express';
import {MongoClient} from 'mongodb';

import {QuestPostListPayload} from '../../../../api-def/api';
import {handleListPost} from '../../base/handler/list';
import {processQuestListPayload} from '../../utils/payload';
import {QuestPostController} from '../controller';
import {QuestPostListResponse} from './response';

export const handleListQuestPost = async (
  req: Request, res: Response, mongoClient: MongoClient,
): Promise<QuestPostListResponse> => {
  const payload = processQuestListPayload(req.query as unknown as QuestPostListPayload);

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
