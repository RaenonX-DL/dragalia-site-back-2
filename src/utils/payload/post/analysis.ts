import {
  AnalysisGetPayload,
  AnalysisIdCheckPayload,
  UnitInfoLookupPayload,
  AnalysisMeta,
  CharaAnalysisEditPayload,
  CharaAnalysisPayload,
  CharaAnalysisPublishPayload,
  DragonAnalysisEditPayload,
  DragonAnalysisPayload,
  DragonAnalysisPublishPayload,
} from '../../../api-def/api';
import {PayloadKeyDeprecatedError} from '../../../endpoints/error';
import {processPayloadBase} from '../base';
import {processUnitIdentifier} from '../identifier';


const checkPayloadDeprecatedKey = (payload: {[key: string]: any}) => {
  // Prevent manual SEQ ID insertion
  if ('seqId' in payload) {
    throw new PayloadKeyDeprecatedError('seqId');
  }
};

const processAnalysisMetaPayload = <T extends AnalysisMeta>(payload: T): T => {
  payload.unitId = +payload.unitId;

  checkPayloadDeprecatedKey(payload);

  return payload;
};

const processCharaAnalysisPayload = <T extends CharaAnalysisPayload>(payload: T): T => {
  if (!payload.skills) {
    // If `skills` field does not exist in the payload, and an empty array to it.
    payload.skills = [];
  } else if (!Array.isArray(payload.skills)) {
    // When only one skill is provided,
    // `payload.skills` will be an object instead of a list of the objects.
    // https://stackoverflow.com/q/56210870/11571888
    payload.skills = [payload.skills];
  }

  payload = processAnalysisMetaPayload(payload);

  return payload;
};

const processDragonAnalysisPayload = <T extends DragonAnalysisPayload>(payload: T): T => {
  payload = processAnalysisMetaPayload(payload);

  return payload;
};

export const processCharaAnalysisPublishPayload = (
  payload: CharaAnalysisPublishPayload,
): CharaAnalysisPublishPayload => {
  payload = processCharaAnalysisPayload(payload);

  return payload;
};

export const processDragonAnalysisPublishPayload = (
  payload: DragonAnalysisPublishPayload,
): DragonAnalysisPublishPayload => {
  payload = processDragonAnalysisPayload(payload);

  return payload;
};

export const processGetAnalysisPayload = <T extends AnalysisGetPayload>(payload: T): T => {
  payload.unitId = processUnitIdentifier(payload.unitId);

  checkPayloadDeprecatedKey(payload);

  return payload;
};

export const processLookupAnalysisPayload = <T extends UnitInfoLookupPayload>(payload: T): T => {
  payload = processPayloadBase(payload);

  return payload;
};

export const processEditCharaAnalysisPayload = <T extends CharaAnalysisEditPayload>(payload: T): T => {
  payload = processCharaAnalysisPayload(payload);

  return payload;
};

export const processEditDragonAnalysisPayload = <T extends DragonAnalysisEditPayload>(payload: T): T => {
  payload = processDragonAnalysisPayload(payload);

  return payload;
};

export const processAnalysisIdCheckPayload = <T extends AnalysisIdCheckPayload>(payload: T): T => {
  payload = processAnalysisMetaPayload(payload);

  return payload;
};
