import {
  AnalysisGetPayload,
  AnalysisIdCheckPayload,
  AnalysisListPayload, CharaAnalysisEditPayload, CharaAnalysisPayload,
  CharaAnalysisPublishPayload, DragonAnalysisEditPayload, DragonAnalysisPayload,
  DragonAnalysisPublishPayload,
} from '../../../../api-def/api';
import {processPostListPayload, processSinglePostPayload} from './shared';


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

  payload = processSinglePostPayload(payload);

  return payload;
};

const processDragonAnalysisPayload = <T extends DragonAnalysisPayload>(payload: T): T => {
  payload = processSinglePostPayload(payload);

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
  payload = processSinglePostPayload(payload);

  return payload;
};

export const processListAnalysisPayload = <T extends AnalysisListPayload>(payload: T): T => {
  payload = processPostListPayload(payload);

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
  payload = processSinglePostPayload(payload);

  return payload;
};
