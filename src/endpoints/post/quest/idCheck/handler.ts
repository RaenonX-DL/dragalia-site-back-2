import {Request, Response} from 'express';
import {MongoClient} from 'mongodb';

import {QuestPostIdCheckPayload} from '../../../../api-def/api';
import {handlePostIdCheck} from '../../base/handler/idCheck';
import {processQuestIdCheckPayload} from '../../utils/payload';
import {QuestPostController} from '../controller';
import {QuestPostIdCheckResponse} from './response';

export const handleQuestPostIdCheck = async (
  req: Request, res: Response, mongoClient: MongoClient,
): Promise<QuestPostIdCheckResponse> => {
  const payload = processQuestIdCheckPayload(req.query as unknown as QuestPostIdCheckPayload);

  return handlePostIdCheck(
    mongoClient,
    payload,
    QuestPostController.isPostIdAvailable,
    (isAdmin, isAvailable) => {
      return new QuestPostIdCheckResponse(isAdmin, isAvailable);
    },
  );
};
