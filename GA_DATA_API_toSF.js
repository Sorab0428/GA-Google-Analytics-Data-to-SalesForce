// Service account credentials
process.env["GOOGLE_APPLICATION_CREDENTIALS"] =
  "your ServiceAccountCredentials.json";

// Google Analytics 4 property ID
propertyId = "your propertyId";

// Imports the Google Analytics Data API client library.
const { BetaAnalyticsDataClient } = require("@google-analytics/data");
const analyticsDataClient = new BetaAnalyticsDataClient();

// The data import reports in Google Data API usually require 24 to 48 hours. Therefore, for accurate data, it is recommended to fetch data from two days ago.
const twoDaysAgo = new Date();
twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
const twoDaysAgoISO = twoDaysAgo.toISOString().split("T")[0];

// Get daily data.
async function DailyData() {
  // AverageDailyTraffic
  const [responseAverageDailyTraffic] = await analyticsDataClient.runReport({
    property: `properties/${propertyId}`,
    dateRanges: [
      {
        startDate: twoDaysAgoISO,
        endDate: twoDaysAgoISO,
      },
    ],
    dimensions: [],
    metrics: [
      {
        name: "activeUsers",
      },
    ],
  });
  // AverageTimeOnPage
  const [responseAverageTimeOnPage] = await analyticsDataClient.runReport({
    property: `properties/${propertyId}`,
    dateRanges: [
      {
        startDate: twoDaysAgoISO,
        endDate: twoDaysAgoISO,
      },
    ],
    dimensions: [
      {
        name: "pageTitle",
      },
    ],
    metrics: [
      {
        name: "userEngagementDuration",
      },
      {
        name: "activeUsers",
      },
    ],
  });

  // AverageDailyTraffic
  let AverageDailyTraffic =
    responseAverageDailyTraffic.rows[0].metricValues[0].value;
  // data
  const dailyPageData = responseAverageTimeOnPage.rows;
  // send data to SF
  sendRequestToSF(AverageDailyTraffic, dailyPageData);
}

function sendRequestToSF(AverageDailyTraffic, dailyPageData) {
  const url = "your salasForce endpoint/services/apexrest/GA_Test_GetData";
  const data = {
    twoDaysAgo: twoDaysAgoISO,
    dailyTraffic: AverageDailyTraffic,
    pageData: dailyPageData,
  };
  fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      return response.json();
    })
    .then((data) => {
      console.log(data);
    })
    .catch((error) => {
      console.error("Fetch error:", error);
    });
}
DailyData();
