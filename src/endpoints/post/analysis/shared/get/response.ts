import {AnalysisResponse as AnalysisGetResponseApi} from '../../../../../api-def/api';
import {PostGetResponse} from '../../../base/response/post/get';
import {AnalysisResponse} from '../../base/response/types';

/**
 * API response class for getting an analysis.
 */
export class AnalysisGetResponse extends PostGetResponse {
  body: AnalysisResponse;

  /**
   * Construct an analysis get response.
   *
   * @param {boolean} isAdmin if the user is an admin
   * @param {CharaAnalysisResponse} params params for constructing an analysis get response
   */
  constructor(isAdmin: boolean, params: AnalysisResponse) {
    super(isAdmin, params);

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
