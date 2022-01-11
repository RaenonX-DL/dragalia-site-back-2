import {DocumentBase} from '../../api-def/models';
import {Document} from './base';


export enum EditableDocumentKey {
  datePublishedEpoch = '_dtPub',
  dateModifiedEpoch = '_dtMod',
  editNotes = '_dtMn',
}

export type EditableDocumentBase = DocumentBase & {
  [EditableDocumentKey.datePublishedEpoch]: number,
  [EditableDocumentKey.dateModifiedEpoch]: number,
  [EditableDocumentKey.editNotes]: Array<EditNoteDocument>,
};


export enum EditNoteDocumentKey {
  timestampEpoch = 'dt',
  note = 'n',
}


export type EditNoteDocument = DocumentBase & {
  [EditNoteDocumentKey.timestampEpoch]: number,
  [EditNoteDocumentKey.note]: string,
};


/**
 * Post edit note data class.
 */
export class EditNote extends Document {
  timestampEpoch: number;
  note: string;

  /**
   * Construct a post edit note document data.
   *
   * @param {number} timestampEpoch post edit timestamp epoch
   * @param {string} note post modification note
   */
  constructor(timestampEpoch: number, note: string) {
    super();

    this.timestampEpoch = timestampEpoch;
    this.note = note;
  }

  /**
   * @inheritDoc
   */
  static fromDocument(obj: EditNoteDocument): EditNote {
    return new EditNote(
      obj[EditNoteDocumentKey.timestampEpoch],
      obj[EditNoteDocumentKey.note],
    );
  }

  /**
   * @inheritDoc
   */
  toObject(): EditNoteDocument {
    return {
      [EditNoteDocumentKey.timestampEpoch]: this.timestampEpoch,
      [EditNoteDocumentKey.note]: this.note,
    };
  }
}
