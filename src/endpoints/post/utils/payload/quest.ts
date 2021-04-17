import {
  PostListPayload,
  QuestPostEditPayload,
  QuestPostGetPayload,
  QuestPostPayload,
  QuestPostPublishPayload,
  SinglePostPayload,
} from '../../../../api-def/api';
import {processPostListPayload, processSinglePostPayload} from './shared';

const processQuestPayload = <T extends QuestPostPayload>(payload: T): T => {
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

export const processQuestPublishPayload = (payload: QuestPostPublishPayload): QuestPostPublishPayload => {
  payload = processQuestPayload(payload);

  return payload;
};

export const processQuestEditPayload = (payload: QuestPostEditPayload): QuestPostEditPayload => {
  payload = processQuestPayload(payload);

  return payload;
};

export const processQuestGetPayload = <T extends QuestPostGetPayload>(payload: T): T => {
  payload = processSinglePostPayload(payload);

  return payload;
};

export const processQuestIdCheckPayload = <T extends SinglePostPayload>(payload: T): T => {
  payload = processSinglePostPayload(payload);

  return payload;
};

export const processQuestListPayload = <T extends PostListPayload>(payload: T): T => {
  payload = processPostListPayload(payload);

  return payload;
};
