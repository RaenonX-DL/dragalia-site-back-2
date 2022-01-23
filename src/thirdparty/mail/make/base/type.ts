import {MongoClient} from 'mongodb';
import React from 'react';

import {SupportedLanguages} from '../../../../api-def/api';


export type GenerateMailOpts = {
  lang: SupportedLanguages,
  title: string,
};

export type GenerateMailHtmlOpts<T> = T & {
  subject: string,
};

export type GenerateMailContentOpts<T> = T & {
  getSubject: (opts: T) => string,
  getText: (opts: T) => string,
  getHtml: (opts: GenerateMailHtmlOpts<T>) => React.ReactNode,
};

export type MakeMailContentUpdatedCommonOpts = {
  sitePath: string,
};

export type SendMailOpts = {
  mongoClient: MongoClient,
};
