import {CharaAnalysisEditPayload} from '../../../../../api-def/api';
import {ApiResponse} from '../../../../../base/response';
import {processEditCharaAnalysisPayload} from '../../../../../utils/payload';
import {HandlerParams} from '../../../../lookup';
import {AnalysisController} from '../../controller';
import {handleEditAnalysis} from '../../handler';
import {CharaAnalysisEditResponse} from './response';

export const handleEditCharacterAnalysis = async (
  {payload, mongoClient}: HandlerParams<CharaAnalysisEditPayload>,
): Promise<ApiResponse> => {
  payload = processEditCharaAnalysisPayload(payload);

  return handleEditAnalysis(
    mongoClient,
    payload,
    AnalysisController.editCharaAnalysis,
    ({unitId}) => new CharaAnalysisEditResponse(unitId),
  );
};
