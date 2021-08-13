import {
  ApiResponseCode,
  BaseResponse,
  KeyPointEntryFromBack,
  KeyPointManageResponse as KeyPointManageResponseApi,
} from '../../../../api-def/api';
import {ApiResponse} from '../../../../base/response';


type KeyPointManageResponseOptions = Omit<KeyPointManageResponseApi, keyof BaseResponse>;

/**
 * API response class for the endpoint to get the key points for managing.
 */
export class KeyPointManageResponse extends ApiResponse {
  points: Array<KeyPointEntryFromBack>;

  /**
   * Construct a key point managing endpoint API response.
   *
   * @param {KeyPointManageResponseOptions} options options to construct a key point managing response
   */
  constructor(options: KeyPointManageResponseOptions) {
    const responseCode = ApiResponseCode.SUCCESS;

    super(responseCode);

    this.points = options.points;
  }

  /**
   * @inheritDoc
   */
  toJson(): KeyPointManageResponseApi {
    return {
      ...super.toJson(),
      points: this.points,
    };
  }
}
