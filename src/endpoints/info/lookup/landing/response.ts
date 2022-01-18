import {
  ApiResponseCode,
  UnitInfoLookupLandingResponse as UnitInfoLookupLandingResponseApi,
  UnitInfoLookupEntry,
  BaseResponse,
} from '../../../../api-def/api';
import {ApiResponse} from '../../../../base/response';


type UnitInfoLookupLandingResponseOptions = Omit<UnitInfoLookupLandingResponseApi, keyof BaseResponse>;

/**
 * API response class for getting the info to be used upon landing on analysis lookup.
 */
export class UnitInfoLookupLandingResponse extends ApiResponse {
  analyses: Array<UnitInfoLookupEntry>;
  userSubscribed: boolean;

  /**
   * Construct an analysis lookup landing info API response.
   *
   * @param {UnitInfoLookupLandingResponseOptions} options options to construct the response
   */
  constructor({analyses, userSubscribed}: UnitInfoLookupLandingResponseOptions) {
    super(ApiResponseCode.SUCCESS);

    this.analyses = analyses;
    this.userSubscribed = userSubscribed;
  }

  /**
   * @inheritDoc
   */
  toJson(): UnitInfoLookupLandingResponseApi {
    return {
      ...super.toJson(),
      analyses: this.analyses,
      userSubscribed: this.userSubscribed,
    };
  }
}
