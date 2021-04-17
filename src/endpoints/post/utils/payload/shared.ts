import {PostListPayload, SinglePostPayload} from '../../../../api-def/api';

export const processSinglePostPayload = <T extends SinglePostPayload>(payload: T): T => {
  // `seqId` is string if given as a payload
  if (payload.seqId && !Number.isInteger(payload.seqId)) {
    payload.seqId = +payload.seqId;
  }

  return payload;
};

export const processPostListPayload = <T extends PostListPayload>(payload: T): T => {
  payload.start = +payload.start || 0;
  payload.limit = +payload.limit || 0;

  return payload;
};
