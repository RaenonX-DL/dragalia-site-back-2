import {ApiResponseCode, PostPublishSuccessResponse as PostPublishSuccessResponseApi} from '../../../../../api-def/api';
import {ApiResponse} from '../../../../../base/response';


/**
 * API response class for a successful post publishing.
 *
 * The response contains the post sequential ID.
 */
export abstract class PostPublishSuccessResponse extends ApiResponse {
  seqId: number;

  /**
   * Construct a successful post publishing API response.
   *
   * @param {number} seqId sequential ID of the newly published post
   */
  protected constructor(seqId: number) {
    super(ApiResponseCode.SUCCESS);

    this.seqId = seqId;
  }

  /**
   * @inheritDoc
   */
  toJson(): PostPublishSuccessResponseApi {
    return {
      ...super.toJson(),
      seqId: this.seqId,
    };
  }
}
