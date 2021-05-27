import {MongoClient} from 'mongodb';

import {PostPageMetaParams} from '../../../api-def/api/meta/post/response';
import {SupportedLanguages} from '../../../api-def/api/other/lang';
import {PostType} from '../../../api-def/api/post/types';
import {getUnitInfo} from '../../../utils/resources/loader/unitInfo';
import {trim} from '../../../utils/string';
import {AnalysisController} from '../../post/analysis/controller';
import {UnitAnalysisDocumentKey} from '../../post/analysis/model/unitAnalysis';
import {PostDocumentKey} from '../../post/base/model';
import {QuestPostController} from '../../post/quest/controller';
import {QuestPostDocumentKey} from '../../post/quest/model';

const getAnalysisMeta = async (
  mongoClient: MongoClient,
  pid: number,
  lang: SupportedLanguages,
): Promise<PostPageMetaParams | null> => {
  const analysis = await AnalysisController.getAnalysis(mongoClient, pid, lang, false);

  if (!analysis) {
    return null;
  }

  const unitId = analysis.post[UnitAnalysisDocumentKey.unitId];
  const unitInfo = await getUnitInfo(unitId);

  return {
    title: unitInfo ? unitInfo.name[lang] : unitId.toString(),
    description: trim(analysis.post[UnitAnalysisDocumentKey.summary], 100),
  };
};

const getQuestGuideMeta = async (
  mongoClient: MongoClient,
  pid: number,
  lang: SupportedLanguages,
): Promise<PostPageMetaParams | null> => {
  const quest = await QuestPostController.getQuestPost(mongoClient, pid, lang, false);

  if (!quest) {
    return null;
  }

  return {
    title: quest.post[PostDocumentKey.title],
    description: trim(quest.post[QuestPostDocumentKey.generalInfo], 100),
  };
};

const getMiscMeta = async (): Promise<PostPageMetaParams> => {
  return {
    title: 'N/A',
    description: 'N/A',
  };
};

export const ParamGetters: {
  [type in PostType]:
  (
    mongoClient: MongoClient,
    pid: number,
    lang: SupportedLanguages,
  ) => Promise<PostPageMetaParams | null>
} = {
  [PostType.ANALYSIS]: getAnalysisMeta,
  [PostType.QUEST]: getQuestGuideMeta,
  [PostType.MISC]: getMiscMeta,
};
