import {UnitTierNoteEditPayload, UnitTierNoteSinglePayload, UnitTierNoteUpdatePayload} from '../../api-def/api';
import {processPayloadBase} from './base';


type PayloadHasUnitId = UnitTierNoteEditPayload | UnitTierNoteUpdatePayload

const processPayloadHasUnitId = <P extends PayloadHasUnitId>(payload: P): P => {
  payload = processPayloadBase(payload);
  payload.unitId = +payload.unitId;

  return payload;
};

export const processTierNoteSinglePayload = <P extends UnitTierNoteSinglePayload>(payload: P): P => {
  return processPayloadHasUnitId(payload);
};

export const processTierNoteEditPayload = <P extends UnitTierNoteEditPayload>(payload: P): P => {
  return processPayloadHasUnitId(payload);
};

export const processTierNoteUpdatePayload = <P extends UnitTierNoteUpdatePayload>(payload: P): P => {
  return processPayloadHasUnitId(payload);
};
