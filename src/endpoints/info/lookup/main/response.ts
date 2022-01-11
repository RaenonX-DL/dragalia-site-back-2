import {
  ApiResponseCode,
  UnitInfoLookupResponse as UnitInfoLookupResponseApi,
  UnitInfoLookupAnalyses,
} from '../../../../api-def/api';
import {ApiResponse} from '../../../../base/response';


type ConstructOptions = {
  analyses: UnitInfoLookupAnalyses
};

/**
 * API response class for getting the info for analysis lookup.
 */
export class UnitInfoLookupResponse extends ApiResponse {
  analyses: UnitInfoLookupAnalyses;

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
  toJson(): UnitInfoLookupResponseApi {
    return {
      ...super.toJson(),
      analyses: this.analyses,
    };
  }
}
