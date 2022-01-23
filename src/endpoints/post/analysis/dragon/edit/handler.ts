import {DragonAnalysisEditPayload} from '../../../../../api-def/api';
import {ApiResponse} from '../../../../../base/response';
import {processEditDragonAnalysisPayload} from '../../../../../utils/payload';
import {HandlerParams} from '../../../../lookup';
import {AnalysisController} from '../../controller';
import {handleEditAnalysis} from '../../shared/edit/handler';
import {DragonAnalysisEditResponse} from './response';


export const handleEditDragonAnalysis = async (
  {payload, mongoClient}: HandlerParams<DragonAnalysisEditPayload>,
): Promise<ApiResponse> => {
  payload = processEditDragonAnalysisPayload(payload);

  return handleEditAnalysis(
    mongoClient,
    payload,
    AnalysisController.editDragonAnalysis,
    ({unitId}, result) => new DragonAnalysisEditResponse(unitId, result),
  );
};
