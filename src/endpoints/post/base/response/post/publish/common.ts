import {
  ApiResponseCode,
  PostPublishResponse as PostPublishResponseApi,
  PostPublishResult,
} from '../../../../../../api-def/api';
import {ApiResponse} from '../../../../../../base/response';


/**
 * API response class for a successful post publish.
 */
export abstract class PostPublishResponse extends ApiResponse {
  result: PostPublishResult;

  /**
   * Construct a successful post publishing API response.
   *
   * @param {PostPublishResult} result publishing result
   */
  protected constructor(result: PostPublishResult) {
    super(ApiResponseCode.SUCCESS);

    this.result = result;
  }

  /**
   * @inheritDoc
   */
  toJson(): PostPublishResponseApi {
    return {
      ...super.toJson(),
      ...this.result,
    };
  }
}
