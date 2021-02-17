import {ApiResponseCode, FailedResponse} from '../../../../api-def/api';
import {ApiResponse} from '../../../../base/response';


/**
 * API response class for a failed API request.
 */
export class ApiFailedResponse extends ApiResponse {
  message?: string;

  /**
   * Construct a failed API response.
   *
   * @param {ApiResponseCode} responseCode API response code for the failed request
   * @param {string} message message about the failure
   */
  constructor(responseCode: ApiResponseCode, message?: string) {
    super(responseCode);

    this.message = message;
  }

  /**
   * @inheritDoc
   */
  toJson(): FailedResponse {
    return {
      ...super.toJson(),
      message: this.message,
    };
  }
}
