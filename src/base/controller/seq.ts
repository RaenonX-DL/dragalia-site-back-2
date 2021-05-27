import {Collection, MongoClient} from 'mongodb';

import {SupportedLanguages} from '../../api-def/api/other/lang';
import {MultiLingualDocumentKey} from '../model/multiLang';
import {SequentialDocumentKey} from '../model/seq';


export type NextSeqIdOptions = {
  seqId?: number,
  increase?: boolean,
}

type FuncGetNextSeqId = (mongoClient: MongoClient, {seqId, increase}: NextSeqIdOptions) => Promise<number>;

/**
 * Sequence controller.
 */
export abstract class SequencedController {
  /**
   * Check if the given sequential ID is available.
   *
   * If ``seqId`` is omitted, returns ``true``.
   * (a new ID will be automatically generated and used when publishing a post without specifying it)
   *
   * @param {MongoClient} mongoClient mongo client
   * @param {Collection} collection mongo collection to check
   * @param {FuncGetNextSeqId} getNextSeqId function to get the next sequential ID
   * @param {SupportedLanguages} lang post language to be checked
   * @param {number} seqId post sequential ID to be checked
   * @return {Promise<boolean>} promise containing the availability of the sequential ID
   */
  static async isIdAvailable(
    mongoClient: MongoClient,
    collection: Collection,
    getNextSeqId: FuncGetNextSeqId,
    lang: SupportedLanguages,
    seqId?: number,
  ): Promise<boolean> {
    if (!seqId) {
      return true;
    }
    if (seqId < 0) {
      return false;
    }

    const nextSeqId = await getNextSeqId(mongoClient, {increase: false});
    if (seqId > nextSeqId + 1) {
      return false;
    }

    return !await collection
      .findOne({
        [SequentialDocumentKey.sequenceId]: seqId,
        [MultiLingualDocumentKey.language]: lang,
      });
  }
}
