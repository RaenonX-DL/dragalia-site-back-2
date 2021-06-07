import {
  ApiResponseCode,
  AnalysisLookupResponse as AnalysisLookupResponseApi,
  AnalysisLookupAnalyses,
} from '../../../../../api-def/api';
import {ApiResponse} from '../../../../../base/response';
import {UserIsAdminResponse} from '../../../../userControl/base/response';

type ConstructOptions = {
  isAdmin: boolean,
  analyses: AnalysisLookupAnalyses
}

/**
 * API response class for getting the info for analysis lookup.
 */
export class AnalysisLookupResponse extends ApiResponse implements UserIsAdminResponse {
  isAdmin: boolean;

  analyses: AnalysisLookupAnalyses

  /**
   * Construct an analysis lookup info API response.
   *
   * @param {ConstructOptions} options options to construct the response
   */
  constructor(options: ConstructOptions) {
    super(ApiResponseCode.SUCCESS);

    this.isAdmin = options.isAdmin;
    this.analyses = options.analyses;
  }

  /**
   * @inheritDoc
   */
  toJson(): AnalysisLookupResponseApi {
    return {
      ...super.toJson(),
      isAdmin: this.isAdmin,
      analyses: this.analyses,
    };
  }
}
