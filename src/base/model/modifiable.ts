import {Document, DocumentBase} from './base';

export enum ModifiableDocumentKey {
  datePublished = '_dtPub',
  dateModified = '_dtMod',
  modificationNotes = '_dtMn',
}

export type ModifiableDocumentBase = DocumentBase & {
  [ModifiableDocumentKey.datePublished]: Date,
  [ModifiableDocumentKey.dateModified]: Date,
  [ModifiableDocumentKey.modificationNotes]: Array<ModifyNoteDocument>,
};


export enum ModifyNoteDocumentKey {
  datetime = 'dt',
  note = 'n',
}


export type ModifyNoteDocument = DocumentBase & {
  [ModifyNoteDocumentKey.datetime]: Date,
  [ModifyNoteDocumentKey.note]: string,
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
  toObject(): ModifyNoteDocument {
    return {
      dt: this.date,
      n: this.note,
    };
  }
}
