import {PageMetaPayload, PostPageMetaPayload, UnitPageMetaPayload} from '../../api-def/api';
import {processPayloadBase} from './base';
import {processUnitIdentifier} from './identifier';


export const processPageMetaPayload = <T extends PageMetaPayload>(payload: T): T => {
  payload = processPayloadBase(payload);

  return payload;
};

export const processPostMetaPayload = <T extends PostPageMetaPayload>(payload: T): T => {
  payload = processPageMetaPayload(payload);

  payload.postIdentifier = processUnitIdentifier(payload.postIdentifier);

  return payload;
};

export const processUnitMetaPayload = <T extends UnitPageMetaPayload>(payload: T): T => {
  payload = processPageMetaPayload(payload);

  payload.unitIdentifier = processUnitIdentifier(payload.unitIdentifier);

  return payload;
};
