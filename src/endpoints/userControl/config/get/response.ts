import {
  ApiResponseCode,
  BaseResponse,
  UserConfigGetResponse as UserConfigGetResponseApi,
  SubscriptionKey,
} from '../../../../api-def/api';
import {ApiResponse} from '../../../../base/response';


type UserConfigGetResponseOptions = Omit<
  UserConfigGetResponseApi,
  keyof BaseResponse | 'subscriptionKeysBase64'
> & {
  subscriptionKeys: SubscriptionKey[],
};

/**
 * User config get response class.
 *
 * This always returns `ApiResponseCode.SUCCESS` if used.
 */
export class UserConfigGetResponse extends ApiResponse {
  subscriptionKeysBase64: string;

  /**
   * Construct a user config get response class.
   */
  constructor({subscriptionKeys}: UserConfigGetResponseOptions) {
    super(ApiResponseCode.SUCCESS);

    this.subscriptionKeysBase64 = Buffer.from(JSON.stringify(subscriptionKeys)).toString('base64url');
  }

  /**
   * @inheritDoc
   */
  toJson(): UserConfigGetResponseApi {
    return {
      ...super.toJson(),
      subscriptionKeysBase64: this.subscriptionKeysBase64,
    };
  }
}
