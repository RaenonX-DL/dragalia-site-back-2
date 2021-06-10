import {UserLoginPayload} from '../../api-def/api';
import {processPayloadBase} from './base';


export const processUserLoginPayload = <P extends UserLoginPayload>(payload: P): P => {
  payload = processPayloadBase(payload);

  if (!payload.email) {
    payload.email = '';
  }

  return payload;
};
