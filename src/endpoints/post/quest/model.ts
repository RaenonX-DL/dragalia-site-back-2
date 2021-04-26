import {Collection, MongoClient} from 'mongodb';

import {QuestPostPayload} from '../../../api-def/api';
import {CollectionInfo} from '../../../base/controller/info';
import {Document, DocumentBaseKey} from '../../../base/model/base';
import {EditableDocumentKey, EditNote} from '../../../base/model/editable';
import {MultiLingualDocumentKey} from '../../../base/model/multiLang';
import {SequentialDocumentKey} from '../../../base/model/seq';
import {ViewCountableDocumentKey} from '../../../base/model/viewCount';
import {Post, PostConstructParams, PostDocumentBase, PostDocumentKey} from '../base/model';
import {SeqIdMissingError} from '../error';

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

export type QuestPositionDocument = {
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
   * Construct a quest position data.
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
    return new QuestPosition(
      obj[QuestPositionDocumentKey.position],
      obj[QuestPositionDocumentKey.builds],
      obj[QuestPositionDocumentKey.rotations],
      obj[QuestPositionDocumentKey.tips],
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
  toObject(): QuestPositionDocument {
    return {
      [QuestPositionDocumentKey.position]: this.position,
      [QuestPositionDocumentKey.builds]: this.builds,
      [QuestPositionDocumentKey.rotations]: this.rotations,
      [QuestPositionDocumentKey.tips]: this.tips,
    };
  }
}

export type QuestPostConstructParams = PostConstructParams & {
  generalInfo: string,
  video: string,
  positionInfo: Array<QuestPosition>,
  addendum: string,
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
   * @param {QuestPostConstructParams} params parameters to construct a quest post data
   */
  constructor(params: QuestPostConstructParams) {
    const {
      seqId,
      language,
      title,
      generalInfo,
      video,
      positionInfo,
      addendum,
      dateModified,
      datePublished,
      id,
      editNotes,
      viewCount,
    } = params;

    super({seqId, language, title, dateModified, datePublished, id, editNotes: editNotes, viewCount});

    this.generalInfo = generalInfo;
    this.video = video;
    this.positionInfo = positionInfo;
    this.addendum = addendum;
  }

  /**
   * @inheritDoc
   */
  static fromDocument(doc: QuestPostDocument): QuestPost {
    return new QuestPost({
      seqId: doc[SequentialDocumentKey.sequenceId],
      language: doc[MultiLingualDocumentKey.language],
      title: doc[PostDocumentKey.title],
      generalInfo: doc[QuestPostDocumentKey.generalInfo],
      video: doc[QuestPostDocumentKey.video],
      positionInfo: doc[QuestPostDocumentKey.positionInfo].map((doc) => QuestPosition.fromDocument(doc)),
      addendum: doc[QuestPostDocumentKey.addendum],
      dateModified: doc[EditableDocumentKey.dateModified],
      datePublished: doc[EditableDocumentKey.datePublished],
      id: doc[DocumentBaseKey.id],
      editNotes: doc[EditableDocumentKey.editNotes].map((doc) => EditNote.fromDocument(doc)),
      viewCount: doc[ViewCountableDocumentKey.viewCount],
    });
  }

  /**
   * Convert `payload` to a `QuestPost`.
   *
   * @param {T} payload payload to be converted
   * @return {QuestPost} converted quest post instance
   */
  static fromPayload<T extends QuestPostPayload>(payload: T): QuestPost {
    if (!payload.seqId) {
      throw new SeqIdMissingError();
    }

    return new QuestPost({
      seqId: payload.seqId,
      language: payload.lang,
      title: payload.title,
      generalInfo: payload.general,
      video: payload.video,
      positionInfo: payload.positional?.map(
        (posInfo) => new QuestPosition(posInfo.position, posInfo.builds, posInfo.rotations, posInfo.tips),
      ),
      addendum: payload.addendum,
    });
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
      [EditableDocumentKey.dateModified]: this.dateModified,
      [EditableDocumentKey.datePublished]: this.datePublished,
      [EditableDocumentKey.editNotes]: this.editNotes.map((doc) => doc.toObject()),
      [ViewCountableDocumentKey.viewCount]: this.viewCount,
    };
  }
}
