import {Request, Response} from 'express';
import {MongoClient} from 'mongodb';

import {DragonAnalysisEditPayload} from '../../../../../api-def/api';
import {ApiResponse} from '../../../../../base/response';
import {handleEditPost} from '../../../base/handler/edit';
import {processEditDragonAnalysisPayload} from '../../../utils/payload/analysis';
import {AnalysisController} from '../../controller';
import {DragonAnalysisEditResponse} from './response';

export const handleEditDragonAnalysis = async (
  req: Request, res: Response, mongoClient: MongoClient,
): Promise<ApiResponse> => {
  const payload = processEditDragonAnalysisPayload(req.query as unknown as DragonAnalysisEditPayload);

  return handleEditPost(
    mongoClient,
    payload,
    AnalysisController.editDragonAnalysis,
    (seqId) => new DragonAnalysisEditResponse({seqId}),
  );
};
