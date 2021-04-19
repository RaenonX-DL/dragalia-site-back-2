import {ApiResponseCode} from '../../api-def/api';
import {ApiResponse} from '../../base/response';

/**
 * API response class for undefined methods.
 *
 * The response does not contain anything.
 * The response code will be {@linkcode ApiResponseCode.FAILED_METHOD_NOT_ALLOWED}.
 */
export class NotExistsResponse extends ApiResponse {
  /**
   * Construct an undefined methods API response.
   */
  constructor() {
    super(ApiResponseCode.FAILED_METHOD_NOT_ALLOWED, {httpCode: 405});
  }
}
