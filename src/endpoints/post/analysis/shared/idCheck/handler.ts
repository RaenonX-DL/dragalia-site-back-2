import {Request, Response} from 'express';
import {MongoClient} from 'mongodb';

import {AnalysisIdCheckPayload} from '../../../../../api-def/api';
import {handlePostIdCheck} from '../../../base/handler/idCheck';
import {processAnalysisIdCheckPayload} from '../../../utils/payload/analysis';
import {AnalysisController} from '../../controller';
import {AnalysisIdCheckResponse} from './response';

export const handleAnalysisIdCheck = async (
  req: Request, res: Response, mongoClient: MongoClient,
): Promise<AnalysisIdCheckResponse> => {
  const payload = processAnalysisIdCheckPayload(req.query as unknown as AnalysisIdCheckPayload);

  return handlePostIdCheck(
    mongoClient,
    payload,
    AnalysisController.isAnalysisIdAvailable,
    (isAdmin, isAvailable) => {
      return new AnalysisIdCheckResponse(isAdmin, isAvailable);
    },
  );
};
