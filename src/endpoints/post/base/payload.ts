import {
  PostListPayload,
  QuestPostEditPayload,
  QuestPostPayload,
  QuestPostPublishPayload,
  SinglePostPayload,
} from '../../../api-def/api';

const processSinglePostPayload = <T extends SinglePostPayload>(payload: T): T => {
  // `seqId` is string if given as a payload
  if (payload.seqId && !Number.isInteger(payload.seqId)) {
    payload.seqId = +payload.seqId;
  }

  return payload;
};

const processQuestPostPayload = <T extends QuestPostPayload>(payload: T): T => {
  if (!payload.positional) {
    // If `positional` field does not exist in the payload, and an empty array to it.
    payload.positional = [];
  } else if (!Array.isArray(payload.positional)) {
    // When only one positional info is provided,
    // `payload.positional` will be an object instead of a list of the objects.
    // https://stackoverflow.com/q/56210870/11571888
    payload.positional = [payload.positional];
  }

  payload = processSinglePostPayload(payload);

  return payload;
};

export const processPostListPayload = (payload: PostListPayload): PostListPayload => {
  payload.start = +payload.start || 0;
  payload.limit = +payload.limit || 0;

  return payload;
};

export const processPostPublishPayload = (payload: QuestPostPublishPayload): QuestPostPublishPayload => {
  payload = processQuestPostPayload(payload);

  return payload;
};

export const processPostGetPayload = (payload: SinglePostPayload): SinglePostPayload => {
  payload = processSinglePostPayload(payload);

  return payload;
};

export const processPostEditPayload = (payload: QuestPostEditPayload): QuestPostEditPayload => {
  payload = processQuestPostPayload(payload);

  return payload;
};
