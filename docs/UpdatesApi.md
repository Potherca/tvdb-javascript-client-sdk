# TheTvdbApiV2.UpdatesApi

All URIs are relative to *https://localhost/*

Method | HTTP request | Description
------------- | ------------- | -------------
[**updatedQueryGet**](UpdatesApi.md#updatedQueryGet) | **GET** /updated/query | 
[**updatedQueryParamsGet**](UpdatesApi.md#updatedQueryParamsGet) | **GET** /updated/query/params | 


<a name="updatedQueryGet"></a>
# **updatedQueryGet**
> InlineResponse20012 updatedQueryGet(fromTime, opts)



Returns an array of series that have changed in a maximum of one week blocks since the provided &#x60;fromTime&#x60;.   The user may specify a &#x60;toTime&#x60; to grab results for less than a week. Any timespan larger than a week will be reduced down to one week automatically.

### Example
```javascript
var TheTvdbApiV2 = require('the_tvdb_api_v2');
var defaultClient = TheTvdbApiV2.ApiClient.default;

// Configure API key authorization: jwtToken
var jwtToken = defaultClient.authentications['jwtToken'];
jwtToken.apiKey = 'YOUR API KEY';
// Uncomment the following line to set a prefix for the API key, e.g. "Token" (defaults to null)
//jwtToken.apiKeyPrefix = 'Token';

var apiInstance = new TheTvdbApiV2.UpdatesApi();

var fromTime = "fromTime_example"; // String | Epoch time to start your date range.

var opts = { 
  'toTime': "toTime_example", // String | Epoch time to end your date range. Must be one week from `fromTime`.
  'acceptLanguage': "acceptLanguage_example" // String | Records are returned with the Episode name and Overview in the desired language, if it exists. If there is no translation for the given language, then the record is still returned but with empty values for the translated fields.
};

var callback = function(error, data, response) {
  if (error) {
    console.error(error);
  } else {
    console.log('API called successfully. Returned data: ' + data);
  }
};
apiInstance.updatedQueryGet(fromTime, opts, callback);
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **fromTime** | **String**| Epoch time to start your date range. | 
 **toTime** | **String**| Epoch time to end your date range. Must be one week from &#x60;fromTime&#x60;. | [optional] 
 **acceptLanguage** | **String**| Records are returned with the Episode name and Overview in the desired language, if it exists. If there is no translation for the given language, then the record is still returned but with empty values for the translated fields. | [optional] 

### Return type

[**InlineResponse20012**](InlineResponse20012.md)

### Authorization

[jwtToken](../README.md#jwtToken)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

<a name="updatedQueryParamsGet"></a>
# **updatedQueryParamsGet**
> InlineResponse2004 updatedQueryParamsGet()



Returns an array of valid query keys for the &#x60;/updated/query/params&#x60; route.

### Example
```javascript
var TheTvdbApiV2 = require('the_tvdb_api_v2');
var defaultClient = TheTvdbApiV2.ApiClient.default;

// Configure API key authorization: jwtToken
var jwtToken = defaultClient.authentications['jwtToken'];
jwtToken.apiKey = 'YOUR API KEY';
// Uncomment the following line to set a prefix for the API key, e.g. "Token" (defaults to null)
//jwtToken.apiKeyPrefix = 'Token';

var apiInstance = new TheTvdbApiV2.UpdatesApi();

var callback = function(error, data, response) {
  if (error) {
    console.error(error);
  } else {
    console.log('API called successfully. Returned data: ' + data);
  }
};
apiInstance.updatedQueryParamsGet(callback);
```

### Parameters
This endpoint does not need any parameter.

### Return type

[**InlineResponse2004**](InlineResponse2004.md)

### Authorization

[jwtToken](../README.md#jwtToken)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

