import {PostPublishResult} from '../../../api-def/api';
import {GetPostOptions} from '../base/controller/type';


export type AnalysisPublishResult = PostPublishResult & {
  unitId: number,
};

export type GetAnalysisOptions = GetPostOptions & {
  unitIdentifier: string | number,
};
