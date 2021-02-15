import {Collection, MongoClient, ObjectId} from 'mongodb';

import {CollectionInfo, Document, DocumentBase} from '../../../base/model';
import {ModifyNote, ModifyNoteDocument, Post} from '../base/model';

export const dbInfo: CollectionInfo = {
  dbName: 'post',
  collectionName: 'quest',
};

export type QuestPositionDocument = DocumentBase & {
  p: string,
  b: string,
  r: string,
  t: string,
}

export type QuestPostDocument = DocumentBase & {
  _seq: number,
  _lang: string,
  t: string,
  g: string,
  v: string,
  i: Array<QuestPositionDocument>,
  a: string,
  _dtMn: Array<ModifyNoteDocument>,
  _dtMod: Date,
  _dtPub: Date,
  _vc: number,
}

/**
 * Quest positional info data class.
 */
export class QuestPosition extends Document {
  position: string;
  builds: string;
  rotations: string;
  tips: string;

  /**
   * Construct a quest position data
   *
   * @param {string} position position name
   * @param {string} builds position build
   * @param {string} rotations position rotation
   * @param {string} tips position tips
   */
  constructor(position: string, builds: string, rotations: string, tips: string) {
    super();

    this.position = position;
    this.builds = builds;
    this.rotations = rotations;
    this.tips = tips;
  }

  /**
   * @inheritDoc
   */
  static fromDocument(obj: QuestPositionDocument): QuestPosition {
    return new QuestPosition(obj.p, obj.b, obj.r, obj.t);
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
  toObject(): QuestPositionDocument {
    return {
      p: this.position,
      b: this.builds,
      r: this.rotations,
      t: this.tips,
    };
  }
}

/**
 * A quest post document.
 */
export class QuestPost extends Post {
  generalInfo: string;
  video: string;
  positionInfo: Array<QuestPosition>;
  addendum: string;

  /**
   * Construct a quest post data.
   *
   * @param {number} seqId post sequential ID
   * @param {string} language post language
   * @param {string} title post title
   * @param {string} generalInfo quest general info
   * @param {string} video quest video
   * @param {string} positionInfo quest positional info
   * @param {string} addendum quest guide addendum
   * @param {Date} dateModified last modification date of the post
   * @param {Date} datePublished post publish data
   * @param {ObjectId} id object ID of the post
   * @param {Array<ModifyNote>} modificationNotes post modification notes
   * @param {number} viewCount post view count
   */
  constructor(
    seqId: number, language: string, title: string,
    generalInfo: string, video: string, positionInfo: Array<QuestPosition>, addendum: string,
    dateModified?: Date, datePublished?: Date, id?: ObjectId,
    modificationNotes?: Array<ModifyNote>, viewCount?: number,
  ) {
    super(seqId, language, title, dateModified, datePublished, id, modificationNotes, viewCount);

    this.generalInfo = generalInfo;
    this.video = video;
    this.positionInfo = positionInfo;
    this.addendum = addendum;
  }

  /**
   * @inheritDoc
   */
  static fromDocument(doc: QuestPostDocument): QuestPost {
    return new QuestPost(
      doc._seq, doc._lang, doc.t, doc.g, doc.v, doc.i.map((doc) => QuestPosition.fromDocument(doc)), doc.a,
      doc._dtMod, doc._dtPub, doc._id, doc._dtMn.map((doc) => ModifyNote.fromDocument(doc)), doc._vc,
    );
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
  toObject(): QuestPostDocument {
    return {
      _id: this.id,
      _seq: this.seqId,
      _lang: this.language,
      t: this.title,
      g: this.generalInfo,
      v: this.video,
      i: this.positionInfo.map((doc) => doc.toObject()),
      a: this.addendum,
      _dtMod: this.dateModified,
      _dtPub: this.datePublished,
      _dtMn: this.modificationNotes.map((doc) => doc.toObject()),
      _vc: this.viewCount,
    };
  }
}
