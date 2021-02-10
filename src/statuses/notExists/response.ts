import {ResponseBase} from '../../base/response';
import {ApiResponseCode} from '../../api-def/api';

/**
 * API response class for the non-existing endpoint access.
 *
 * This response does not contain anything.
 * The response code will be {@linkcode ApiResponseCode.FAILED_ENDPOINT_NOT_EXISTS}.
 */
export class NotExistsResponse extends ResponseBase {
  /**
   * Construct a non-existing endpoint API response.
   */
  constructor() {
    super(ApiResponseCode.FAILED_ENDPOINT_NOT_EXISTS, 404);
  }
}
