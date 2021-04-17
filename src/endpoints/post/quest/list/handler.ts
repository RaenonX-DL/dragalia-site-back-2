import {Request, Response} from 'express';
import {MongoClient} from 'mongodb';

import {QuestPostListPayload} from '../../../../api-def/api';
import {GoogleUserController} from '../../../userControl/controller';
import {processQuestListPayload} from '../../utils/payload';
import {QuestPostController} from '../controller';
import {QuestPostListSuccessResponse} from './response';

export const handleListQuestPost = async (
  req: Request, res: Response, mongoClient: MongoClient,
): Promise<QuestPostListSuccessResponse> => {
  const payload = processQuestListPayload(req.query as unknown as QuestPostListPayload);

  // Get a list of posts
  const {postListEntries, totalAvailableCount} = await QuestPostController.getPostList(
    mongoClient, payload.langCode, payload.start, payload.limit,
  );

  // Get the data of the user who send this request
  const userData = await GoogleUserController.getUserData(mongoClient, payload.googleUid);

  return new QuestPostListSuccessResponse(
    userData ? userData.isAdmin : false,
    userData ? !userData.isAdsFree : true,
    postListEntries,
    payload.start,
    totalAvailableCount,
  );
};
