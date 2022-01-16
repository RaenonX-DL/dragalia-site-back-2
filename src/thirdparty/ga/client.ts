import {BetaAnalyticsDataClient} from '@google-analytics/data';
import env from 'env-var';

import {isProduction} from '../../api-def/utils';


const propertyId = '250199955';
export const property = `properties/${propertyId}`;

const gaCredential = env.get('GA_CREDENTIAL_BASE64')
  .default('{}')
  .required(isProduction())
  .convertFromBase64()
  .asString();


/**
 * Google Analytics Data API instance.
 *
 * @see {@link https://developers.google.com/analytics/devguides/reporting/data/v1/api-schema}
 * @see {@link https://developers.google.com/analytics/devguides/reporting/data/v1/rest/v1beta/properties/runReport}
 * @type {BetaAnalyticsDataClient} Google Analytics data client
 */
export const gaClient = new BetaAnalyticsDataClient({
  credentials: JSON.parse(gaCredential),
});
