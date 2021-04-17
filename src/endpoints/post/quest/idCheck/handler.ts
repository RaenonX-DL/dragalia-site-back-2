import {Request, Response} from 'express';
import {MongoClient} from 'mongodb';
import {QuestPostIdCheckPayload} from '../../../../api-def/api';
import {GoogleUserController} from '../../../userControl/controller';
import {processQuestIdCheckPayload} from '../../utils/payload';
import {QuestPostController} from '../controller';
import {QuestPostIdCheckResponse} from './response';

export const handleQuestPostIdCheck = async (
  req: Request, res: Response, mongoClient: MongoClient,
): Promise<QuestPostIdCheckResponse> => {
  const payload = processQuestIdCheckPayload(req.query as unknown as QuestPostIdCheckPayload);

  // Check the user privilege
  const isAdmin = await GoogleUserController.isAdmin(mongoClient, payload.googleUid);
  if (!isAdmin) {
    return new QuestPostIdCheckResponse(false, false);
  }

  // Check post ID availability
  const isAvailable = await QuestPostController.isPostIdAvailable(
    mongoClient, payload.lang, payload.seqId,
  );

  return new QuestPostIdCheckResponse(isAdmin, isAvailable);
};
