import {BaseResponse, PostEditSuccessResponse as PostEditSuccessResponseApi} from '../../../../../api-def/api';
import {ApiResponseCode} from '../../../../../api-def/api/responseCode';
import {ApiResponse} from '../../../../../base/response';


export type PostEditSuccessResponseParam = Omit<PostEditSuccessResponseApi, keyof BaseResponse>;

/**
 * API response class for a successful post editing.
 */
export abstract class PostEditSuccessResponse extends ApiResponse {
  seqId: number;

  /**
   * Construct a successful post editing API response.
   *
   * @param {PostEditSuccessResponseParam} params parameters for constructing a successful post editing response
   * @protected
   */
  constructor(params: PostEditSuccessResponseParam) {
    super(ApiResponseCode.SUCCESS);

    this.seqId = +params.seqId;
  }

  /**
   * @inheritDoc
   */
  toJson(): PostEditSuccessResponseApi {
    return {
      ...super.toJson(),
      seqId: this.seqId,
    };
  }
}
