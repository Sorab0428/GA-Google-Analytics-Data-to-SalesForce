# GA-Google-Analytics-Data-to-SalesForce

## Introduction

記得寫

## Before You Start

> Make sure you have the following information.

#### a Google Analytics account.

[Apply for a Google Analytics account](https://analytics.google.com/analytics/web/#/provision)

#### a service account.

[Apply for a service account](https://console.cloud.google.com/)

## How to obtain GA report two methods

### 1.Using Client Libraries

> Create a service account from an existing project or quickly create a project in the Reference section, and ensure you have a service account and a JSON key.

[Reference:Using Client Libraries doc](https://developers.google.com/analytics/devguides/config/admin/v1/quickstart-client-libraries)

> The following will be demonstrated using Node.js.

#### Set the environment variable to the service account's JSON key file.

```js
// Service account credentials
process.env["GOOGLE_APPLICATION_CREDENTIALS"] =
  "your ServiceAccountCredentials.json";
```

#### Set the GA resource ID for querying data and load the required modules.

```js
// Google Analytics 4 property ID
propertyId = "your propertyId";

// Imports the Google Analytics Data API client library.
const { BetaAnalyticsDataClient } = require("@google-analytics/data");
const analyticsDataClient = new BetaAnalyticsDataClient();
```

#### Set the query date range.

```js
// The data import reports in Google Data API usually require 24 to 48 hours. Therefore, for accurate data, it is recommended to fetch data from two days ago.
const twoDaysAgo = new Date();
twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
const twoDaysAgoISO = twoDaysAgo.toISOString().split("T")[0];
```

#### Retrieve daily data.

> Here's the code to retrieve daily active users and average page views per page

```js
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
```

#### Send data to SF.

```js
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
// Execute
DailyData();
```

#### Execute this program using Node.js.

```js
// Open CMD and execute.
node your project.js
```

### 2.using the REST API

> Ensure that your project has OAuth 2.0 keys available for use.

Apply for or quickly set up a new OAuth 2.0 keys from an existing project or using the references below.
[Reference:using the command line doc](https://developers.google.com/analytics/devguides/config/admin/v1/quickstart-cli)

#### Install and initialize the Cloud SDK

[Install the gcloud CLI](https://cloud.google.com/sdk/docs/install)

#### Open CMD with the OAuth JSON file obtained above.

```
// Authenticate
gcloud auth application-default login \
    --scopes=https://www.googleapis.com/auth/analytics.readonly \
    --client-id-file=[PATH/TO/credentials.json]
```

Modify the input format to the following:

```
gcloud auth application-default login --scopes=https://www.googleapis.com/auth/analytics.readonly --client-id-file=[PATH/TO/credentials.json]
```

_Afterward, a prompt will appear to log in to your Google account, select the project owner, and agree to Google's terms. Upon successful completion, CMD will display a prompt providing us with a JSON key package._

#### get access_token

> Then, use POSTman or another method to send a POST request to https://oauth2.googleapis.com/token to request an access_token.

\*header
Content-Type:application/x-www-form-urlencoded

\*body
client_id:your client_id
client_secret:your client_secret
refresh_token:your refresh_token
grant_type:refresh_token

\*The response will like that

```JS
{
"access_token": "your access_token",
"expires_in": 3599,
"scope": "https://www.googleapis.com/auth/analytics.readonly",
"token_type": "Bearer"
}
```

#### get GA4 data

> Subsequently, you can retrieve data by sending a POST request to https://analyticsdata.googleapis.com/v1beta/properties/{resourceID}:runReport.

\*header
Content-Type:application/json
Authorization:"Bearer " + "your access_token"

\*body

```JS
{
    "dateRanges": [
    {
        "startDate": "2024-06-02",
        "endDate": "2024-06-02"
    }
    ],
    "dimensions": [

    ],
    "metrics": [

    {
        "name": "activeUsers"
    }
    ]
}
```

## Written using apex class

#### structure

```java
public class refreshData {
    public String access_token;
    public String expires_in;
    public String scope;
    public String grant_type;
}
public class Data {
    public List<Rows> rows;
}
public class Rows {
    public List<DimensionValue> dimensionValues;
    public List<MetricValue> metricValues;
}
public class DimensionValue {
    public String value;
    public String oneValue;
}
public class MetricValue {
    public String value;
    public String oneValue;
}
```

#### Refresh the refreshToken to obtain an access token.

```java
String clientId = 'your clientId';
String clientSecret = 'your clientSecret';
String refreshToken = 'your refreshToken';
String grantType = 'refresh_token';
// Setting up Http
Http refreshTokenhttp = new Http();
HttpRequest refreshTokenRequest = new HttpRequest();
refreshTokenRequest.setEndpoint('https://oauth2.googleapis.com/token');
refreshTokenRequest.setMethod('POST');
// Header
refreshTokenRequest.setHeader('Content-Type', 'application/x-www-form-urlencoded');
// Body
String requestBody = 'client_id=' + EncodingUtil.urlEncode(clientId, 'UTF-8')
    + '&client_secret=' + EncodingUtil.urlEncode(clientSecret, 'UTF-8')
    + '&refresh_token=' + EncodingUtil.urlEncode(refreshToken, 'UTF-8')
    + '&grant_type=' + EncodingUtil.urlEncode(grantType, 'UTF-8');
refreshTokenRequest.setBody(requestBody);
// Sending request
HttpResponse refreshTokenResponse = refreshTokenhttp.send(refreshTokenRequest);
System.debug(refreshTokenResponse.getStatusCode());
System.debug(refreshTokenResponse.getBody());
```

#### Retrieve GA reports using the access token.

```java
Http accessTokenHttp1 = new Http();
HttpRequest accessTokenRequest1 = new HttpRequest();
accessTokenRequest1.setEndpoint('https://analyticsdata.googleapis.com/v1beta/properties/270166080:runReport');
accessTokenRequest1.setMethod('POST');
accessTokenRequest1.setHeader('Content-Type', 'application/json');
accessTokenRequest1.setHeader('Authorization', 'Bearer ' + refreshTokenData.access_token);

// Create a dateRanges list and add a date range
List<Map<String, String>> dateRanges = new List<Map<String, String>>();
Map<String, String> dateRange = new Map<String, String>();
dateRange.put('startDate', twoDaysAgoISO);
dateRange.put('endDate', twoDaysAgoISO);
dateRanges.add(dateRange);

// Create a dimensions list and add a dimension (this is an empty array for fetching overall active users)
List<Map<String, String>> dimensions = new List<Map<String, String>>();

// Create a metrics list and add a metric
List<Map<String, String>> metricsses = new List<Map<String, String>>();
Map<String, String> metrics = new Map<String, String>();
metrics.put('name', 'activeUsers');
metricsses.add(metrics);

// Create a JSON object
Map<String, Object> jsonBody = new Map<String, Object>();
jsonBody.put('dateRanges', dateRanges);
jsonBody.put('dimensions', dimensions);
jsonBody.put('metrics', metricsses);

// Convert to JSON string
String jsonString1 = JSON.serialize(jsonBody);
accessTokenRequest1.setBody(jsonString1);
HttpResponse accessTokenresponse1 = accessTokenHttp1.send(accessTokenRequest1);
```

#### Create records according to the custom object format.

```java
Data data1 = (Data) JSON.deserialize(accessTokenresponse1.getBody(), Data.class);
Data data2 = (Data) JSON.deserialize(accessTokenresponse2.getBody(), Data.class);

for (Rows RowItem : data2.Rows) {
    GA__c newItem = new GA__c();
    newItem.name = twoDaysAgoISO;
    newItem.DailyTraffic__c = Integer.valueOf(data1.rows[0].metricValues[0].value);
    newItem.page__c = RowItem.dimensionValues[0].value;
    newItem.AverageTimeOnPage__c = Integer.valueOf(RowItem.metricValues[0].value) / Integer.valueOf(RowItem.metricValues[1].value);
    newItem.homePageActiveUsers__c = Integer.valueOf(RowItem.metricValues[1].value);
    insert newItem;
}
```

## Ending

記得寫
