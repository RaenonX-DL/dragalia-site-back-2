import {Collection, Db, MongoClient} from 'mongodb';
import {CollectionInfo} from '../base/controller/info';

const dbPool: Record<string, Db> = {};
const colIndicesInit: Set<CollectionInfo> = new Set<CollectionInfo>();

export type IndexInitFunction = (collection: Collection) => void;

export const getCollection = (
  mongoClient: MongoClient, dbInfo: CollectionInfo, indexInitFunction?: IndexInitFunction,
): Collection => {
  if (!(dbInfo.dbName in dbPool)) {
    dbPool[dbInfo.dbName] = mongoClient.db(dbInfo.dbName);
  }

  const collection = dbPool[dbInfo.dbName].collection(dbInfo.collectionName);

  if (!colIndicesInit.has(dbInfo) && indexInitFunction) {
    indexInitFunction(collection);
  }

  return collection;
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
