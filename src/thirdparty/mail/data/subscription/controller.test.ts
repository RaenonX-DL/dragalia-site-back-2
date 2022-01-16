import {ObjectId} from 'mongodb';

import {PostType, SupportedLanguages} from '../../../../api-def/api';
import {DocumentBaseKey, UserDocument, UserDocumentKey} from '../../../../api-def/models';
import {Application, createApp} from '../../../../app';
import {User} from '../../../../endpoints/userControl/model';
import {SubscriptionRecordController} from './controller';
import {
  SubscriptionRecord,
  SubscriptionRecordDocument,
  SubscriptionRecordDocumentKey,
} from './model';


describe('Subscription record controller', () => {
  let app: Application;

  const users: UserDocument[] = [...Array(10).keys()]
    .map((num) => ({
      [DocumentBaseKey.id]: new ObjectId(),
      email: `${num}@example.com`,
      name: num.toString(),
      image: num.toString(),
      isAdmin: false,
      lang: num % 2 === 0 ? SupportedLanguages.CHT : SupportedLanguages.EN,
    }));

  const subRecs: SubscriptionRecordDocument[] = [
    {
      [SubscriptionRecordDocumentKey.key]: {
        type: 'const',
        name: 'ALL_QUEST',
      },
      [SubscriptionRecordDocumentKey.uid]: users[1][DocumentBaseKey.id] as ObjectId,
    },
    {
      [SubscriptionRecordDocumentKey.key]: {
        type: 'post',
        postType: PostType.QUEST,
        id: 7,
      },
      [SubscriptionRecordDocumentKey.uid]: users[1][DocumentBaseKey.id] as ObjectId,
    },
    {
      [SubscriptionRecordDocumentKey.key]: {
        type: 'const',
        name: 'ALL_MISC',
      },
      [SubscriptionRecordDocumentKey.uid]: users[3][DocumentBaseKey.id] as ObjectId,
    },
  ];

  beforeAll(async () => {
    app = await createApp();
  });

  beforeEach(async () => {
    await app.reset();

    await User.getCollection(app.mongoClient).insertMany(users);
    await SubscriptionRecord.getCollection(app.mongoClient).insertMany(subRecs);
  });

  afterAll(async () => {
    await app.close();
  });

  it('gets correct recipients of post key', async () => {
    const recipients = await SubscriptionRecordController.getRecipients(
      app.mongoClient, SupportedLanguages.EN, [{type: 'post', postType: PostType.QUEST, id: 7}],
    );

    expect(recipients).toStrictEqual([users[1][UserDocumentKey.email]]);
  });

  it('gets correct recipients of const key', async () => {
    const recipients = await SubscriptionRecordController.getRecipients(
      app.mongoClient, SupportedLanguages.EN, [{type: 'const', name: 'ALL_QUEST'}],
    );

    expect(recipients).toStrictEqual([users[1][UserDocumentKey.email]]);
  });

  it('returns empty list if none of the keys match', async () => {
    const recipients = await SubscriptionRecordController.getRecipients(
      app.mongoClient, SupportedLanguages.EN, [{type: 'post', postType: PostType.QUEST, id: 8}],
    );

    expect(recipients).toHaveLength(0);
  });

  it('returns empty list if language mismatches', async () => {
    const recipients = await SubscriptionRecordController.getRecipients(
      app.mongoClient, SupportedLanguages.CHT, [{type: 'post', postType: PostType.QUEST, id: 7}],
    );

    expect(recipients).toHaveLength(0);
  });

  it('does not return duplicated recipients with multiple criteria', async () => {
    const recipients = await SubscriptionRecordController.getRecipients(
      app.mongoClient, SupportedLanguages.EN,
      [{type: 'post', postType: PostType.QUEST, id: 7}, {type: 'const', name: 'ALL_QUEST'}],
    );

    expect(recipients).toStrictEqual([users[1][UserDocumentKey.email]]);
  });
});
