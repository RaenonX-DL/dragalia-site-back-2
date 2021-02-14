import {Collection, MongoClient, ObjectId} from 'mongodb';
import {getCollection} from '../utils/mongodb';

export type CollectionInfo = {
  dbName: string,
  collectionName: string,
}

export type DocumentBase = {
  _id?: ObjectId,
};

/**
 * Base mongodb document class.
 */
export class Document {
  id?: ObjectId;

  /**
   * Construct a mongodb document.
   *
   * @param {ObjectId} id object ID of the document
   */
  constructor(id?: ObjectId) {
    this.id = id;
  }

  /**
   * Convert obj from object to a {@linkcode Document}.
   *
   * @param {DocumentBase} obj object to be converted
   * @return {Document} converted document
   */
  static fromObject(obj: DocumentBase): Document {
    return new Document(obj._id);
  }

  /**
   * Get the collection of this document.
   *
   * @param {MongoClient} mongoClient mongo client instance
   * @param {CollectionInfo} dbInfo database info of the collection
   * @return {Collection}collection of this document
   */
  protected static getCollectionWithInfo(
    mongoClient: MongoClient, dbInfo: CollectionInfo,
  ): Collection {
    return getCollection(mongoClient, dbInfo);
  }

  /**
   * Convert the current document to an object.
   *
   * @return {DocumentBase} document as object
   */
  toObject(): DocumentBase {
    const ret: DocumentBase = {};

    if (this.id) {
      ret._id = this.id;
    }

    return ret;
  }
}
