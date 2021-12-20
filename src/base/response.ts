import {ApiResponseCode, ApiResponseCodeUtil, BaseResponse} from '../api-def/api';
import {HttpCode} from '../utils/httpCode';


export type ApiResponseOptions = {
  httpCode?: HttpCode,
}

/**
 * Base API response class.
 */
export abstract class ApiResponse {
  code: number;
  success: boolean;
  httpCode: HttpCode;

  /**
   * Construct an API response.
   *
   * @param {ApiResponseCode} responseCode API response code
   * @param {ApiResponseOptions} options options for API response
   */
  protected constructor(responseCode: ApiResponseCode, options?: ApiResponseOptions) {
    this.code = responseCode.valueOf();
    this.success = ApiResponseCodeUtil.isSuccess(responseCode);
    this.httpCode = options?.httpCode || 200;
  }

  /**
   * Convert this response class to a response object.
   *
   * @return {BaseResponse} response object
   */
  toJson(): BaseResponse {
    return {
      code: this.code,
      success: this.success,
    };
  }
}
