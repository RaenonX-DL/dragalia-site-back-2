import {UserIsAdminPayload, UserLoginPayload, UserShowAdsPayload} from '../../api-def/api';
import {processPayloadBase} from './base';

export const processUserLoginPayload = <P extends UserLoginPayload>(payload: P): P => {
  payload = processPayloadBase(payload);

  if (!payload.googleEmail) {
    payload.googleEmail = '';
  }

  return payload;
};

export const processUserIsAdminPayload = <P extends UserIsAdminPayload>(payload: P): P => {
  return processPayloadBase(payload);
};

export const processUserShowAdsPayload = <P extends UserShowAdsPayload>(payload: P): P => {
  return processPayloadBase(payload);
};
