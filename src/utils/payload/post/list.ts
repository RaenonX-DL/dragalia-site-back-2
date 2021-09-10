import {SequencedPostListPayload} from '../../../api-def/api';
import {processPayloadBase} from '../base';


export const processPostListPayload = <T extends SequencedPostListPayload>(payload: T): T => {
  payload = processPayloadBase(payload);

  return payload;
};
