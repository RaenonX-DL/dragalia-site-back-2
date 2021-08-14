import {
  ApiResponseCode,
  BaseResponse,
  KeyPointData,
  KeyPointGetResponse as KeyPointGetResponseApi,
} from '../../../../api-def/api';
import {ApiResponse} from '../../../../base/response';


type KeyPointGetResponseOptions = Omit<KeyPointGetResponseApi, keyof BaseResponse>;

/**
 * API response class for the endpoint to get the key points data.
 */
export class KeyPointGetResponse extends ApiResponse {
  data: KeyPointData;

  /**
   * Construct a key point data obtaining endpoint API response.
   *
   * @param {KeyPointManageResponseOptions} options options to construct a key point data obtaining response
   */
  constructor(options: KeyPointGetResponseOptions) {
    const responseCode = ApiResponseCode.SUCCESS;

    super(responseCode);

    this.data = options.data;
  }

  /**
   * @inheritDoc
   */
  toJson(): KeyPointGetResponseApi {
    return {
      ...super.toJson(),
      data: this.data,
    };
  }
}
