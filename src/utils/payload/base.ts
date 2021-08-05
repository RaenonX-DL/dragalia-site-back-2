import {OptionalSequenced, RequestPayloadBase} from '../../api-def/api';


export const processPayloadBase = <P extends RequestPayloadBase>(payload: P): P => {
  if (!payload.uid) {
    payload.uid = '';
  }

  return payload;
};

export const processSequencedPayload = <T extends OptionalSequenced>(payload: T): T => {
  // `seqId` is string if given as a payload
  if (payload.seqId && !Number.isInteger(payload.seqId)) {
    payload.seqId = +payload.seqId;
  }

  return payload;
};
