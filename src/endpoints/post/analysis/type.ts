import {PostPublishResult} from '../../../api-def/api';


export type AnalysisPublishResult = PostPublishResult & {
  unitId: number,
};
