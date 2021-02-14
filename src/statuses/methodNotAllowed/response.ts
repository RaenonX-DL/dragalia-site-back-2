import {ApiResponseCode} from '../../api-def/api';
import {ResponseBase} from '../../base/response';

/**
 * API response class for undefined methods.
 *
 * This response does not contain anything.
 * The response code will be {@linkcode ApiResponseCode.FAILED_METHOD_NOT_ALLOWED}.
 */
export class NotExistsResponse extends ResponseBase {
  /**
   * Construct an undefined methods API response.
   */
  constructor() {
    super(ApiResponseCode.FAILED_METHOD_NOT_ALLOWED, 405);
  }
}
