import {Document, DocumentBase} from './base';

export enum EditableDocumentKey {
  datePublished = '_dtPub',
  dateModified = '_dtMod',
  editNotes = '_dtMn',
}

export type EditableDocumentBase = DocumentBase & {
  [EditableDocumentKey.datePublished]: Date,
  [EditableDocumentKey.dateModified]: Date,
  [EditableDocumentKey.editNotes]: Array<EditNoteDocument>,
};


export enum EditNoteDocumentKey {
  datetime = 'dt',
  note = 'n',
}


export type EditNoteDocument = DocumentBase & {
  [EditNoteDocumentKey.datetime]: Date,
  [EditNoteDocumentKey.note]: string,
}


/**
 * Post edit note data class.
 */
export class EditNote extends Document {
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
  static fromDocument(obj: EditNoteDocument): EditNote {
    return new EditNote(obj.dt, obj.n);
  }

  /**
   * @inheritDoc
   */
  toObject(): EditNoteDocument {
    return {
      dt: this.date,
      n: this.note,
    };
  }
}
