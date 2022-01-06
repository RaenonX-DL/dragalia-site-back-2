import {BetaAnalyticsDataClient} from '@google-analytics/data';


const propertyId = '250199955';
export const property = `properties/${propertyId}`;

if (!process.env.GA_CREDENTIAL_BASE64) {
  throw new Error(
    'Specify `GA_CREDENTIAL_BASE64` containing Google Analytics Data API credential in base64-encoded JSON.',
  );
}

export const gaClient = new BetaAnalyticsDataClient({
  credentials: JSON.parse(Buffer.from(process.env.GA_CREDENTIAL_BASE64, 'base64').toString()),
});
