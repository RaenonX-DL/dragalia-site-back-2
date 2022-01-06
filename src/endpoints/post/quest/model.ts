import {Collection, MongoClient} from 'mongodb';

import {QuestPostBody} from '../../../api-def/api';
import {DocumentBaseKey} from '../../../api-def/models';
import {CollectionInfo} from '../../../base/controller/info';
import {Document} from '../../../base/model/base';
import {EditableDocumentKey, EditNote, EditNoteDocument} from '../../../base/model/editable';
import {MultiLingualDocumentKey} from '../../../base/model/multiLang';
import {SequentialDocumentKey} from '../../../base/model/seq';
import {ViewCountableDocumentKey} from '../../../base/model/viewCount';
import {SequencedPost, SequencedPostConstructParams, PostDocumentBase, PostDocumentKey} from '../base/model';
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
  [DocumentBaseKey.id]?: never,
  [QuestPositionDocumentKey.position]: string,
  [QuestPositionDocumentKey.builds]: string,
  [QuestPositionDocumentKey.rotations]: string,
  [QuestPositionDocumentKey.tips]: string,
};

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
};

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

export type QuestPostConstructParams = SequencedPostConstructParams & {
  generalInfo: string,
  video: string,
  positionInfo: Array<QuestPosition>,
  addendum: string,
};

/**
 * A quest post document.
 */
export class QuestPost extends SequencedPost {
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
      lang,
      title,
      generalInfo,
      video,
      positionInfo,
      addendum,
      dateModifiedEpoch,
      datePublishedEpoch,
      id,
      editNotes,
      viewCount,
    } = params;

    super({seqId, lang, title, dateModifiedEpoch, datePublishedEpoch, id, editNotes: editNotes, viewCount});

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
      id: doc[DocumentBaseKey.id],
      seqId: doc[SequentialDocumentKey.sequenceId],
      lang: doc[MultiLingualDocumentKey.language],
      title: doc[PostDocumentKey.title],
      generalInfo: doc[QuestPostDocumentKey.generalInfo],
      video: doc[QuestPostDocumentKey.video],
      positionInfo: doc[QuestPostDocumentKey.positionInfo].map(
        (doc: QuestPositionDocument) => QuestPosition.fromDocument(doc),
      ),
      addendum: doc[QuestPostDocumentKey.addendum],
      dateModifiedEpoch: doc[EditableDocumentKey.dateModifiedEpoch],
      datePublishedEpoch: doc[EditableDocumentKey.datePublishedEpoch],
      editNotes: doc[EditableDocumentKey.editNotes].map(
        (doc: EditNoteDocument) => EditNote.fromDocument(doc),
      ),
      viewCount: doc[ViewCountableDocumentKey.viewCount],
    });
  }

  /**
   * Convert `payload` to a `QuestPost`.
   *
   * @param {QuestPostBody} payload payload to be converted
   * @return {QuestPost} converted quest post instance
   */
  static fromPayload<T extends QuestPostBody>(payload: T): QuestPost {
    if (!payload.seqId) {
      throw new SeqIdMissingError();
    }

    return new QuestPost({
      seqId: payload.seqId,
      lang: payload.lang,
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
      [MultiLingualDocumentKey.language]: this.lang,
      [PostDocumentKey.title]: this.title,
      [QuestPostDocumentKey.generalInfo]: this.generalInfo,
      [QuestPostDocumentKey.video]: this.video,
      [QuestPostDocumentKey.positionInfo]: this.positionInfo.map((doc) => doc.toObject()),
      [QuestPostDocumentKey.addendum]: this.addendum,
      [EditableDocumentKey.dateModifiedEpoch]: this.dateModifiedEpoch,
      [EditableDocumentKey.datePublishedEpoch]: this.datePublishedEpoch,
      [EditableDocumentKey.editNotes]: this.editNotes.map((doc) => doc.toObject()),
      [ViewCountableDocumentKey.viewCount]: this.viewCount,
    };
  }
}
