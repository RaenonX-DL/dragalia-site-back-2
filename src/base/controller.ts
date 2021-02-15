import {MongoClient} from 'mongodb';

/**
 * Sequence controller.
 */
export abstract class SequencedController {
  /**
   * Get the next available sequential ID.
   *
   * @return {number} next available sequential ID.
   */
  static getNextSeqId: (mongoClient: MongoClient) => Promise<number>;
}
