import {Request, Response} from 'express';
import {MongoClient} from 'mongodb';

import {AnalysisListPayload} from '../../../../../api-def/api';
import {handleListPost} from '../../../base/handler/list';
import {processListAnalysisPayload} from '../../../utils/payload/analysis';
import {AnalysisController} from '../../controller';
import {AnalysisListResponse} from './response';

export const handleListAnalysis = async (
  req: Request, res: Response, mongoClient: MongoClient,
): Promise<AnalysisListResponse> => {
  const payload = processListAnalysisPayload(req.query as unknown as AnalysisListPayload);

  return handleListPost(
    mongoClient,
    payload,
    AnalysisController.getAnalysisList,
    (
      userData,
      postUnits,
      startIdx,
      availableCount,
    ) => {
      return new AnalysisListResponse(
        userData ? userData.isAdmin : false,
        userData ? !userData.isAdsFree : true,
        postUnits,
        startIdx,
        availableCount,
      );
    },
  );
};
