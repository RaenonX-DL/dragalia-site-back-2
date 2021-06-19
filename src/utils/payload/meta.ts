import {PageMetaPayload, PostPageMetaPayload} from '../../api-def/api';
import {processPayloadBase} from './base';


export const processPageMetaPayload = <T extends PageMetaPayload>(payload: T): T => {
  payload = processPayloadBase(payload);

  return payload;
};

export const processPostMetaPayload = <T extends PostPageMetaPayload>(payload: T): T => {
  payload = processPageMetaPayload(payload);

  payload.postId = +payload.postId;

  return payload;
};
