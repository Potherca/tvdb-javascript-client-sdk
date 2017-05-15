# TheTvdbApiV2.AuthenticationApi

All URIs are relative to *https://localhost/*

Method | HTTP request | Description
------------- | ------------- | -------------
[**loginPost**](AuthenticationApi.md#loginPost) | **POST** /login | 
[**refreshTokenGet**](AuthenticationApi.md#refreshTokenGet) | **GET** /refresh_token | 


<a name="loginPost"></a>
# **loginPost**
> InlineResponse2002 loginPost(authenticationString)



Returns a session token to be included in the rest of the requests. Note that API key authentication is required for all subsequent requests and user auth is required for routes in the &#x60;User&#x60; section

### Example
```javascript
var TheTvdbApiV2 = require('the_tvdb_api_v2');

var apiInstance = new TheTvdbApiV2.AuthenticationApi();

var authenticationString = new TheTvdbApiV2.AuthenticationString(); // AuthenticationString | JSON string containing your authentication details.


var callback = function(error, data, response) {
  if (error) {
    console.error(error);
  } else {
    console.log('API called successfully. Returned data: ' + data);
  }
};
apiInstance.loginPost(authenticationString, callback);
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **authenticationString** | [**AuthenticationString**](AuthenticationString.md)| JSON string containing your authentication details. | 

### Return type

[**InlineResponse2002**](InlineResponse2002.md)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

<a name="refreshTokenGet"></a>
# **refreshTokenGet**
> InlineResponse2002 refreshTokenGet()



Refreshes your current, valid JWT token and returns a new token. Hit this route so that you do not have to post to &#x60;/login&#x60; with your API key and credentials once you have already been authenticated.

### Example
```javascript
var TheTvdbApiV2 = require('the_tvdb_api_v2');
var defaultClient = TheTvdbApiV2.ApiClient.default;

// Configure API key authorization: jwtToken
var jwtToken = defaultClient.authentications['jwtToken'];
jwtToken.apiKey = 'YOUR API KEY';
// Uncomment the following line to set a prefix for the API key, e.g. "Token" (defaults to null)
//jwtToken.apiKeyPrefix = 'Token';

var apiInstance = new TheTvdbApiV2.AuthenticationApi();

var callback = function(error, data, response) {
  if (error) {
    console.error(error);
  } else {
    console.log('API called successfully. Returned data: ' + data);
  }
};
apiInstance.refreshTokenGet(callback);
```

### Parameters
This endpoint does not need any parameter.

### Return type

[**InlineResponse2002**](InlineResponse2002.md)

### Authorization

[jwtToken](../README.md#jwtToken)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

