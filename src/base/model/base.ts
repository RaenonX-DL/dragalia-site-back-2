import {Collection, MongoClient, ObjectId} from 'mongodb';

import {DocumentBase, DocumentBaseKey} from '../../api-def/models';
import {NotImplementedError} from '../error';


export type DocumentConstructParams = {
  id?: ObjectId,
};

/**
 * Base mongodb document class.
 */
export abstract class Document {
  id?: ObjectId;

  /**
   * Construct a mongodb document.
   *
   * @param {DocumentConstructParams} params object ID of the document
   */
  protected constructor(params?: DocumentConstructParams) {
    this.id = params?.id;
  }

  /**
   * Convert doc to this document class.
   *
   * @param {DocumentBase} doc document to be converted
   */
  static fromDocument(
    doc: DocumentBase, // eslint-disable-line @typescript-eslint/no-unused-vars
  ): Document {
    throw new NotImplementedError('`fromDocument()` must be overridden');
  }

  /**
   * Get the collection of this document.
   *
   * @param {MongoClient} mongoClient mongo client instance
   */
  static getCollection(
    mongoClient: MongoClient, // eslint-disable-line @typescript-eslint/no-unused-vars
  ): Collection<any> {
    throw new NotImplementedError('`getCollection()` must be overridden');
  }

  /**
   * Convert the current instance to a document object.
   *
   * @return {DocumentBase} document object
   */
  toObject(): DocumentBase {
    if (!this.id) {
      // Only attach `_id` if it's not undefined
      return {};
    }

    return {[DocumentBaseKey.id]: this.id};
  }
}
