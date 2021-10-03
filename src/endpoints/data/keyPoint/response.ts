import {
  ApiResponseCode,
  BaseResponse,
  KeyPointInfo,
  KeyPointInfoResponse as KeyPointInfoResponseApi,
} from '../../../api-def/api';
import {ApiResponse} from '../../../base/response';


type KeyPointInfoResponseOptions = Omit<KeyPointInfoResponseApi, keyof BaseResponse>;

/**
 * API response class for the endpoint to update the unit name references.
 *
 * Using this response class indicates that the update succeeds.
 */
export class KeyPointInfoResponse extends ApiResponse {
  info: KeyPointInfo;

  /**
   * Construct a unit name update endpoint API response.
   *
   * @param {KeyPointInfoResponseOptions} options options to construct the response
   */
  constructor(options: KeyPointInfoResponseOptions) {
    const responseCode = ApiResponseCode.SUCCESS;

    super(responseCode);

    this.info = options.info;
  }

  /**
   * @inheritDoc
   */
  toJson(): KeyPointInfoResponseApi {
    return {
      ...super.toJson(),
      info: this.info,
    };
  }
}
