import {UserLoginPayload} from '../../../../api-def/api';

export const processUserLoginPayload = <P extends UserLoginPayload>(payload: P): P => {
  if (!payload.googleUid) {
    payload.googleUid = '';
  }

  if (!payload.googleEmail) {
    payload.googleEmail = '';
  }

  return payload;
};
