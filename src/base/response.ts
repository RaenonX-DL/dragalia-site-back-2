import {ApiResponseCode, ApiResponseCodeUtil, BaseResponse} from '../api-def/api';

/**
 * Base API response class.
 */
export class ResponseBase {
  code: number;
  success: boolean;
  httpCode: number;

  /**
   * Construct an API response.
   *
   * @param {ApiResponseCode} responseCode API response code
   * @param {number} httpCode http status code of the response
   */
  constructor(responseCode: ApiResponseCode, httpCode = 200) {
    this.code = responseCode.valueOf();
    this.success = ApiResponseCodeUtil.isSuccess(responseCode);
    this.httpCode = httpCode;
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
