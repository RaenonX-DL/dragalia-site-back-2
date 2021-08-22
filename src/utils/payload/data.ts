import {KeyPointInfoPayload, UnitNameRefUpdatePayload} from '../../api-def/api';
import {processPayloadBase} from './base';


export const processUnitNameRefUpdatePayload = <T extends UnitNameRefUpdatePayload>(payload: T): T => {
  payload = processPayloadBase(payload);

  payload.refs = payload.refs.map((ref) => ({
    ...ref,
    unitId: +ref.unitId,
  }));

  return payload;
};

export const processKeyPointInfoPayload = <T extends KeyPointInfoPayload>(payload: T): T => {
  return processPayloadBase(payload);
};
