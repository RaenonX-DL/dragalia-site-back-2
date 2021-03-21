import {CustomError} from '../../base/error';

/**
 * Error to be thrown if the request post ID is not the next available sequential ID.
 */
export class SeqIdSkippingError extends CustomError {
  /**
   * Construct a post ID skipping error.
   *
   * @param {number} requestedSeqId sequential ID requested
   * @param {number} nextSeqId next available sequential ID
   */
  constructor(requestedSeqId: number, nextSeqId: number) {
    super(`Requested sequential ID ${requestedSeqId} is not available (next available: ${nextSeqId})`);
  }
}

/**
 * Error to be thrown if the sequential ID to be used is missing while required.
 */
export class SeqIdMissingError extends CustomError {
  /**
   * Construct a post ID missing error.
   */
  constructor() {
    super('`seqId` is missing while required.');
  }
}
