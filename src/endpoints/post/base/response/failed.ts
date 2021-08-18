import {ApiResponseCode, FailedResponse} from '../../../../api-def/api';
import {ApiResponse, ApiResponseOptions} from '../../../../base/response';


type ApiFailedResponseOptions = ApiResponseOptions & {
  message?: string,
}

/**
 * API response class for a failed API request.
 */
export class ApiFailedResponse extends ApiResponse {
  message?: string;

  /**
   * Construct a failed API response.
   *
   * @param {ApiResponseCode} responseCode API response code for the failed request
   * @param {ApiFailedResponseOptions} options options of the api failed response
   */
  constructor(responseCode: ApiResponseCode, options: ApiFailedResponseOptions = {}) {
    if (responseCode === ApiResponseCode.FAILED_INSUFFICIENT_PERMISSION) {
      options.httpCode = 403;
    }

    super(responseCode, {httpCode: options.httpCode});

    this.message = options.message || ApiResponseCode[responseCode];
  }

  /**
   * @inheritDoc
   */
  toJson(): FailedResponse {
    return {
      ...super.toJson(),
      success: false,
      message: this.message,
    };
  }
}
