import {DimensionKey} from '../../../api-def/api';
import {CustomError} from '../../../base/error';
import {TierNoteEntryDocument, TierNoteEntryDocumentKey} from './model';


/**
 * Error to be thrown when failed to get the tier note in a certain language.
 */
export class TierNoteTraversalError extends CustomError {
  /**
   * Construct a tier note traversal error.
   *
   * @param {DimensionKey} dimension tier note dimension that causes the error
   * @param {object} note note object of the tier note
   */
  constructor(dimension: DimensionKey, note: TierNoteEntryDocument[TierNoteEntryDocumentKey.note]) {
    super(`Failed to get the tier note from the tier note of ${dimension}: ${JSON.stringify(note)}`);
  }
}
