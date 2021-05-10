import {PostIdentifierPayload, PostListPayload} from '../../../api-def/api';
import {processPayloadBase} from '../base';

export const processSinglePostPayload = <T extends PostIdentifierPayload>(payload: T): T => {
  payload = processPayloadBase(payload);

  // `seqId` is string if given as a payload
  if (payload.seqId && !Number.isInteger(payload.seqId)) {
    payload.seqId = +payload.seqId;
  }

  return payload;
};

export const processPostListPayload = <T extends PostListPayload>(payload: T): T => {
  payload = processPayloadBase(payload);

  payload.start = +payload.start || 0;
  payload.limit = +payload.limit || 0;

  return payload;
};
