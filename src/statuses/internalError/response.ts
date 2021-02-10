import {ResponseBase} from '../../base/response';
import {ApiResponseCode, InternalErrorResponse as InternalErrorApiResponse} from '../../api-def/api';

/**
 * API response class for an internal error.
 *
 * This response contains the error stack. The response code will be {@linkcode ApiResponseCode.FAILED_INTERNAL_ERROR}.
 */
export class InternalErrorResponse extends ResponseBase {
  error: Error;

  /**
   * Construct an internal error API response.
   *
   * @param {Error} error the error that causes this internal error
   */
  constructor(error: Error) {
    super(ApiResponseCode.FAILED_INTERNAL_ERROR, 500);

    this.error = error;
  }

  /**
   * Convert this response class to a response object.
   *
   * @return {InternalErrorApiResponse} response object
   */
  toJson(): InternalErrorApiResponse {
    return {
      ...super.toJson(),
      stack: this.error.stack || '',
      message: this.error.message,
    };
  }
}
