import {PageMetaPayload, PostPageMetaPayload, UnitPageMetaPayload} from '../../api-def/api';
import {processPayloadBase} from './base';


const processIdentifier = (identifier: number | string): number | string => {
  let ret = Number(identifier) || identifier;

  if (typeof ret === 'string') {
    ret = ret.replace('_', ' ');
  }

  return ret;
};


export const processPageMetaPayload = <T extends PageMetaPayload>(payload: T): T => {
  payload = processPayloadBase(payload);

  return payload;
};

export const processPostMetaPayload = <T extends PostPageMetaPayload>(payload: T): T => {
  payload = processPageMetaPayload(payload);

  payload.postIdentifier = processIdentifier(payload.postIdentifier);

  return payload;
};

export const processUnitMetaPayload = <T extends UnitPageMetaPayload>(payload: T): T => {
  payload = processPageMetaPayload(payload);

  payload.unitIdentifier = processIdentifier(payload.unitIdentifier);

  return payload;
};
