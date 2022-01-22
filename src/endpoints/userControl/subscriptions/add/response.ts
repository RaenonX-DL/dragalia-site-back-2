import {ApiResponseCode} from '../../../../api-def/api';
import {ApiResponse} from '../../../../base/response';


/**
 * Subscription add response class.
 *
 * This always returns `ApiResponseCode.SUCCESS` if used.
 */
export class SubscriptionAddResponse extends ApiResponse {
  /**
   * Construct a user subscription add response class.
   */
  constructor() {
    super(ApiResponseCode.SUCCESS);
  }
}
