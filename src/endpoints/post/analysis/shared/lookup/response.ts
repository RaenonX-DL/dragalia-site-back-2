import {
  ApiResponseCode,
  AnalysisLookupResponse as AnalysisLookupResponseApi,
  AnalysisLookupAnalyses,
} from '../../../../../api-def/api';
import {ApiResponse} from '../../../../../base/response';


type ConstructOptions = {
  analyses: AnalysisLookupAnalyses
}

/**
 * API response class for getting the info for analysis lookup.
 */
export class AnalysisLookupResponse extends ApiResponse {
  analyses: AnalysisLookupAnalyses

  /**
   * Construct an analysis lookup info API response.
   *
   * @param {ConstructOptions} options options to construct the response
   */
  constructor(options: ConstructOptions) {
    super(ApiResponseCode.SUCCESS);

    this.analyses = options.analyses;
  }

  /**
   * @inheritDoc
   */
  toJson(): AnalysisLookupResponseApi {
    return {
      ...super.toJson(),
      analyses: this.analyses,
    };
  }
}
