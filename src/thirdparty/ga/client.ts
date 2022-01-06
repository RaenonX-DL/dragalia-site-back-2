import {BetaAnalyticsDataClient} from '@google-analytics/data';


const propertyId = '250199955';
export const property = `properties/${propertyId}`;

if (!process.env.GA_CREDENTIAL_BASE64 && !process.env.CI) {
  throw new Error(
    'Specify `GA_CREDENTIAL_BASE64` containing Google Analytics Data API credential in base64-encoded JSON.',
  );
}

/**
 * Google Analytics Data API instance.
 *
 * @see {@link https://developers.google.com/analytics/devguides/reporting/data/v1/api-schema|Documentation}
 * @type {BetaAnalyticsDataClient} Google Analytics data client
 */
export const gaClient = new BetaAnalyticsDataClient({
  credentials: JSON.parse((
    process.env.GA_CREDENTIAL_BASE64 ?
      Buffer.from(process.env.GA_CREDENTIAL_BASE64, 'base64').toString() :
      '{}'
  )),
});
