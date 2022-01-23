import {
  ApiResponseCode,
  PostEditResponse as PostEditResponseApi,
  PostEditResult,
} from '../../../../../../api-def/api';
import {ApiResponse} from '../../../../../../base/response';


/**
 * API response class for a post edit.
 */
export abstract class PostEditResponse extends ApiResponse {
  result: PostEditResult;

  /**
   * Construct a successful post editing API response.
   *
   * @param {PostEditResult} result editing result
   */
  protected constructor(result: PostEditResult) {
    super(ApiResponseCode.SUCCESS);

    this.result = result;
  }

  /**
   * @inheritDoc
   */
  toJson(): PostEditResponseApi {
    return {
      ...super.toJson(),
      ...this.result,
    };
  }
}
