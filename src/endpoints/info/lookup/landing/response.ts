import {
  ApiResponseCode,
  UnitInfoLookupLandingResponse as UnitInfoLookupLandingResponseApi,
  UnitInfoLookupEntry,
} from '../../../../api-def/api';
import {ApiResponse} from '../../../../base/response';


type ConstructOptions = {
  analyses: Array<UnitInfoLookupEntry>
}

/**
 * API response class for getting the info to be used upon landing on analysis lookup.
 */
export class UnitInfoLookupLandingResponse extends ApiResponse {
  analyses: Array<UnitInfoLookupEntry>;

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
  toJson(): UnitInfoLookupLandingResponseApi {
    return {
      ...super.toJson(),
      analyses: this.analyses,
    };
  }
}
