import {
  PostType,
  subKeysInclude,
  SubscriptionKey,
  UnitInfoLookupAnalyses,
  UnitInfoLookupEntry,
} from '../../../api-def/api';
import {EditableDocumentKey} from '../../../base/model/editable';
import {MultiLingualDocumentKey} from '../../../base/model/multiLang';
import {SequentialDocumentKey} from '../../../base/model/seq';
import {ViewCountableDocumentKey} from '../../../base/model/viewCount';
import {SubscriptionRecordController} from '../../../thirdparty/mail/data/subscription/controller';
import {UnitAnalysis, UnitAnalysisDocumentKey} from '../../post/analysis/model/unitAnalysis';
import {GetAnalysisInfoOptions, GetAnalysisLookupOptions, GetModifiedAnalysisOptions} from './type';


/**
 * Class for controlling the information to be used by the unit info lookup.
 */
export class UnitInfoLookupController {
  /**
   * Get the info map for the unit analyses.
   *
   * @param {GetAnalysisLookupOptions} options options to get the analysis lookup map
   * @return {Promise<UnitInfoLookupAnalyses>} analyses info map
   */
  static async getAnalysisLookup(options: GetAnalysisLookupOptions): Promise<UnitInfoLookupAnalyses> {
    const analysisInfo = await UnitInfoLookupController.getAnalysisInfo(options);

    return Object.fromEntries(
      analysisInfo.map((analysisInfo) => [analysisInfo.unitId, analysisInfo]),
    );
  }

  /**
   * Get a list of most recently modified analyses for the use of the unit info lookup.
   *
   * @param {GetModifiedAnalysisOptions} options options to get recently modified analyses
   * @return {Promise<Array<UnitInfoLookupEntry>>} list of most recently modified analyses
   */
  static async getRecentlyModifiedAnalyses(options: GetModifiedAnalysisOptions): Promise<UnitInfoLookupEntry[]> {
    const {maxCount = 9} = options;

    return UnitInfoLookupController.getAnalysisInfo({
      ...options,
      postFindProcess: (cursor) => {
        return cursor
        // Sort by last modified epoch DESC
          .sort([EditableDocumentKey.dateModifiedEpoch, -1])
        // Limit the count to return
          .limit(maxCount);
      },
    });
  }

  /**
   * Get all analyses info.
   *
   * @param {GetAnalysisInfoOptions} options options for getting the analyses info
   * @return {Promise<Array<UnitInfoLookupEntry>>} list of analysis info for the unit info lookup
   */
  private static async getAnalysisInfo(options: GetAnalysisInfoOptions): Promise<Array<UnitInfoLookupEntry>> {
    const {
      mongoClient,
      uid,
      lang,
      postFindProcess = (cursor) => cursor,
    } = options;

    const query = {[MultiLingualDocumentKey.language]: lang};

    const analyses = (await UnitAnalysis.getCollection(mongoClient))
      .find(
        query,
        {
          projection: {
            [UnitAnalysisDocumentKey.type]: 1,
            [SequentialDocumentKey.sequenceId]: 1,
            [UnitAnalysisDocumentKey.unitId]: 1,
            [MultiLingualDocumentKey.language]: 1,
            [EditableDocumentKey.dateModifiedEpoch]: 1,
            [EditableDocumentKey.datePublishedEpoch]: 1,
            [ViewCountableDocumentKey.viewCount]: 1,
          },
        });
    const [analysisArray, subscriptionKeys] = await Promise.all([
      postFindProcess(analyses).toArray(),
      SubscriptionRecordController.getSubscriptionsOfUser(mongoClient, uid),
    ]);

    return analysisArray.map((post) => ({
      type: post[UnitAnalysisDocumentKey.type],
      seqId: post[SequentialDocumentKey.sequenceId],
      unitId: post[UnitAnalysisDocumentKey.unitId],
      lang: post[MultiLingualDocumentKey.language],
      viewCount: post[ViewCountableDocumentKey.viewCount],
      modifiedEpoch: post[EditableDocumentKey.dateModifiedEpoch],
      publishedEpoch: post[EditableDocumentKey.datePublishedEpoch],
      userSubscribed: subscriptionKeys.some((key) => {
        const subKeys: SubscriptionKey[] = [
          {type: 'const', name: 'ALL_ANALYSIS'},
          {type: 'post', postType: PostType.ANALYSIS, id: post[UnitAnalysisDocumentKey.unitId]},
        ];

        return subKeysInclude(subKeys, key);
      }),
    }));
  }
}
