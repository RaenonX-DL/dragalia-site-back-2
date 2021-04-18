import {
  AnalysisGetPayload,
  AnalysisIdCheckPayload,
  AnalysisListPayload,
  CharaAnalysisPublishPayload,
  DragonAnalysisPublishPayload,
} from '../../../../api-def/api/post/analysis/payload';
import {processPostListPayload, processSinglePostPayload} from './shared';


export const processDragonAnalysisPublishPayload = (
  payload: DragonAnalysisPublishPayload,
): DragonAnalysisPublishPayload => {
  payload = processSinglePostPayload(payload);

  return payload;
};

export const processCharaAnalysisPublishPayload = (
  payload: CharaAnalysisPublishPayload,
): CharaAnalysisPublishPayload => {
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

export const processGetAnalysisPayload = <T extends AnalysisGetPayload>(payload: T): T => {
  payload = processSinglePostPayload(payload);

  return payload;
};

export const processListAnalysisPayload = <T extends AnalysisListPayload>(payload: T): T => {
  payload = processPostListPayload(payload);

  return payload;
};

export const processAnalysisIdCheckPayload = <T extends AnalysisIdCheckPayload>(payload: T): T => {
  payload = processSinglePostPayload(payload);

  return payload;
};
