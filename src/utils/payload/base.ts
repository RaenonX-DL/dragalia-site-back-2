import {OptionalSequencedPayload, RequestPayloadBase} from '../../api-def/api/base/payload';

export const processPayloadBase = <P extends RequestPayloadBase>(payload: P): P => {
  if (!payload.googleUid) {
    payload.googleUid = '';
  }

  return payload;
};

export const processSequencedPayload = <T extends OptionalSequencedPayload>(payload: T): T => {
  // `seqId` is string if given as a payload
  if (payload.seqId && !Number.isInteger(payload.seqId)) {
    payload.seqId = +payload.seqId;
  }

  return payload;
};
