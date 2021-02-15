import {Collection, Document as MongoDocument, MongoClient, ObjectId} from 'mongodb';
import {getCollection, IndexInitFunction} from '../utils/mongodb';

export type CollectionInfo = {
  dbName: string,
  collectionName: string,
}

export type DocumentBase = MongoDocument & {
  _id?: ObjectId,
};

/**
 * Base mongodb document class.
 */
export abstract class Document {
  id?: ObjectId;

  /**
   * Construct a mongodb document.
   *
   * @param {ObjectId} id object ID of the document
   */
  protected constructor(id?: ObjectId) {
    this.id = id;
  }

  /**
   * Convert doc to this document class.
   *
   * @param {DocumentBase} doc document to be converted
   */
  static fromDocument(doc: DocumentBase): Document { // eslint-disable-line @typescript-eslint/no-unused-vars
    throw new Error('`fromDocument()` must be overridden');
  }

  /**
   * Get the collection of this document.
   *
   * @param {MongoClient} mongoClient mongo client instance
   */
  static getCollection(mongoClient: MongoClient): Collection { // eslint-disable-line @typescript-eslint/no-unused-vars
    throw new Error('`getCollection()` must be overridden');
  }

  /**
   * Get the collection storing this document and initialize the collection indices, if any.
   *
   * @param {MongoClient} mongoClient mongo client instance
   * @param {CollectionInfo} dbInfo database info of the collection
   * @param {IndexInitFunction} indexInitFunc index initializing function
   * @return {Collection} collection of this document
   */
  protected static getCollectionWithInfo(
    mongoClient: MongoClient, dbInfo: CollectionInfo, indexInitFunc?: IndexInitFunction,
  ): Collection {
    return getCollection(mongoClient, dbInfo, indexInitFunc);
  }

  /**
   * Convert the current document to an object.
   *
   * @return {DocumentBase} document as object
   */
  abstract toObject(): DocumentBase;
}

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
