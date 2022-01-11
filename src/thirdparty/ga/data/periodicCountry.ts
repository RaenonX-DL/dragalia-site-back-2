import {google} from '@google-analytics/data/build/protos/protos';

import {
  GAPeriodicCountryUserData,
  GAPeriod,
  GAPeriodKey,
  GACountryUserEntry,
} from '../../../api-def/api';
import {gaClient, property} from '../client';
import {otherText} from './const';


export const getPeriodicCountryUser = async (countryLimit: number): Promise<GAPeriodicCountryUserData> => {
  const [response] = await gaClient.runReport({
    property,
    dateRanges: Object.entries(GAPeriod).map(([name, length]) => ({
      startDate: `${length}daysAgo`, endDate: 'today', name,
    })),
    dimensions: [{name: 'country'}],
    metrics: [{name: 'activeUsers'}],
    metricAggregations: [google.analytics.data.v1alpha.MetricAggregation.TOTAL],
  });

  const result: GAPeriodicCountryUserData = {
    D1: {
      countries: [],
      total: 0,
    },
    D7: {
      countries: [],
      total: 0,
    },
    D30: {
      countries: [],
      total: 0,
    },
  };

  let entry: GACountryUserEntry | undefined;
  Object.entries(GAPeriod).forEach(([name]) => {
    const periodName = name as GAPeriodKey;

    response.rows?.forEach((row) => {
      if (!row.dimensionValues?.some((value) => value.value === periodName) || !row.metricValues) {
        return;
      }

      const countryName = row.dimensionValues?.find((value) => value.value !== periodName);

      if (!countryName || !countryName.value) {
        return;
      }

      const user = Number(row.metricValues[0].value);

      if (!entry) {
        entry = {country: countryName.value, user};
      }

      if (result[periodName].countries.length >= countryLimit) {
        // Country count is over the limit, aggregate all data as others
        if (entry.country === otherText) {
          entry.user += user;
        } else {
          entry = {country: otherText, user};
        }
      } else {
        // Country count is less than the limit, directly add it
        result[periodName].countries.push(entry);
        entry = undefined;
      }
    });

    // Push the entry of the "others" if used
    if (entry?.country === otherText) {
      result[periodName].countries.push(entry);
      entry = undefined;
    }
  });

  // Fill data of dimensional total
  response.totals?.forEach((total) => {
    Object.entries(GAPeriod).forEach(([name]) => {
      if (!total.dimensionValues?.some((value) => value.value === name) || !total.metricValues) {
        return;
      }

      result[name as GAPeriodKey].total = Number(total.metricValues[0].value);
    });
  });

  return result;
};
