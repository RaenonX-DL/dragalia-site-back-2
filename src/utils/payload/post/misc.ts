import {
  MiscPostBody,
  MiscPostEditPayload,
  MiscPostGetPayload,
  MiscPostIdCheckPayload,
  MiscPostListPayload,
  MiscPostPublishPayload,
  OptionalSequenced,
} from '../../../api-def/api';
import {processSequencedPayload} from '../base';
import {processPostListPayload} from './list';


const processMiscPayload = <T extends Omit<MiscPostBody, 'seqId'> & OptionalSequenced>(payload: T): T => {
  if (!payload.sections) {
    // If `sections` field does not exist in the payload, and an empty array to it.
    payload.sections = [];
  } else if (!Array.isArray(payload.sections)) {
    // When only one positional info is provided,
    // `payload.sections` will be an object instead of a list of the objects.
    // https://stackoverflow.com/q/56210870/11571888
    payload.sections = [payload.sections];
  }

  payload = processSequencedPayload(payload);

  return payload;
};

export const processMiscPublishPayload = <T extends MiscPostPublishPayload>(payload: T): T => {
  payload = processMiscPayload(payload);

  return payload;
};

export const processMiscEditPayload = <T extends MiscPostEditPayload>(payload: T): T => {
  payload = processMiscPayload(payload);

  return payload;
};

export const processMiscGetPayload = <T extends MiscPostGetPayload>(payload: T): T => {
  payload = processSequencedPayload(payload);

  return payload;
};

export const processMiscIdCheckPayload = <T extends MiscPostIdCheckPayload>(payload: T): T => {
  payload = processSequencedPayload(payload);

  return payload;
};

export const processMiscListPayload = <T extends MiscPostListPayload>(payload: T): T => {
  payload = processPostListPayload(payload);

  return payload;
};
