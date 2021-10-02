import {FindCursor, MongoClient} from 'mongodb';

import {SupportedLanguages, UnitInfoLookupAnalyses, UnitInfoLookupEntry} from '../../../api-def/api';
import {EditableDocumentKey} from '../../../base/model/editable';
import {MultiLingualDocumentKey} from '../../../base/model/multiLang';
import {SequentialDocumentKey} from '../../../base/model/seq';
import {ViewCountableDocumentKey} from '../../../base/model/viewCount';
import {UnitAnalysis, UnitAnalysisDocumentKey} from '../../post/analysis/model/unitAnalysis';


/**
 * Class for controlling the information to be used by the unit info lookup.
 */
export class UnitInfoLookupController {
  /**
   * Get the info map for the unit analyses.
   *
   * @param {MongoClient} mongoClient mongo client to use
   * @param {SupportedLanguages} lang language code of the lookup
   * @return {Promise<UnitInfoLookupAnalyses>} analyses info map
   */
  static async getAnalysisLookup(
    mongoClient: MongoClient, lang: SupportedLanguages,
  ): Promise<UnitInfoLookupAnalyses> {
    const analysisInfo = await UnitInfoLookupController.getAnalysisInfo(mongoClient, lang);

    return Object.fromEntries(
      analysisInfo.map((analysisInfo) => [analysisInfo.unitId, analysisInfo]),
    );
  }

  /**
   * Get a list of most recently modified analyses for the use of the unit info lookup.
   *
   * @param {MongoClient} mongoClient mongo client to use
   * @param {SupportedLanguages} lang language code of the lookup
   * @param {number} maxCount maximum number of the recently modified analyses to get
   * @return {Promise<Array<UnitInfoLookupEntry>>} list of most recently modified analyses
   */
  static async getRecentlyModifiedAnalyses(
    mongoClient: MongoClient, lang: SupportedLanguages, maxCount = 9,
  ): Promise<Array<UnitInfoLookupEntry>> {
    return UnitInfoLookupController.getAnalysisInfo(mongoClient, lang, (cursor) => {
      return cursor
        // Sort by last modified epoch DESC
        .sort([EditableDocumentKey.dateModifiedEpoch, -1])
        // Limit the count to return
        .limit(maxCount);
    });
  }

  /**
   * Get all analyses info.
   *
   * @param {MongoClient} mongoClient mongo client to perform the listing
   * @param {SupportedLanguages} lang language code of the analyses
   * @param {FindCursor} postFindProcess function to be executed after `find()` but before `toArray()`
   * @return {Promise<Array<UnitInfoLookupEntry>>} list of analysis info for the unit info lookup
   */
  private static async getAnalysisInfo(
    mongoClient: MongoClient,
    lang: SupportedLanguages,
    postFindProcess: (cursor: FindCursor) => FindCursor = (cursor) => cursor,
  ): Promise<Array<UnitInfoLookupEntry>> {
    const query = {[MultiLingualDocumentKey.language]: lang};

    const analyses = UnitAnalysis.getCollection(mongoClient)
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
    const analysisArray = await postFindProcess(analyses).toArray();

    return analysisArray.map((post) => (
      {
        type: post[UnitAnalysisDocumentKey.type],
        seqId: post[SequentialDocumentKey.sequenceId],
        unitId: post[UnitAnalysisDocumentKey.unitId],
        lang: post[MultiLingualDocumentKey.language],
        viewCount: post[ViewCountableDocumentKey.viewCount],
        modifiedEpoch: post[EditableDocumentKey.dateModifiedEpoch],
        publishedEpoch: post[EditableDocumentKey.datePublishedEpoch],
      }
    ));
  }
}
