import {ApiResponseCode} from '../../api-def/api';
import {ApiResponse} from '../../base/response';

/**
 * API response class for the non-existing endpoint access.
 *
 * This response does not contain anything.
 * The response code will be {@linkcode ApiResponseCode.FAILED_ENDPOINT_NOT_EXISTS}.
 */
export class NotExistsResponse extends ApiResponse {
  /**
   * Construct a non-existing endpoint API response.
   */
  constructor() {
    super(ApiResponseCode.FAILED_ENDPOINT_NOT_EXISTS, {httpCode: 404});
  }
}
