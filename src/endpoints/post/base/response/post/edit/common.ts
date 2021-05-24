import {
  PostEditResponse as PostEditResponseApi,
  ApiResponseCode,
} from '../../../../../../api-def/api';
import {ApiResponse} from '../../../../../../base/response';


/**
 * API response class for a post edit.
 */
export abstract class PostEditResponse extends ApiResponse {
  /**
   * Construct a post editing API response.
   *
   * @protected
   */
  protected constructor() {
    super(ApiResponseCode.SUCCESS);
  }

  /**
   * @inheritDoc
   */
  toJson(): PostEditResponseApi {
    return super.toJson();
  }
}
