import {Collection, MongoClient} from 'mongodb';

import {MiscPostBody} from '../../../api-def/api';
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
  collectionName: 'misc',
};

export enum MiscSectionDocumentKey {
  title = 't',
  content = 'c',
}

export type MiscSectionDocument = {
  [DocumentBaseKey.id]?: never,
  [MiscSectionDocumentKey.title]: string,
  [MiscSectionDocumentKey.content]: string,
};

export enum MiscPostDocumentKey {
  sections = 's',
}

export type MiscPostDocument = PostDocumentBase & {
  [MiscPostDocumentKey.sections]: Array<MiscSectionDocument>,
};

/**
 * Misc post section data class.
 */
export class MiscSection extends Document {
  title: string;
  content: string;

  /**
   * Construct a misc section data.
   *
   * @param {string} title section title
   * @param {string} content section content
   */
  constructor(title: string, content: string) {
    super();

    this.title = title;
    this.content = content;
  }

  /**
   * @inheritDoc
   */
  static fromDocument(obj: MiscSectionDocument): MiscSection {
    return new MiscSection(
      obj[MiscSectionDocumentKey.title],
      obj[MiscSectionDocumentKey.content],
    );
  }

  /**
   * @inheritDoc
   */
  toObject(): MiscSectionDocument {
    return {
      [MiscSectionDocumentKey.title]: this.title,
      [MiscSectionDocumentKey.content]: this.content,
    };
  }
}

export type MiscPostConstructParams = SequencedPostConstructParams & {
  sections: Array<MiscSection>
};

/**
 * A misc post document.
 */
export class MiscPost extends SequencedPost {
  sections: Array<MiscSection>;

  /**
   * Construct a misc post data.
   *
   * @param {MiscPostConstructParams} params parameters to construct a misc post data
   */
  constructor(params: MiscPostConstructParams) {
    const {seqId, lang, title, dateModifiedEpoch, datePublishedEpoch, id, editNotes, viewCount, sections} = params;

    super({seqId, lang, title, dateModifiedEpoch, datePublishedEpoch, id, editNotes: editNotes, viewCount});

    this.sections = sections;
  }

  /**
   * @inheritDoc
   */
  static fromDocument(doc: MiscPostDocument): MiscPost {
    return new MiscPost({
      id: doc[DocumentBaseKey.id],
      seqId: doc[SequentialDocumentKey.sequenceId],
      lang: doc[MultiLingualDocumentKey.language],
      title: doc[PostDocumentKey.title],
      sections: doc[MiscPostDocumentKey.sections].map(
        (doc: MiscSectionDocument) => MiscSection.fromDocument(doc),
      ),
      dateModifiedEpoch: doc[EditableDocumentKey.dateModifiedEpoch],
      datePublishedEpoch: doc[EditableDocumentKey.datePublishedEpoch],
      editNotes: doc[EditableDocumentKey.editNotes].map(
        (doc: EditNoteDocument) => EditNote.fromDocument(doc),
      ),
      viewCount: doc[ViewCountableDocumentKey.viewCount],
    });
  }

  /**
   * Convert `payload` to a `MiscPost`.
   *
   * @param {MiscPostBody} payload payload to be converted
   * @return {QuestPost} converted misc post instance
   */
  static fromPayload<T extends MiscPostBody>(payload: T): MiscPost {
    if (!payload.seqId) {
      throw new SeqIdMissingError();
    }

    return new MiscPost({
      seqId: payload.seqId,
      lang: payload.lang,
      title: payload.title,
      sections: payload.sections.map(
        (section) => new MiscSection(section.title, section.content),
      ),
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
  toObject(): MiscPostDocument {
    return {
      [DocumentBaseKey.id]: this.id,
      [SequentialDocumentKey.sequenceId]: this.seqId,
      [MultiLingualDocumentKey.language]: this.lang,
      [PostDocumentKey.title]: this.title,
      [MiscPostDocumentKey.sections]: this.sections.map((doc) => doc.toObject()),
      [EditableDocumentKey.dateModifiedEpoch]: this.dateModifiedEpoch,
      [EditableDocumentKey.datePublishedEpoch]: this.datePublishedEpoch,
      [EditableDocumentKey.editNotes]: this.editNotes.map((doc) => doc.toObject()),
      [ViewCountableDocumentKey.viewCount]: this.viewCount,
    };
  }
}
