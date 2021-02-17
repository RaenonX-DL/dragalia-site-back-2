import {PostListPayload, SinglePostPayload} from '../../../api-def/api/base/payload';

export const processSinglePostPayload = <T extends SinglePostPayload>(payload: T): T => {
  // `seqId` is string if given as a payload
  if (payload.seqId && !Number.isInteger(payload.seqId)) {
    payload.seqId = Number(payload.seqId);
  }

  return payload;
};

export const processPostListPayload = (payload: PostListPayload): PostListPayload => {
  payload.start = Number(payload.start) || 0;
  payload.limit = Number(payload.limit) || 0;

  return payload;
};

export const processPostGetPayload = (payload: SinglePostPayload): SinglePostPayload => {
  payload = processSinglePostPayload(payload);

  return payload;
};
