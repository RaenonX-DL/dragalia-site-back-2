import {Request, Response} from 'express';
import {MongoClient} from 'mongodb';

import {QuestPostEditPayload} from '../../../../api-def/api';
import {ApiResponse} from '../../../../base/response';
import {handleEditPost} from '../../base/handler/edit';
import {processQuestEditPayload} from '../../utils/payload';
import {QuestPostController} from '../controller';
import {QuestPostEditSuccessResponse} from './response';

export const handleEditQuestPost = async (
  req: Request, res: Response, mongoClient: MongoClient,
): Promise<ApiResponse> => {
  const payload = processQuestEditPayload(req.query as unknown as QuestPostEditPayload);

  return handleEditPost(
    mongoClient,
    payload,
    QuestPostController.editQuestPost,
    (seqId) => new QuestPostEditSuccessResponse(seqId),
  );
};
