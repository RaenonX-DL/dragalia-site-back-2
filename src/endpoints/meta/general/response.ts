import {AlertEntry, ApiResponseCode, BaseResponse, PageMetaResponse as PageMetaResponseApi} from '../../../api-def/api';
import {ApiResponse} from '../../../base/response';


type PageMetaResponseOptions = Omit<PageMetaResponseApi, keyof BaseResponse>;

/**
 * API response class for generic page meta endpoint.
 */
export class GenericPageMetaResponse extends ApiResponse {
  isAdmin: boolean;
  showAds: boolean;
  params: PageMetaResponseApi['params'];
  alerts: Array<AlertEntry>;

  /**
   * Construct a page meta endpoint API response.
   *
   * @param {PageMetaResponseOptions} options options to construct a page meta response
   */
  constructor(options: PageMetaResponseOptions) {
    const responseCode = ApiResponseCode.SUCCESS;

    super(responseCode);

    this.isAdmin = options.isAdmin;
    this.showAds = options.showAds;
    this.params = options.params;
    this.alerts = options.alerts;
  }

  /**
   * @inheritDoc
   */
  toJson(): PageMetaResponseApi {
    return {
      ...super.toJson(),
      isAdmin: this.isAdmin,
      showAds: this.showAds,
      params: this.params,
      alerts: this.alerts,
    };
  }
}
