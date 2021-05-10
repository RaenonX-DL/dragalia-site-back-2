import {AnalysisListPayload} from '../../../../../api-def/api';
import {processListAnalysisPayload} from '../../../../../utils/payload/post/analysis';
import {HandlerParams} from '../../../../lookup';
import {handleListPost} from '../../../base/handler/list';
import {AnalysisController} from '../../controller';
import {AnalysisListResponse} from './response';

export const handleListAnalysis = async (
  {payload, mongoClient}: HandlerParams<AnalysisListPayload>,
): Promise<AnalysisListResponse> => {
  payload = processListAnalysisPayload(payload);

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
