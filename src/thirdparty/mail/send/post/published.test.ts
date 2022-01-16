import {ObjectId} from 'mongodb';

import {PostType, SupportedLanguages} from '../../../../api-def/api';
import {DocumentBaseKey, UserDocument, UserDocumentKey} from '../../../../api-def/models';
import {GeneralPath, makeGeneralUrl} from '../../../../api-def/paths';
import {Application, createApp} from '../../../../app';
import {User} from '../../../../endpoints/userControl/model';
import {
  SubscriptionRecord,
  SubscriptionRecordDocument,
  SubscriptionRecordDocumentKey,
} from '../../data/subscription/model';
import * as sendFuncBase from '../base';
import {sendMailPostPublished} from './published';


describe('Email sending on post published', () => {
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
        type: 'const',
        name: 'ALL_MISC',
      },
      [SubscriptionRecordDocumentKey.uid]: users[2][DocumentBaseKey.id] as ObjectId,
    },
  ];

  beforeAll(async () => {
    app = await createApp();
  });

  beforeEach(async () => {
    await app.reset();

    await User.getCollection(app.mongoClient).insertMany(users);
    await SubscriptionRecord.getCollection(app.mongoClient).insertMany(subRecs);

    jest.spyOn(sendFuncBase, 'sendMail').mockImplementation(async ({to}) => ({accepted: to, rejected: []}));
  });

  afterAll(async () => {
    await app.close();
  });

  it('sends post published email if language matches', async () => {
    const lang = SupportedLanguages.EN;

    const result = await sendMailPostPublished({
      mongoClient: app.mongoClient,
      lang,
      postType: PostType.QUEST,
      sitePath: makeGeneralUrl(GeneralPath.ABOUT, {lang}),
      title: 'Title',
    });

    expect(result.accepted).toStrictEqual([users[1][UserDocumentKey.email]]);
    expect(result.rejected).toHaveLength(0);
  });

  it('does not send post published email if language mismatches', async () => {
    const lang = SupportedLanguages.CHT;

    const result = await sendMailPostPublished({
      mongoClient: app.mongoClient,
      lang,
      postType: PostType.QUEST,
      sitePath: makeGeneralUrl(GeneralPath.ABOUT, {lang}),
      title: 'Title',
    });

    expect(result.accepted).toHaveLength(0);
    expect(result.rejected).toHaveLength(0);
  });
});
