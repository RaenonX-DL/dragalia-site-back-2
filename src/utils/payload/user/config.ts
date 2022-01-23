import {RequestPayloadBase, SubscriptionKey, UserConfigApi} from '../../../api-def/api';
import {processPayloadBase} from '../base';


type ProcessedUserConfigApi = RequestPayloadBase & Omit<UserConfigApi, 'subscriptionKeysBase64'> & {
  subscriptionKeys: SubscriptionKey[],
};

export const processUserConfigApi = <T extends RequestPayloadBase & UserConfigApi>(
  payload: T,
): ProcessedUserConfigApi => {
  const processedPayload = processPayloadBase(payload);

  return {
    ...processedPayload,
    subscriptionKeys: JSON.parse(
      Buffer.from(processedPayload.subscriptionKeysBase64, 'base64url').toString() ||
      '[]',
    ),
  };
};
