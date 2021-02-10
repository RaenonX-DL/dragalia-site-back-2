import {ResponseBase} from '../../base/response';
import {ApiResponseCode} from '../../api-def/api';

/**
 * API response class for the root endpoint.
 *
 * This response does not contain anything. The response code will be {@linkcode ApiResponseCode.SUCCESS}.
 */
export class RootResponse extends ResponseBase {
  /**
   * Construct a root endpoint API response.
   */
  constructor() {
    super(ApiResponseCode.SUCCESS);
  }
}
