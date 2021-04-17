import {AnalysisResponse as AnalysisResponseApi} from '../../../../../api-def/api';
import {PostGetSuccessResponse} from '../../../base/response/post/get';
import {AnalysisResponse} from '../../base/response';

/**
 * API response class for getting an analysis.
 */
export class AnalysisGetSuccessResponse extends PostGetSuccessResponse {
  body: AnalysisResponse;

  /**
   * Construct a successful analysis get response.
   *
   * @param {boolean} isAdmin if the user is an admin
   * @param {boolean} showAds if the user should have ads shown
   * @param {CharaAnalysisResponse} params params for constructing an analysis get response
   */
  constructor(isAdmin: boolean, showAds: boolean, params: AnalysisResponse) {
    super(isAdmin, showAds, params);

    this.body = params;
  }

  /**
   * @inheritDoc
   */
  toJson(): AnalysisResponseApi {
    return {
      ...super.toJson(),
      ...this.body,
    };
  }
}
