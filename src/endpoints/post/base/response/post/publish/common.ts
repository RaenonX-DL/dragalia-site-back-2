import {ApiResponseCode, PostPublishResponse as PostPublishResponseApi} from '../../../../../../api-def/api';
import {ApiResponse} from '../../../../../../base/response';


/**
 * API response class for a successful post publish.
 */
export abstract class PostPublishResponse extends ApiResponse {
  /**
   * Construct a successful post publishing API response.
   */
  protected constructor() {
    super(ApiResponseCode.SUCCESS);
  }

  /**
   * @inheritDoc
   */
  toJson(): PostPublishResponseApi {
    return super.toJson();
  }
}
