import {Collection, MongoClient} from 'mongodb';

import {SupportedLanguages} from '../../api-def/api';
import {MultiLingualDocumentKey} from '../model/multiLang';
import {SequentialDocumentKey} from '../model/seq';


export type NextSeqIdOptions = {
  seqId?: number,
  increase?: boolean,
  lang?: SupportedLanguages,
}

type FuncGetCollection = (mongoClient: MongoClient) => Collection;

type FuncGetNextSeqId = (mongoClient: MongoClient, options: NextSeqIdOptions) => Promise<number>;

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
   * @param {FuncGetCollection} getCollection function to get the mongo collection to use
   * @param {FuncGetNextSeqId} getNextSeqId function to get the next sequential ID
   * @param {SupportedLanguages} lang post language to be checked
   * @param {number} seqId post sequential ID to be checked
   * @return {Promise<boolean>} promise containing the availability of the sequential ID
   */
  static async isIdAvailable(
    mongoClient: MongoClient,
    getCollection: FuncGetCollection,
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

    const nextSeqId = await getNextSeqId(mongoClient, {increase: false, lang});
    if (seqId > nextSeqId + 1) {
      return false;
    }

    // Cannot directly pass in the collection because for some reason,
    // if `seqId` is negative and the function is early-terminated,
    // the mongo client will be used for getting the collection and
    // triggers session expired error.
    // This happens when calling `npm run test:ci-jest`,
    // but not when calling `npm run test` or using the IDE builtin `jest` testing config.
    return !await getCollection(mongoClient)
      .findOne({
        [SequentialDocumentKey.sequenceId]: seqId,
        [MultiLingualDocumentKey.language]: lang,
      });
  }
}
