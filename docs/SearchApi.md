# TheTvdbApiV2.SearchApi

All URIs are relative to *https://localhost/*

Method | HTTP request | Description
------------- | ------------- | -------------
[**searchSeriesGet**](SearchApi.md#searchSeriesGet) | **GET** /search/series | 
[**searchSeriesParamsGet**](SearchApi.md#searchSeriesParamsGet) | **GET** /search/series/params | 


<a name="searchSeriesGet"></a>
# **searchSeriesGet**
> InlineResponse2003 searchSeriesGet(opts)



Allows the user to search for a series based on the following parameters.

### Example
```javascript
var TheTvdbApiV2 = require('the_tvdb_api_v2');
var defaultClient = TheTvdbApiV2.ApiClient.default;

// Configure API key authorization: jwtToken
var jwtToken = defaultClient.authentications['jwtToken'];
jwtToken.apiKey = 'YOUR API KEY';
// Uncomment the following line to set a prefix for the API key, e.g. "Token" (defaults to null)
//jwtToken.apiKeyPrefix = 'Token';

var apiInstance = new TheTvdbApiV2.SearchApi();

var opts = { 
  'name': "name_example", // String | Name of the series to search for.
  'imdbId': "imdbId_example", // String | IMDB id of the series
  'zap2itId': "zap2itId_example", // String | Zap2it ID of the series to search for.
  'acceptLanguage': "acceptLanguage_example" // String | Records are returned with the Episode name and Overview in the desired language, if it exists. If there is no translation for the given language, then the record is still returned but with empty values for the translated fields.
};

var callback = function(error, data, response) {
  if (error) {
    console.error(error);
  } else {
    console.log('API called successfully. Returned data: ' + data);
  }
};
apiInstance.searchSeriesGet(opts, callback);
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **name** | **String**| Name of the series to search for. | [optional] 
 **imdbId** | **String**| IMDB id of the series | [optional] 
 **zap2itId** | **String**| Zap2it ID of the series to search for. | [optional] 
 **acceptLanguage** | **String**| Records are returned with the Episode name and Overview in the desired language, if it exists. If there is no translation for the given language, then the record is still returned but with empty values for the translated fields. | [optional] 

### Return type

[**InlineResponse2003**](InlineResponse2003.md)

### Authorization

[jwtToken](../README.md#jwtToken)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

<a name="searchSeriesParamsGet"></a>
# **searchSeriesParamsGet**
> InlineResponse2004 searchSeriesParamsGet()



Returns an array of parameters to query by in the &#x60;/search/series&#x60; route.

### Example
```javascript
var TheTvdbApiV2 = require('the_tvdb_api_v2');
var defaultClient = TheTvdbApiV2.ApiClient.default;

// Configure API key authorization: jwtToken
var jwtToken = defaultClient.authentications['jwtToken'];
jwtToken.apiKey = 'YOUR API KEY';
// Uncomment the following line to set a prefix for the API key, e.g. "Token" (defaults to null)
//jwtToken.apiKeyPrefix = 'Token';

var apiInstance = new TheTvdbApiV2.SearchApi();

var callback = function(error, data, response) {
  if (error) {
    console.error(error);
  } else {
    console.log('API called successfully. Returned data: ' + data);
  }
};
apiInstance.searchSeriesParamsGet(callback);
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

