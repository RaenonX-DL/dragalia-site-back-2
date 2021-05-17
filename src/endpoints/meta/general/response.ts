import {ApiResponseCode, PageMetaResponse as PageMetaResponseApi} from '../../../api-def/api';
import {ApiResponse} from '../../../base/response';
import {UserIsAdminResponse} from '../../userControl/isAdmin/response';

type PageMetaResponseOptions = Pick<PageMetaResponseApi, 'isAdmin' | 'showAds' | 'params'>;

/**
 * API response class for getting the generic page meta endpoint.
 */
export class GenericPageMetaResponse extends ApiResponse {
  isAdminResponse: UserIsAdminResponse;
  showAds: boolean;
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
    this.showAds = options.showAds;
    this.params = options.params;
  }

  /**
   * @inheritDoc
   */
  toJson(): PageMetaResponseApi {
    return {
      ...super.toJson(),
      ...this.isAdminResponse.toJson(),
      showAds: this.showAds,
      params: this.params,
    };
  }
}
