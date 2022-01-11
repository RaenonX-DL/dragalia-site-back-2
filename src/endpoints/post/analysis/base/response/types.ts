import {
  CharaAnalysisBody,
  DragonAnalysisBody,
  PostBodyBase,
} from '../../../../../api-def/api';


export type AnalysisBodyWithInfo = PostBodyBase & (CharaAnalysisBody | DragonAnalysisBody);
