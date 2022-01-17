import {ObjectId} from 'mongodb';

import {SupportedLanguages} from '../../../../api-def/api';
import {DocumentBaseKey, UserDocument, UserDocumentKey} from '../../../../api-def/models';
import {makeUnitUrl, UnitPath} from '../../../../api-def/paths';
import {Application, createApp} from '../../../../app';
import {User} from '../../../../endpoints/userControl/model';
import {
  SubscriptionRecord,
  SubscriptionRecordDocument,
  SubscriptionRecordDocumentKey,
} from '../../data/subscription/model';
import * as sendFuncBase from '../base';
import {sendMailTierUpdated} from './edited';


describe('Email sending on tier updated', () => {
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
        name: 'ALL_TIER',
      },
      [SubscriptionRecordDocumentKey.uid]: users[0][DocumentBaseKey.id] as ObjectId,
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

  it('sends tier updated email if criteria matches', async () => {
    const lang = SupportedLanguages.CHT;

    const result = await sendMailTierUpdated({
      mongoClient: app.mongoClient,
      lang,
      sitePath: makeUnitUrl(UnitPath.UNIT_TIER, {lang, id: 10010101}),
      title: 'Title',
    });

    expect(result.accepted).toStrictEqual([users[0][UserDocumentKey.email]]);
    expect(result.rejected).toHaveLength(0);
  });

  it('does not send post edited email if criteria mismatches', async () => {
    const lang = SupportedLanguages.EN;

    const result = await sendMailTierUpdated({
      mongoClient: app.mongoClient,
      lang,
      sitePath: makeUnitUrl(UnitPath.UNIT_TIER, {lang, id: 10010101}),
      title: 'Title',
    });

    expect(result.accepted).toHaveLength(0);
    expect(result.rejected).toHaveLength(0);
  });
});
