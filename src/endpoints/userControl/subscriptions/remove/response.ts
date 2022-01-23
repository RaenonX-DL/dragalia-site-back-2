import {ApiResponseCode} from '../../../../api-def/api';
import {ApiResponse} from '../../../../base/response';


/**
 * Subscription remove response class.
 *
 * This always returns `ApiResponseCode.SUCCESS` if used.
 */
export class SubscriptionRemoveResponse extends ApiResponse {
  /**
   * Construct a user subscription remove response class.
   */
  constructor() {
    super(ApiResponseCode.SUCCESS);
  }
}
