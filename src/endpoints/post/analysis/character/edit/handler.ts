import {CharaAnalysisEditPayload} from '../../../../../api-def/api';
import {ApiResponse} from '../../../../../base/response';
import {HandlerParams} from '../../../../lookup';
import {handleEditPost} from '../../../base/handler/edit';
import {processEditCharaAnalysisPayload} from '../../../utils/payload/analysis';
import {AnalysisController} from '../../controller';
import {CharaAnalysisEditResponse} from './response';

export const handleEditCharacterAnalysis = async (
  {payload, mongoClient}: HandlerParams<CharaAnalysisEditPayload>,
): Promise<ApiResponse> => {
  payload = processEditCharaAnalysisPayload(payload);

  return handleEditPost(
    mongoClient,
    payload,
    AnalysisController.editCharaAnalysis,
    (seqId) => new CharaAnalysisEditResponse({seqId}),
  );
};
