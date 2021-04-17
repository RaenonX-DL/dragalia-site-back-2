import {CharacterAnalysisGetContent, DragonAnalysisGetContent} from '../../../../api-def/api';
import {PostGetSuccessResponseParam} from '../../base/response/post/get';


export type CharaAnalysisResponse = PostGetSuccessResponseParam & CharacterAnalysisGetContent

export type DragonAnalysisResponse = PostGetSuccessResponseParam & DragonAnalysisGetContent

export type AnalysisResponse = CharaAnalysisResponse | DragonAnalysisResponse
