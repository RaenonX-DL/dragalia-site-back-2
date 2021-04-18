import {Request, Response} from 'express';
import {MongoClient} from 'mongodb';

import {CharaAnalysisEditPayload} from '../../../../../api-def/api';
import {ApiResponse} from '../../../../../base/response';
import {handleEditPost} from '../../../base/handler/edit';
import {processEditCharaAnalysisPayload} from '../../../utils/payload/analysis';
import {AnalysisController} from '../../controller';
import {CharaAnalysisEditResponse} from './response';

export const handleEditCharacterAnalysis = async (
  req: Request, res: Response, mongoClient: MongoClient,
): Promise<ApiResponse> => {
  const payload = processEditCharaAnalysisPayload(req.query as unknown as CharaAnalysisEditPayload);

  return handleEditPost(
    mongoClient,
    payload,
    AnalysisController.editCharaAnalysis,
    (seqId) => new CharaAnalysisEditResponse({seqId}),
  );
};
