import {Collection, Document as MongoDocument, MongoClient, ObjectId} from 'mongodb';
import {getCollection, IndexInitFunction} from '../../utils/mongodb';
import {CollectionInfo} from '../controller/info';

export enum DocumentBaseKey {
  id = '_id'
}

export type DocumentBase = MongoDocument & {
  [DocumentBaseKey.id]?: ObjectId,
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
