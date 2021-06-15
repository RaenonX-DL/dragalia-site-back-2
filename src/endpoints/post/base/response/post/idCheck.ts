import {ApiResponseCode, PostIdCheckResponse as PostIdCheckResponseApi} from '../../../../../api-def/api';
import {ApiResponse} from '../../../../../base/response';


/**
 * API response class for the result of a post ID check.
 *
 * Note that ``available`` in the response means that a new post can be created.
 * If that ID (Sequential ID + lang) is not available, it could be either skipping ID,
 * or a post has already existed.
 */
export abstract class PostIdCheckResponse extends ApiResponse {
  isAvailable: boolean;

  /**
   * Construct a successful post ID check API response.
   *
   * @param {boolean} isAvailable if the post identity (Sequential ID & language) is available
   * @protected
   */
  constructor(isAvailable: boolean) {
    super(ApiResponseCode.SUCCESS);

    this.isAvailable = isAvailable;
  }

  /**
   * @inheritDoc
   */
  toJson(): PostIdCheckResponseApi {
    return {
      ...super.toJson(),
      available: this.isAvailable,
    };
  }
}
