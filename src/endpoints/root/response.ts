import {ApiResponseCode} from '../../api-def/api';
import {ApiResponse} from '../../base/response';

/**
 * API response class for the root endpoint.
 *
 * The response does not contain anything. The response code will be {@linkcode ApiResponseCode.SUCCESS}.
 */
export class RootResponse extends ApiResponse {
  /**
   * Construct a root endpoint API response.
   */
  constructor() {
    super(ApiResponseCode.SUCCESS);
  }
}
