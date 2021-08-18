import {ApiResponseCode} from '../../../../api-def/api';
import {ApiResponse} from '../../../../base/response';


/**
 * API response class for the endpoint to update the key point entries.
 *
 * Using this response class indicates that the update succeeds.
 */
export class KeyPointUpdateResponse extends ApiResponse {
  /**
   * Construct a key point updating endpoint API response.
   */
  constructor() {
    super(ApiResponseCode.SUCCESS);
  }
}
