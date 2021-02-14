import {Collection, Db, MongoClient} from 'mongodb';
import {CollectionInfo} from '../base/model';

const dbPool: Record<string, Db> = {};

export const getCollection = (mongoClient: MongoClient, dbInfo: CollectionInfo): Collection => {
  if (!(dbInfo.dbName in dbPool)) {
    dbPool[dbInfo.dbName] = mongoClient.db(dbInfo.dbName);
  }

  return dbPool[dbInfo.dbName].collection(dbInfo.collectionName);
};


type DatabaseInfo = {
  name: string,
  sizeOnDisk: number,
  empty: boolean,
}

type DatabaseList = {
  databases: Array<DatabaseInfo>,
  totalSize: number,
  ok: number,
}

export const clearServer = async (client: MongoClient, skipDatabaseNames?: Array<string>): Promise<void> => {
  const databases: DatabaseList = (await client.db().admin().listDatabases()) as unknown as DatabaseList;

  if (!skipDatabaseNames) {
    skipDatabaseNames = [];
  }
  skipDatabaseNames = skipDatabaseNames.concat(['admin', 'config', 'local']);

  for (const database of databases.databases) {
    if (skipDatabaseNames.includes(database.name)) {
      continue;
    }

    for (const collection of await client.db(database.name).collections()) {
      await collection.deleteMany({});
    }
  }
};
