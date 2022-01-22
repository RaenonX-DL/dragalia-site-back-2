import {
  ApiResponseCode,
  BaseResponse,
  SubscriptionGetResponse as SubscriptionGetResponseApi,
  SubscriptionKey,
} from '../../../../api-def/api';
import {ApiResponse} from '../../../../base/response';


type SubscriptionGetResponseOptions = Omit<
  SubscriptionGetResponseApi,
  keyof BaseResponse | 'subscriptionKeysBase64'
> & {
  subscriptionKeys: SubscriptionKey[],
};

/**
 * Subscription get response class.
 *
 * This always returns `ApiResponseCode.SUCCESS` if used.
 */
export class SubscriptionGetResponse extends ApiResponse {
  subscriptionKeysBase64: string;

  /**
   * Construct a user subscription get response class.
   */
  constructor({subscriptionKeys}: SubscriptionGetResponseOptions) {
    super(ApiResponseCode.SUCCESS);

    this.subscriptionKeysBase64 = Buffer.from(JSON.stringify(subscriptionKeys)).toString('base64url');
  }

  /**
   * @inheritDoc
   */
  toJson(): SubscriptionGetResponseApi {
    return {
      ...super.toJson(),
      subscriptionKeysBase64: this.subscriptionKeysBase64,
    };
  }
}
