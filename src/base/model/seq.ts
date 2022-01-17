import {Collection, Filter, MongoClient} from 'mongodb';

import {SupportedLanguages} from '../../api-def/api';
import {DocumentBase} from '../../api-def/models';
import {SeqIdSkippingError} from '../../endpoints/post/error';
import {getCollection} from '../../utils/mongodb';
import {CollectionInfo} from '../controller/info';
import {NextSeqIdOptions} from '../controller/seq';
import {Document, DocumentConstructParams} from './base';


export enum SequentialDocumentKey {
  sequenceId = '_seq'
}

export type SequentialDocumentBase = DocumentBase & {
  [SequentialDocumentKey.sequenceId]: number,
};

const counterCollectionName = '_seq_counter';

enum SequenceCounterKeys {
  collection = '_col',
  lang = '_lang',
  counter = '_seq',
}

export type SequentialDocumentConstructParams = DocumentConstructParams & {
  seqId: number,
};

/**
 * Sequential document class.
 */
export class SequentialDocument extends Document {
  protected static seqCollection: Collection;

  seqId: number;

  /**
   * Construct a sequential document.
   *
   * @param {SequentialDocumentConstructParams} _ parameters to construct a sequential document
   */
  constructor({id, seqId}: SequentialDocumentConstructParams) {
    super({id});

    this.seqId = seqId;
  }

  /**
   * Get the next available sequential ID.
   *
   * If seqId is specified, this method will return it and update the sequence counter to it, if the number is valid.
   *
   * ``increase`` defaults to true.
   * If ``increase``, the counter will be increased and updated. The return will be the updated sequential ID.
   * Otherwise, the current counter status will be returned instead.
   *
   * @param {MongoClient} mongoClient mongo client
   * @param {CollectionInfo} dbInfo database info of the document
   * @param {number?} seqId desired post sequential ID to use
   * @param {boolean} increase increase the counter or not
   * @param {string} lang language bound to the sequential ID
   * @return {number} next available sequential ID
   * @throws {SeqIdSkippingError} if the desired seqId to use is not sequential
   */
  static async getNextSeqId(
    mongoClient: MongoClient, dbInfo: CollectionInfo, {seqId, increase, lang}: NextSeqIdOptions,
  ): Promise<number> {
    // explicit check because `increase` is `bool`
    // `==` to check for both `null` and `undefined`
    if (increase == null) {
      increase = true;
    }

    // Initialize the collection, if not yet set up
    if (!this.seqCollection) {
      await this.init(mongoClient, dbInfo, lang);
    }

    const filter = this.seqCounterFilter(dbInfo.collectionName, lang);

    let updateOps;
    if (seqId) {
      const latestSeqId = (await this.seqCollection.findOne(filter))?.[SequenceCounterKeys.counter] ?? 0;

      if (seqId > latestSeqId + 1) {
        throw new SeqIdSkippingError(seqId, latestSeqId + 1);
      }

      // Use `$max` instead of `$set` so that the sequential counter is updated
      // only if the new ID is the newest
      updateOps = {$max: {[SequenceCounterKeys.counter]: seqId}};
    } else {
      updateOps = {$inc: {[SequenceCounterKeys.counter]: increase ? 1 : 0}};
    }

    const updateResult = await this.seqCollection.findOneAndUpdate(
      filter,
      updateOps,
      {
        upsert: true,
        returnDocument: 'after',
      },
    );

    // Counter is only updated if the new ID is the newest,
    // So `seqId` might be less than what's in the counter
    return seqId || (updateResult.value as SequentialDocumentBase)[SequenceCounterKeys.counter];
  }

  /**
   * Initialize the necessary things for this sequential document.
   *
   * @param {MongoClient} mongoClient mongo client
   * @param {CollectionInfo} dbInfo database info of this sequential document
   * @param {string?} lang language of the sequential document
   * @private
   */
  private static async init(
    mongoClient: MongoClient, dbInfo: CollectionInfo, lang?: SupportedLanguages,
  ): Promise<void> {
    this.seqCollection = getCollection(mongoClient, {...dbInfo, collectionName: counterCollectionName});

    // Initialize the counter field, if not yet available
    await this.seqCollection.updateOne(
      this.seqCounterFilter(dbInfo.collectionName, lang),
      {$inc: {[SequenceCounterKeys.counter]: 0}},
      {upsert: true},
    );
  }

  /**
   * Get the filter for getting the counter.
   *
   * @param {string} collectionName name of the sequenced collection
   * @param {SupportedLanguages} lang language of the sequential document
   * @return {Filter<Document>} filter for getting the counter
   * @private
   */
  private static seqCounterFilter(collectionName: string, lang?: SupportedLanguages): Filter<DocumentBase> {
    return {
      [SequenceCounterKeys.collection]: collectionName,
      ...(!!lang ? {[SequenceCounterKeys.lang]: lang} : {}),
    };
  }

  /**
   * @inheritDoc
   */
  toObject(): SequentialDocumentBase {
    return {
      [SequentialDocumentKey.sequenceId]: this.seqId,
    };
  }
}
