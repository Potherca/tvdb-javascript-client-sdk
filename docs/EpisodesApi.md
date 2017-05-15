# TheTvdbApiV2.EpisodesApi

All URIs are relative to *https://localhost/*

Method | HTTP request | Description
------------- | ------------- | -------------
[**episodesIdGet**](EpisodesApi.md#episodesIdGet) | **GET** /episodes/{id} | 


<a name="episodesIdGet"></a>
# **episodesIdGet**
> InlineResponse200 episodesIdGet(id, opts)



Returns the full information for a given episode id. __Deprecation Warning:__ The _director_ key will be deprecated in favor of the new _directors_ key in a future release.

### Example
```javascript
var TheTvdbApiV2 = require('the_tvdb_api_v2');
var defaultClient = TheTvdbApiV2.ApiClient.default;

// Configure API key authorization: jwtToken
var jwtToken = defaultClient.authentications['jwtToken'];
jwtToken.apiKey = 'YOUR API KEY';
// Uncomment the following line to set a prefix for the API key, e.g. "Token" (defaults to null)
//jwtToken.apiKeyPrefix = 'Token';

var apiInstance = new TheTvdbApiV2.EpisodesApi();

var id = 789; // Number | ID of the episode

var opts = { 
  'acceptLanguage': "acceptLanguage_example" // String | Records are returned with the Episode name and Overview in the desired language, if it exists. If there is no translation for the given language, then the record is still returned but with empty values for the translated fields.
};

var callback = function(error, data, response) {
  if (error) {
    console.error(error);
  } else {
    console.log('API called successfully. Returned data: ' + data);
  }
};
apiInstance.episodesIdGet(id, opts, callback);
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **id** | **Number**| ID of the episode | 
 **acceptLanguage** | **String**| Records are returned with the Episode name and Overview in the desired language, if it exists. If there is no translation for the given language, then the record is still returned but with empty values for the translated fields. | [optional] 

### Return type

[**InlineResponse200**](InlineResponse200.md)

### Authorization

[jwtToken](../README.md#jwtToken)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

