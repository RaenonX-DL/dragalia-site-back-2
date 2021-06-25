import {PostType} from '../../../api-def/api';
import {getUnitInfo} from '../../../utils/resources/loader/unitInfo';
import {trim} from '../../../utils/string';
import {AnalysisController} from '../../post/analysis/controller';
import {UnitAnalysisDocumentKey} from '../../post/analysis/model/unitAnalysis';
import {PostDocumentKey} from '../../post/base/model';
import {QuestPostController} from '../../post/quest/controller';
import {ParamGetterFunction} from './types';


const getAnalysisMeta: ParamGetterFunction = async ({
  mongoClient,
  postIdentifier,
  lang,
}) => {
  const analysis = await AnalysisController.getAnalysis(mongoClient, postIdentifier, lang, false);

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
  postIdentifier,
  lang,
}) => {
  if (typeof postIdentifier === 'string') {
    return null;
  }

  const quest = await QuestPostController.getQuestPost(mongoClient, postIdentifier, lang, false);

  if (!quest) {
    return null;
  }

  return {
    title: quest.post[PostDocumentKey.title],
  };
};

const getMiscMeta = async (): Promise<null> => {
  return null;
};

export const ParamGetters: { [type in PostType]: ParamGetterFunction } = {
  [PostType.ANALYSIS]: getAnalysisMeta,
  [PostType.QUEST]: getQuestGuideMeta,
  [PostType.MISC]: getMiscMeta,
};
