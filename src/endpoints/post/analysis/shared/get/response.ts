import {AnalysisResponse as AnalysisGetResponseApi} from '../../../../../api-def/api';
import {PostGetResponse} from '../../../base/response/post/get';
import {AnalysisBodyWithInfo} from '../../base/response/types';

/**
 * API response class for getting an analysis.
 */
export class AnalysisGetResponse extends PostGetResponse {
  body: AnalysisBodyWithInfo;

  /**
   * Construct an analysis get response.
   *
   * @param {AnalysisBodyWithInfo} params params for constructing an analysis get response
   */
  constructor(params: AnalysisBodyWithInfo) {
    super(params);

    this.body = params;
  }

  /**
   * @inheritDoc
   */
  toJson(): AnalysisGetResponseApi {
    return {
      ...super.toJson(),
      ...this.body,
    };
  }
}
