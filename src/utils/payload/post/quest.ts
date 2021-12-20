import {
  QuestPostEditPayload,
  QuestPostGetPayload,
  QuestPostListPayload,
  QuestPostBody,
  QuestPostPublishPayload,
  QuestPostIdCheckPayload,
  OptionalSequenced,
} from '../../../api-def/api';
import {processSequencedPayload} from '../base';
import {processPostListPayload} from './list';


const processQuestPayload = <T extends Omit<QuestPostBody, 'seqId'> & OptionalSequenced>(payload: T): T => {
  if (!payload.positional) {
    // If `positional` field does not exist in the payload, and an empty array to it.
    payload.positional = [];
  } else if (!Array.isArray(payload.positional)) {
    // When only one positional info is provided,
    // `payload.positional` will be an object instead of a list of the objects.
    // https://stackoverflow.com/q/56210870/11571888
    payload.positional = [payload.positional];
  }

  payload = processSequencedPayload(payload);

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
  payload = processSequencedPayload(payload);

  return payload;
};

export const processQuestIdCheckPayload = <T extends QuestPostIdCheckPayload>(payload: T): T => {
  payload = processSequencedPayload(payload);

  return payload;
};

export const processQuestListPayload = <T extends QuestPostListPayload>(payload: T): T => {
  payload = processPostListPayload(payload);

  return payload;
};
