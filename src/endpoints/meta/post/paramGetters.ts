import {PostType} from '../../../api-def/api';
import {getUnitInfo} from '../../../utils/resources/loader/unitInfo';
import {trim} from '../../../utils/string';
import {AnalysisController} from '../../post/analysis/controller';
import {UnitAnalysisDocumentKey} from '../../post/analysis/model/unitAnalysis';
import {PostDocumentKey} from '../../post/base/model';
import {MiscPostController} from '../../post/misc/controller';
import {QuestPostController} from '../../post/quest/controller';
import {ParamGetterFunction} from './types';


const getAnalysisMeta: ParamGetterFunction = async ({
  mongoClient,
  uid,
  postIdentifier,
  lang,
}) => {
  const analysis = await AnalysisController.getAnalysis({
    mongoClient, uid, unitIdentifier: postIdentifier, lang, incCount: false,
  });

  if (!analysis) {
    return null;
  }

  const unitId = analysis.post[UnitAnalysisDocumentKey.unitId];
  const unitInfo = await getUnitInfo(unitId);

  return {
    name: unitInfo ? unitInfo.name[lang] : unitId.toString(),
    summary: trim(analysis.post[UnitAnalysisDocumentKey.summary], 100),
  };
};

const getQuestGuideMeta: ParamGetterFunction = async ({
  mongoClient,
  uid,
  postIdentifier,
  lang,
}) => {
  if (typeof postIdentifier === 'string') {
    return null;
  }

  const post = await QuestPostController.getQuestPost({
    mongoClient, uid, seqId: postIdentifier, lang, incCount: false,
  });

  if (!post) {
    return null;
  }

  return {
    title: post.post[PostDocumentKey.title],
  };
};

const getMiscMeta: ParamGetterFunction = async ({
  mongoClient,
  uid,
  postIdentifier,
  lang,
}) => {
  if (typeof postIdentifier === 'string') {
    return null;
  }

  const post = await MiscPostController.getMiscPost({
    mongoClient, uid, seqId: postIdentifier, lang, incCount: false,
  });

  if (!post) {
    return null;
  }

  return {
    title: post.post[PostDocumentKey.title],
  };
};

export const ParamGetters: { [type in PostType]: ParamGetterFunction } = {
  [PostType.ANALYSIS]: getAnalysisMeta,
  [PostType.QUEST]: getQuestGuideMeta,
  [PostType.MISC]: getMiscMeta,
};
