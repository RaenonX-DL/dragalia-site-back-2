import {Collection, MongoClient} from 'mongodb';
import {getCollection} from '../../utils/mongodb';
import {CollectionInfo} from '../controller/info';
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
   * If increase, the counter will be increased and updated. The return will be the updated sequential ID.
   *
   * @param {MongoClient} mongoClient mongo client
   * @param {CollectionInfo} dbInfo database info of the document
   * @param {boolean} increase increase the counter or not
   * @return {number} next available sequential ID
   */
  static async getNextSeqId(mongoClient: MongoClient, dbInfo: CollectionInfo, increase = true): Promise<number> {
    if (!this.seqCollection) {
      await this.init(mongoClient, dbInfo);
    }

    return (await this.seqCollection.findOneAndUpdate(
      {[this.counterCollectionField]: dbInfo.collectionName},
      {$inc: {[this.counterSequenceField]: increase ? 1 : 0}},
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
