import {SinglePostPayload} from '../../../api-def/api/base/payload';

export const processSinglePostPayload = <T extends SinglePostPayload>(payload: T): T => {
  // `seqId` is string if given as a payload
  if (payload.seqId && !Number.isInteger(payload.seqId)) {
    payload.seqId = parseInt(payload.seqId as unknown as string);
  }

  return payload;
};
