# TheTvdbApiV2.LanguagesApi

All URIs are relative to *https://localhost/*

Method | HTTP request | Description
------------- | ------------- | -------------
[**languagesGet**](LanguagesApi.md#languagesGet) | **GET** /languages | 
[**languagesIdGet**](LanguagesApi.md#languagesIdGet) | **GET** /languages/{id} | 


<a name="languagesGet"></a>
# **languagesGet**
> InlineResponse2001 languagesGet()



All available languages. These language abbreviations can be used in the &#x60;Accept-Language&#x60; header for routes that return translation records.

### Example
```javascript
var TheTvdbApiV2 = require('the_tvdb_api_v2');
var defaultClient = TheTvdbApiV2.ApiClient.default;

// Configure API key authorization: jwtToken
var jwtToken = defaultClient.authentications['jwtToken'];
jwtToken.apiKey = 'YOUR API KEY';
// Uncomment the following line to set a prefix for the API key, e.g. "Token" (defaults to null)
//jwtToken.apiKeyPrefix = 'Token';

var apiInstance = new TheTvdbApiV2.LanguagesApi();

var callback = function(error, data, response) {
  if (error) {
    console.error(error);
  } else {
    console.log('API called successfully. Returned data: ' + data);
  }
};
apiInstance.languagesGet(callback);
```

### Parameters
This endpoint does not need any parameter.

### Return type

[**InlineResponse2001**](InlineResponse2001.md)

### Authorization

[jwtToken](../README.md#jwtToken)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

<a name="languagesIdGet"></a>
# **languagesIdGet**
> InlineResponse2001Data languagesIdGet(id)



Information about a particular language, given the language ID.

### Example
```javascript
var TheTvdbApiV2 = require('the_tvdb_api_v2');
var defaultClient = TheTvdbApiV2.ApiClient.default;

// Configure API key authorization: jwtToken
var jwtToken = defaultClient.authentications['jwtToken'];
jwtToken.apiKey = 'YOUR API KEY';
// Uncomment the following line to set a prefix for the API key, e.g. "Token" (defaults to null)
//jwtToken.apiKeyPrefix = 'Token';

var apiInstance = new TheTvdbApiV2.LanguagesApi();

var id = "id_example"; // String | ID of the language


var callback = function(error, data, response) {
  if (error) {
    console.error(error);
  } else {
    console.log('API called successfully. Returned data: ' + data);
  }
};
apiInstance.languagesIdGet(id, callback);
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **id** | **String**| ID of the language | 

### Return type

[**InlineResponse2001Data**](InlineResponse2001Data.md)

### Authorization

[jwtToken](../README.md#jwtToken)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

