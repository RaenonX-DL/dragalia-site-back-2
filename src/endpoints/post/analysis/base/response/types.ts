import {CharaAnalysisContent, DragonAnalysisContent} from '../../../../../api-def/api/post/analysis/response';
import {PostGetResponseParam} from '../../../base/response/post/get';

export type CharaAnalysisResponse = PostGetResponseParam & CharaAnalysisContent

export type DragonAnalysisResponse = PostGetResponseParam & DragonAnalysisContent

export type AnalysisResponse = CharaAnalysisResponse | DragonAnalysisResponse
