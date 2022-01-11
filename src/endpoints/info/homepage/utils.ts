import {
  PostInfoEntry,
  PostType,
  SequencedPostInfo,
  SupportedLanguages,
  UnitInfoLookupEntry,
} from '../../../api-def/api';
import {getUnitInfo} from '../../../utils/resources/loader/unitInfo';
import {PostListResult} from '../../post/base/controller/list';


export const transformSequencedPostInfo = (
  postList: PostListResult<SequencedPostInfo>, postType: PostType,
): PostInfoEntry[] => {
  return postList.postListEntries.map((entry) => ({
    title: entry.title,
    type: postType,
    pid: entry.seqId,
    info: entry,
  }));
};

export const transformAnalysisInfo = async (
  analyses: UnitInfoLookupEntry[], lang: SupportedLanguages,
): Promise<PostInfoEntry[]> => {
  return Promise.all(analyses.map(async (analysis) => {
    const unitInfo = await getUnitInfo(analysis.unitId);

    return {
      title: unitInfo?.name[lang] || `Unit # ${analysis.unitId.toString()}`,
      type: PostType.ANALYSIS,
      pid: analysis.unitId,
      info: analysis,
    };
  }));
};
