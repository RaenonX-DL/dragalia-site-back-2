import {
  ApiResponseCode,
  AnalysisLookupLandingResponse as AnalysisLookupLandingResponseApi,
  AnalysisLookupEntry,
} from '../../../../../api-def/api';
import {ApiResponse} from '../../../../../base/response';


type ConstructOptions = {
  analyses: Array<AnalysisLookupEntry>
}

/**
 * API response class for getting the info to be used upon landing on analysis lookup.
 */
export class AnalysisLookupLandingResponse extends ApiResponse {
  analyses: Array<AnalysisLookupEntry>;

  /**
   * Construct an analysis lookup landing info API response.
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
  toJson(): AnalysisLookupLandingResponseApi {
    return {
      ...super.toJson(),
      analyses: this.analyses,
    };
  }
}
