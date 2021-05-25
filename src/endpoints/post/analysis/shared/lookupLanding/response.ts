import {
  ApiResponseCode,
  AnalysisLookupLandingResponse as AnalysisLookupLandingResponseApi,
  AnalysisLookupEntry,
} from '../../../../../api-def/api';
import {ApiResponse} from '../../../../../base/response';
import {UserIsAdminResponse} from '../../../../userControl/isAdmin/response';

type ConstructOptions = {
  isAdmin: boolean,
  analyses: Array<AnalysisLookupEntry>
}

/**
 * API response class for getting the info to be used upon landing on analysis lookup.
 */
export class AnalysisLookupLandingResponse extends ApiResponse implements UserIsAdminResponse {
  isAdmin: boolean;

  analyses: Array<AnalysisLookupEntry>;

  /**
   * Construct an analysis lookup landing info API response.
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
  toJson(): AnalysisLookupLandingResponseApi {
    return {
      ...super.toJson(),
      isAdmin: this.isAdmin,
      analyses: this.analyses,
    };
  }
}
