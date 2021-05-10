import {RequestPayloadBase} from '../../api-def/api/base/payload';

export const processPayloadBase = <P extends RequestPayloadBase>(payload: P): P => {
  if (!payload.googleUid) {
    payload.googleUid = '';
  }

  return payload;
};
