import {DragonAnalysisEditPayload} from '../../../../../api-def/api';
import {ApiResponse} from '../../../../../base/response';
import {processEditDragonAnalysisPayload} from '../../../../../utils/payload/post/analysis';
import {HandlerParams} from '../../../../lookup';
import {handleEditPost} from '../../../base/handler/edit';
import {AnalysisController} from '../../controller';
import {DragonAnalysisEditResponse} from './response';

export const handleEditDragonAnalysis = async (
  {payload, mongoClient}: HandlerParams<DragonAnalysisEditPayload>,
): Promise<ApiResponse> => {
  payload = processEditDragonAnalysisPayload(payload);

  return handleEditPost(
    mongoClient,
    payload,
    AnalysisController.editDragonAnalysis,
    (seqId) => new DragonAnalysisEditResponse({seqId}),
  );
};
