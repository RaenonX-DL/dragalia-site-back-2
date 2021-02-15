import {Collection, MongoClient, ObjectId} from 'mongodb';
import {CollectionInfo, Document, DocumentBase, SequentialDocument} from '../../../base/model';
import {IndexInitFunction} from '../../../utils/mongodb';
import {dbInfo} from '../quest/model';

export type ModifyNoteDocument = DocumentBase & {
  dt: Date,
  n: string,
}

/**
 * Post modification note data class.
 */
export class ModifyNote extends Document {
  date: Date;
  note: string;

  /**
   * Construct a post modification note document data.
   *
   * @param {Date} date post modification date
   * @param {string} note post modification note
   */
  constructor(date: Date, note: string) {
    super();

    this.date = date;
    this.note = note;
  }

  /**
   * @inheritDoc
   */
  static fromDocument(obj: ModifyNoteDocument): ModifyNote {
    return new ModifyNote(obj.dt, obj.n);
  }

  /**
   * @inheritDoc
   */
  static getCollection(mongoClient: MongoClient): Collection {
    return super.getCollectionWithInfo(mongoClient, dbInfo);
  }

  /**
   * @inheritDoc
   */
  toObject(): ModifyNoteDocument {
    return {
      dt: this.date,
      n: this.note,
    };
  }
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
      collection.createIndex([{_seq: -1}, {_lang: 1}], {unique: true});
    }));
  }
}
