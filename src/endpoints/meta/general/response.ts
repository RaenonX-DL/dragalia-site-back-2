import {ApiResponseCode, PageMetaResponse as PageMetaResponseApi} from '../../../api-def/api';
import {ApiResponse} from '../../../base/response';
import {UserIsAdminResponse} from '../../userControl/isAdmin/response';
import {UserShowAdsResponse} from '../../userControl/showAds/response';

type PageMetaResponseOptions = Pick<PageMetaResponseApi, 'isAdmin' | 'showAds' | 'params'>;

/**
 * API response class for getting the generic page meta endpoint.
 */
export class GenericPageMetaResponse extends ApiResponse {
  isAdminResponse: UserIsAdminResponse;
  showAdsResponse: UserShowAdsResponse;
  params: { [key in string]: string };

  /**
   * Construct a page meta endpoint API response.
   *
   * @param {PageMetaResponseOptions} options options to construct a page meta response
   */
  constructor(options: PageMetaResponseOptions) {
    const responseCode = ApiResponseCode.SUCCESS;

    super(responseCode);

    this.isAdminResponse = new UserIsAdminResponse(options.isAdmin, responseCode);
    this.showAdsResponse = new UserShowAdsResponse(options.showAds, responseCode);
    this.params = options.params;
  }

  /**
   * @inheritDoc
   */
  toJson(): PageMetaResponseApi {
    return {
      ...super.toJson(),
      ...this.isAdminResponse.toJson(),
      ...this.showAdsResponse.toJson(),
      params: this.params,
    };
  }
}
