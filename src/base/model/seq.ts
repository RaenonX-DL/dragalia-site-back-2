import {Collection, MongoClient} from 'mongodb';

import {SeqIdSkippingError} from '../../endpoints/post/error';
import {getCollection} from '../../utils/mongodb';
import {CollectionInfo} from '../controller/info';
import {NextSeqIdArgs} from '../controller/seq';
import {Document, DocumentBase, DocumentConstructParams} from './base';


export enum SequentialDocumentKey {
  sequenceId = '_seq'
}

export type SequentialDocumentBase = DocumentBase & {
  [SequentialDocumentKey.sequenceId]: number,
};

const counterCollectionName = '_seq_counter';

enum SequenceCounterKeys {
  collection = '_col',
  counter = '_seq',
}

export type SequentialDocumentConstructParams = DocumentConstructParams & {
  seqId: number,
}

/**
 * Sequential document class.
 */
export abstract class SequentialDocument extends Document {
  protected static seqCollection: Collection;

  seqId: number;

  /**
   * Construct a sequential document.
   *
   * @param {SequentialDocumentConstructParams} _ parameters to construct a sequential document
   */
  protected constructor({id, seqId}: SequentialDocumentConstructParams) {
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
   * @return {number} next available sequential ID
   * @throws {SeqIdSkippingError} if the desired seqId to use is not sequential
   */
  static async getNextSeqId(
    mongoClient: MongoClient, dbInfo: CollectionInfo, {seqId, increase}: NextSeqIdArgs,
  ): Promise<number> {
    if (increase == null) { // `==` to check for both `null` and `undefined`
      increase = true;
    }

    // Initialize the collection, if not yet set up
    if (!this.seqCollection) {
      await this.init(mongoClient, dbInfo);
    }

    const filter = {[SequenceCounterKeys.collection]: dbInfo.collectionName};

    let updateOps;
    if (seqId) {
      const latestSeqId = (await this.seqCollection.findOne(filter))?.[SequenceCounterKeys.counter] ?? 0;

      if (seqId > latestSeqId + 1) {
        throw new SeqIdSkippingError(seqId, latestSeqId + 1);
      }

      updateOps = {$set: {[SequenceCounterKeys.counter]: seqId}};
    } else {
      updateOps = {$inc: {[SequenceCounterKeys.counter]: increase ? 1 : 0}};
    }

    return (await this.seqCollection.findOneAndUpdate(
      filter,
      updateOps,
      {
        upsert: true,
        returnOriginal: false,
      },
    )).value[SequenceCounterKeys.counter];
  }

  /**
   * Initialize the necessary properties for this sequential document.
   *
   * @param {MongoClient} mongoClient mongo client
   * @param {CollectionInfo} dbInfo database info of this sequential document
   * @private
   */
  private static async init(mongoClient: MongoClient, dbInfo: CollectionInfo): Promise<void> {
    this.seqCollection = getCollection(mongoClient, {...dbInfo, collectionName: counterCollectionName});

    // Initialize the counter field, if not yet available
    await this.seqCollection.updateOne(
      {[SequenceCounterKeys.collection]: dbInfo.collectionName},
      {$inc: {[SequenceCounterKeys.counter]: 0}},
      {
        upsert: true,
      },
    );
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
