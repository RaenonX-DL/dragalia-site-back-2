import {Collection, MongoClient} from 'mongodb';
import {SeqIdSkippingError} from '../../endpoints/post/error';
import {getCollection} from '../../utils/mongodb';
import {CollectionInfo} from '../controller/info';
import {NextSeqIdArgs} from '../controller/seq';
import {Document, DocumentBase} from './base';


export enum SequentialDocumentKey {
  sequenceId = '_seq'
}

export type SequentialDocumentBase = DocumentBase & {
  [SequentialDocumentKey.sequenceId]: number,
};

/**
 * Sequential document class.
 */
export abstract class SequentialDocument extends Document {
  static readonly counterCollectionName = '_seq_counter';
  static readonly counterCollectionField = '_col';
  static readonly counterSequenceField = '_seq';

  protected static seqCollection: Collection;

  /**
   * Get the next available sequential ID.
   *
   * If seqId is specified, this method will return it and update it instead, if the number is valid.
   *
   * If increase, the counter will be increased and updated. The return will be the updated sequential ID.
   *
   * @param {MongoClient} mongoClient mongo client
   * @param {CollectionInfo} dbInfo database info of the document
   * @param {number?} seqId post desired sequential ID to use, if any
   * @param {boolean} increase increase the counter or not
   * @return {number} next available sequential ID
   * @throws {SeqIdSkippingError} if the desired seqId to use is not sequential
   */
  static async getNextSeqId(
    mongoClient: MongoClient, dbInfo: CollectionInfo, {seqId, increase}: NextSeqIdArgs,
  ): Promise<number> {
    // Initialize the collection connection, if not yet set up
    if (!this.seqCollection) {
      await this.init(mongoClient, dbInfo);
    }

    const filter = {[this.counterCollectionField]: dbInfo.collectionName};

    let updateOps;
    if (seqId) {
      const latestSeqId = (await this.seqCollection.findOne(filter))?.[this.counterSequenceField] ?? 0;

      if (seqId > latestSeqId + 1) {
        throw new SeqIdSkippingError(seqId, latestSeqId + 1);
      }

      updateOps = {$set: {[this.counterSequenceField]: seqId}};
    } else {
      updateOps = {$inc: {[this.counterSequenceField]: increase ? 1 : 0}};
    }

    return (await this.seqCollection.findOneAndUpdate(
      filter,
      updateOps,
      {
        upsert: true,
        returnOriginal: false,
      },
    )).value[this.counterSequenceField];
  }

  /**
   * Initialize the necessary properties for this sequential document.
   *
   * @param {MongoClient} mongoClient mongo client
   * @param {CollectionInfo} dbInfo database info of this sequential document
   * @private
   */
  private static async init(mongoClient: MongoClient, dbInfo: CollectionInfo): Promise<void> {
    this.seqCollection = getCollection(mongoClient, {...dbInfo, collectionName: this.counterCollectionName});

    // Initialize the counter field, if not yet available
    await this.seqCollection.updateOne(
      {[this.counterCollectionField]: dbInfo.collectionName},
      {$inc: {[this.counterSequenceField]: 0}},
      {
        upsert: true,
      },
    );
  }
}
