import {MongoClient} from 'mongodb';


export type NextSeqIdArgs = {
  seqId?: number,
  increase?: boolean,
}


/**
 * Sequence controller.
 */
export abstract class SequencedController {
  /**
   * Get the next available sequential ID.
   *
   * @return {number} next available sequential ID
   */
  static getNextSeqId: (mongoClient: MongoClient, {seqId, increase}: NextSeqIdArgs) => Promise<number>;
}
