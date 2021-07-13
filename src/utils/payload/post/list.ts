import {SequencedPostListPayload} from '../../../api-def/api';
import {processPayloadBase} from '../base';

export const processPostListPayload = <T extends SequencedPostListPayload>(payload: T): T => {
  payload = processPayloadBase(payload);

  payload.start = +payload.start || 0;
  payload.limit = +payload.limit || 0;

  return payload;
};
