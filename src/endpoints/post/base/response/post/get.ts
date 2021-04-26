import {
  BaseResponse,
  PostGetSuccessResponse as PostGetSuccessResponseApi,
  ApiResponseCode} from '../../../../../api-def/api';
import {ApiResponse} from '../../../../../base/response';


export type PostGetSuccessResponseParam = Omit<PostGetSuccessResponseApi, keyof BaseResponse | 'isAdmin' | 'showAds'>;


/**
 * API response class for a successful post getting.
 *
 * Note that the post view count in this response does **not** count in this request.
 * The view count will be updated in the database,
 * but not included in the view count calculation of this get response.
 */
export abstract class PostGetSuccessResponse extends ApiResponse {
  isAdmin: boolean;
  showAds: boolean;

  params: PostGetSuccessResponseParam;

  /**
   * Construct a successful post getting API response.
   *
   * @param {boolean} isAdmin if the user is an admin
   * @param {boolean} showAds if the user should have ads shown
   * @param {PostGetSuccessResponseParam} params parameters for constructing a successful post getting response
   * @protected
   */
  protected constructor(isAdmin: boolean, showAds: boolean, params: PostGetSuccessResponseParam) {
    super(ApiResponseCode.SUCCESS);

    this.isAdmin = isAdmin;
    this.showAds = showAds;

    this.params = params;
  }

  /**
   * @inheritDoc
   */
  toJson(): PostGetSuccessResponseApi {
    return {
      ...super.toJson(),
      isAdmin: this.isAdmin,
      showAds: this.showAds,
      ...this.params,
    };
  }
}
