import {ApiResponseCode, UserShowAdsResponse as UserShowAdsResponseApi} from '../../../api-def/api';
import {ApiResponse} from '../../../base/response';

/**
 * API response class for the endpoint to check if the user should have ads shown.
 */
export class UserShowAdsResponse extends ApiResponse {
  showAds: boolean;

  /**
   * Construct an user show ads check API response.
   *
   * @param {boolean} showAds if the user should have ads shown
   * @param {ApiResponseCode} responseCode API response code
   */
  constructor(showAds: boolean, responseCode: ApiResponseCode = ApiResponseCode.SUCCESS) {
    super(responseCode);

    this.showAds = showAds;
  }

  /**
   * @inheritDoc
   */
  toJson(): UserShowAdsResponseApi {
    return {
      ...super.toJson(),
      showAds: this.showAds,
    };
  }
}
