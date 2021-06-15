import {ApiResponseCode, PageMetaResponse as PageMetaResponseApi} from '../../../api-def/api';
import {ApiResponse} from '../../../base/response';


type PageMetaResponseOptions = Pick<PageMetaResponseApi, 'isAdmin' | 'showAds' | 'params'>;

/**
 * API response class for getting the generic page meta endpoint.
 */
export class GenericPageMetaResponse extends ApiResponse {
  isAdmin: boolean;
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

    this.isAdmin = options.isAdmin;
    this.showAds = options.showAds;
    this.params = options.params;
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
    };
  }
}
