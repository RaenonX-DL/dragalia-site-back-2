import {ApiResponseCode} from '../../../../api-def/api';
import {ApiResponse} from '../../../../base/response';


/**
 * Subscription update response class.
 *
 * This always returns `ApiResponseCode.SUCCESS` if used.
 */
export class SubscriptionUpdateResponse extends ApiResponse {
  /**
   * Construct a user subscription update response class.
   */
  constructor() {
    super(ApiResponseCode.SUCCESS);
  }
}
