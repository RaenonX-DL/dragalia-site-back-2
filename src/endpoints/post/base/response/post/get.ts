import {
  BaseResponse,
  PostBodyBase,
  PostGetResponse as PostGetResponseApi,
  ApiResponseCode,
  UserIsAdminResponse,
} from '../../../../../api-def/api';
import {ApiResponse} from '../../../../../base/response';


export type PostGetResponseParam = Omit<PostGetResponseApi, keyof BaseResponse | keyof UserIsAdminResponse>;

/**
 * API response class for getting a post.
 *
 * Note that the post view count in this response does **not** count in this request.
 * The view count will be updated in the database,
 * but not included in the view count calculation of this get response.
 */
export abstract class PostGetResponse extends ApiResponse {
  isAdmin: boolean;

  params: PostBodyBase;

  /**
   * Construct a successful post getting API response.
   *
   * @param {boolean} isAdmin if the user is an admin
   * @param {PostBodyBase} params parameters for constructing a successful post getting response
   * @protected
   */
  protected constructor(isAdmin: boolean, params: PostBodyBase) {
    super(ApiResponseCode.SUCCESS);

    this.isAdmin = isAdmin;

    this.params = params;
  }

  /**
   * @inheritDoc
   */
  toJson(): PostGetResponseApi {
    return {
      ...super.toJson(),
      isAdmin: this.isAdmin,
      ...this.params,
    };
  }
}
