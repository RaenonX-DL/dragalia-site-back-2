import {
  CharaAnalysisPublishPayload,
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

export const processPostListPayload = <T extends PostListPayload>(payload: T): T => {
  payload.start = +payload.start || 0;
  payload.limit = +payload.limit || 0;

  return payload;
};

export const processPostGetPayload = <T extends SinglePostPayload>(payload: T): T => {
  payload = processSinglePostPayload(payload);

  return payload;
};

export const processPostIdCheckPayload = <T extends SinglePostPayload>(payload: T): T => {
  payload = processSinglePostPayload(payload);

  return payload;
};

export const processQuestPostPublishPayload = (payload: QuestPostPublishPayload): QuestPostPublishPayload => {
  payload = processQuestPostPayload(payload);

  return payload;
};

export const processQuestPostEditPayload = (payload: QuestPostEditPayload): QuestPostEditPayload => {
  payload = processQuestPostPayload(payload);

  return payload;
};

export const processCharaAnalysisPublishPayload = (
  payload: CharaAnalysisPublishPayload,
): CharaAnalysisPublishPayload => {
  if (!payload.skills) {
    // If `skills` field does not exist in the payload, and an empty array to it.
    payload.skills = [];
  } else if (!Array.isArray(payload.skills)) {
    // When only one skill is provided,
    // `payload.skills` will be an object instead of a list of the objects.
    // https://stackoverflow.com/q/56210870/11571888
    payload.skills = [payload.skills];
  }

  payload = processSinglePostPayload(payload);

  return payload;
};
