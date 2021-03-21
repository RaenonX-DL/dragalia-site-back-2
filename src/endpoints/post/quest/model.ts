import {Collection, MongoClient, ObjectId} from 'mongodb';
import {QuestPostPayload} from '../../../api-def/api/post/quest/payload';
import {CollectionInfo} from '../../../base/controller/info';
import {Document, DocumentBase, DocumentBaseKey} from '../../../base/model/base';
import {ModifiableDocumentKey, ModifyNote} from '../../../base/model/modifiable';
import {MultiLingualDocumentKey} from '../../../base/model/multiLang';
import {SequentialDocumentKey} from '../../../base/model/seq';
import {ViewCountableDocumentKey} from '../../../base/model/viewCount';
import {Post, PostDocumentBase, PostDocumentKey} from '../base/model';

export const dbInfo: CollectionInfo = {
  dbName: 'post',
  collectionName: 'quest',
};

export enum QuestPositionDocumentKey {
  position = 'p',
  builds = 'b',
  rotations = 'r',
  tips = 't',
}

export type QuestPositionDocument = DocumentBase & {
  [QuestPositionDocumentKey.position]: string,
  [QuestPositionDocumentKey.builds]: string,
  [QuestPositionDocumentKey.rotations]: string,
  [QuestPositionDocumentKey.tips]: string,
}

export enum QuestPostDocumentKey {
  generalInfo = 'g',
  video = 'v',
  positionInfo = 'i',
  addendum = 'a',
}

export type QuestPostDocument = PostDocumentBase & {
  [QuestPostDocumentKey.generalInfo]: string,
  [QuestPostDocumentKey.video]: string,
  [QuestPostDocumentKey.positionInfo]: Array<QuestPositionDocument>,
  [QuestPostDocumentKey.addendum]: string,
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
   * Convert `payload` to a `QuestPost`.
   *
   * @param {T} payload payload to be converted
   * @return {QuestPost} converted quest post instance.
   */
  static fromPayload<T extends QuestPostPayload>(payload: T): QuestPost {
    if (!payload.seqId) {
      throw new Error('`seqId` must be provided in `payload`.');
    }

    return new QuestPost(
      payload.seqId, payload.lang,
      payload.title, payload.general, payload.video,
      payload.positional?.map(
        (posInfo) => new QuestPosition(posInfo.position, posInfo.builds, posInfo.rotations, posInfo.tips),
      ),
      payload.addendum,
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
      [DocumentBaseKey.id]: this.id,
      [SequentialDocumentKey.sequenceId]: this.seqId,
      [MultiLingualDocumentKey.language]: this.language,
      [PostDocumentKey.title]: this.title,
      [QuestPostDocumentKey.generalInfo]: this.generalInfo,
      [QuestPostDocumentKey.video]: this.video,
      [QuestPostDocumentKey.positionInfo]: this.positionInfo.map((doc) => doc.toObject()),
      [QuestPostDocumentKey.addendum]: this.addendum,
      [ModifiableDocumentKey.dateModified]: this.dateModified,
      [ModifiableDocumentKey.datePublished]: this.datePublished,
      [ModifiableDocumentKey.modificationNotes]: this.modificationNotes.map((doc) => doc.toObject()),
      [ViewCountableDocumentKey.viewCount]: this.viewCount,
    };
  }
}
