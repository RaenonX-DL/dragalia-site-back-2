import {Collection, MongoClient, ObjectId} from 'mongodb';
import {CollectionInfo} from '../../../base/controller/info';
import {ModifiableDocumentBase, ModifyNote} from '../../../base/model/modifiable';
import {MultiLingualDocumentBase, MultiLingualDocumentKey} from '../../../base/model/multiLang';
import {SequentialDocument, SequentialDocumentBase, SequentialDocumentKey} from '../../../base/model/seq';
import {ViewCountableDocumentBase} from '../../../base/model/viewCount';
import {IndexInitFunction} from '../../../utils/mongodb';


export enum PostDocumentKey {
  title = 't',
}


export type PostDocumentBase =
  MultiLingualDocumentBase
  & SequentialDocumentBase
  & ModifiableDocumentBase
  & ViewCountableDocumentBase
  & {
  [PostDocumentKey.title]: string,
}


/**
 * Post data class.
 */
export abstract class Post extends SequentialDocument {
  seqId: number;
  language: string;
  title: string;
  dateModified: Date;
  datePublished: Date;
  modificationNotes: Array<ModifyNote>;
  viewCount: number;

  /**
   * Construct a post data.
   *
   * @param {number} seqId post sequential ID
   * @param {string} language post language
   * @param {string} title post title
   * @param {Date} dateModified last modification date of the post
   * @param {Date} datePublished post publish data
   * @param {ObjectId} id object ID of the post
   * @param {Array<ModifyNote>} modificationNotes post modification notes
   * @param {number} viewCount post view count
   */
  protected constructor(
    seqId: number, language: string, title: string,
    dateModified?: Date, datePublished?: Date, id?: ObjectId,
    modificationNotes?: Array<ModifyNote>, viewCount?: number,
  ) {
    super(id);

    const now = new Date();

    this.seqId = seqId;
    this.language = language;
    this.title = title;
    this.dateModified = dateModified || now;
    this.datePublished = dateModified || now;
    this.modificationNotes = modificationNotes || [];
    this.viewCount = viewCount || 0;
  }

  /**
   * @inheritDoc
   */
  protected static getCollectionWithInfo(
    mongoClient: MongoClient, dbInfo: CollectionInfo, indexInitFunc?: IndexInitFunction,
  ): Collection {
    return super.getCollectionWithInfo(mongoClient, dbInfo, ((collection) => {
      if (indexInitFunc) {
        indexInitFunc(collection);
      }
      collection.createIndex(
        [
          {[SequentialDocumentKey.sequenceId]: -1},
          {[MultiLingualDocumentKey.language]: 1},
        ],
        {unique: true},
      );
    }));
  }
}
