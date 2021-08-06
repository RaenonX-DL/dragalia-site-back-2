import {MongoClient, WithTransactionCallback} from 'mongodb';

import {execTransaction} from '../../src/utils/mongodb';


export const mongoExecInTransaction = async (client: MongoClient, fn: WithTransactionCallback): Promise<void> => {
  await execTransaction(client, fn);
  // Re-connect because `execTransaction` ends the session
  await client.connect();
};
