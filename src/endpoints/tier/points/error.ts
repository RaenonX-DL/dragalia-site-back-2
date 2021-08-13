import {CustomError} from '../../../base/error';
import {KeyPointEntryDocument, KeyPointEntryDocumentKey} from './model';


/**
 * Error to be thrown when failed to get the description of a key point entry.
 */
export class DescriptionTraversalError extends CustomError {
  /**
   * Construct a description traversal error.
   *
   * @param {object} description description object of the entry
   */
  constructor(description: KeyPointEntryDocument[KeyPointEntryDocumentKey.description]) {
    super(`Failed to get the description from the object: ${JSON.stringify(description)}`);
  }
}
