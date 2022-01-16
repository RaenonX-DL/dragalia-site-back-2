import React from 'react';

import {MailContent} from '../../type';
import {generateMailContent} from '../base/make';
import {MailContentPublishedComponent} from './html';
import {makeMailContentPublishedText} from './text';
import {makeMailContentPublishedTitle} from './title';
import {MakeMailContentPublishedOpts} from './type';


export const makeMailContentPublished = (opts: MakeMailContentPublishedOpts): MailContent => {
  return generateMailContent({
    ...opts,
    getSubject: makeMailContentPublishedTitle,
    getText: makeMailContentPublishedText,
    getHtml: (opts) => <MailContentPublishedComponent {...opts}/>,
  });
};
