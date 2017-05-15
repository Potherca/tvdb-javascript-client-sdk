# TheTvdbApiV2.UsersApi

All URIs are relative to *https://localhost/*

Method | HTTP request | Description
------------- | ------------- | -------------
[**userFavoritesGet**](UsersApi.md#userFavoritesGet) | **GET** /user/favorites | 
[**userFavoritesIdDelete**](UsersApi.md#userFavoritesIdDelete) | **DELETE** /user/favorites/{id} | 
[**userFavoritesIdPut**](UsersApi.md#userFavoritesIdPut) | **PUT** /user/favorites/{id} | 
[**userGet**](UsersApi.md#userGet) | **GET** /user | 
[**userRatingsGet**](UsersApi.md#userRatingsGet) | **GET** /user/ratings | 
[**userRatingsItemTypeItemIdItemRatingPut**](UsersApi.md#userRatingsItemTypeItemIdItemRatingPut) | **PUT** /user/ratings/{itemType}/{itemId}/{itemRating} | 
[**userRatingsQueryGet**](UsersApi.md#userRatingsQueryGet) | **GET** /user/ratings/query | 
[**userRatingsQueryParamsGet**](UsersApi.md#userRatingsQueryParamsGet) | **GET** /user/ratings/query/params | 


<a name="userFavoritesGet"></a>
# **userFavoritesGet**
> InlineResponse20014 userFavoritesGet()



Returns an array of favorite series for a given user, will be a blank array if no favorites exist.

### Example
```javascript
var TheTvdbApiV2 = require('the_tvdb_api_v2');
var defaultClient = TheTvdbApiV2.ApiClient.default;

// Configure API key authorization: jwtToken
var jwtToken = defaultClient.authentications['jwtToken'];
jwtToken.apiKey = 'YOUR API KEY';
// Uncomment the following line to set a prefix for the API key, e.g. "Token" (defaults to null)
//jwtToken.apiKeyPrefix = 'Token';

var apiInstance = new TheTvdbApiV2.UsersApi();

var callback = function(error, data, response) {
  if (error) {
    console.error(error);
  } else {
    console.log('API called successfully. Returned data: ' + data);
  }
};
apiInstance.userFavoritesGet(callback);
```

### Parameters
This endpoint does not need any parameter.

### Return type

[**InlineResponse20014**](InlineResponse20014.md)

### Authorization

[jwtToken](../README.md#jwtToken)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

<a name="userFavoritesIdDelete"></a>
# **userFavoritesIdDelete**
> InlineResponse20014 userFavoritesIdDelete(id)



Deletes the given series ID from the user’s favorite’s list and returns the updated list.

### Example
```javascript
var TheTvdbApiV2 = require('the_tvdb_api_v2');
var defaultClient = TheTvdbApiV2.ApiClient.default;

// Configure API key authorization: jwtToken
var jwtToken = defaultClient.authentications['jwtToken'];
jwtToken.apiKey = 'YOUR API KEY';
// Uncomment the following line to set a prefix for the API key, e.g. "Token" (defaults to null)
//jwtToken.apiKeyPrefix = 'Token';

var apiInstance = new TheTvdbApiV2.UsersApi();

var id = 789; // Number | ID of the series


var callback = function(error, data, response) {
  if (error) {
    console.error(error);
  } else {
    console.log('API called successfully. Returned data: ' + data);
  }
};
apiInstance.userFavoritesIdDelete(id, callback);
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **id** | **Number**| ID of the series | 

### Return type

[**InlineResponse20014**](InlineResponse20014.md)

### Authorization

[jwtToken](../README.md#jwtToken)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

<a name="userFavoritesIdPut"></a>
# **userFavoritesIdPut**
> InlineResponse20014 userFavoritesIdPut(id)



Adds the supplied series ID to the user’s favorite’s list and returns the updated list.

### Example
```javascript
var TheTvdbApiV2 = require('the_tvdb_api_v2');
var defaultClient = TheTvdbApiV2.ApiClient.default;

// Configure API key authorization: jwtToken
var jwtToken = defaultClient.authentications['jwtToken'];
jwtToken.apiKey = 'YOUR API KEY';
// Uncomment the following line to set a prefix for the API key, e.g. "Token" (defaults to null)
//jwtToken.apiKeyPrefix = 'Token';

var apiInstance = new TheTvdbApiV2.UsersApi();

var id = 789; // Number | ID of the series


var callback = function(error, data, response) {
  if (error) {
    console.error(error);
  } else {
    console.log('API called successfully. Returned data: ' + data);
  }
};
apiInstance.userFavoritesIdPut(id, callback);
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **id** | **Number**| ID of the series | 

### Return type

[**InlineResponse20014**](InlineResponse20014.md)

### Authorization

[jwtToken](../README.md#jwtToken)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

<a name="userGet"></a>
# **userGet**
> InlineResponse20013 userGet()



Returns basic information about the currently authenticated user.

### Example
```javascript
var TheTvdbApiV2 = require('the_tvdb_api_v2');
var defaultClient = TheTvdbApiV2.ApiClient.default;

// Configure API key authorization: jwtToken
var jwtToken = defaultClient.authentications['jwtToken'];
jwtToken.apiKey = 'YOUR API KEY';
// Uncomment the following line to set a prefix for the API key, e.g. "Token" (defaults to null)
//jwtToken.apiKeyPrefix = 'Token';

var apiInstance = new TheTvdbApiV2.UsersApi();

var callback = function(error, data, response) {
  if (error) {
    console.error(error);
  } else {
    console.log('API called successfully. Returned data: ' + data);
  }
};
apiInstance.userGet(callback);
```

### Parameters
This endpoint does not need any parameter.

### Return type

[**InlineResponse20013**](InlineResponse20013.md)

### Authorization

[jwtToken](../README.md#jwtToken)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

<a name="userRatingsGet"></a>
# **userRatingsGet**
> InlineResponse20015 userRatingsGet()



Returns an array of ratings for the given user.

### Example
```javascript
var TheTvdbApiV2 = require('the_tvdb_api_v2');
var defaultClient = TheTvdbApiV2.ApiClient.default;

// Configure API key authorization: jwtToken
var jwtToken = defaultClient.authentications['jwtToken'];
jwtToken.apiKey = 'YOUR API KEY';
// Uncomment the following line to set a prefix for the API key, e.g. "Token" (defaults to null)
//jwtToken.apiKeyPrefix = 'Token';

var apiInstance = new TheTvdbApiV2.UsersApi();

var callback = function(error, data, response) {
  if (error) {
    console.error(error);
  } else {
    console.log('API called successfully. Returned data: ' + data);
  }
};
apiInstance.userRatingsGet(callback);
```

### Parameters
This endpoint does not need any parameter.

### Return type

[**InlineResponse20015**](InlineResponse20015.md)

### Authorization

[jwtToken](../README.md#jwtToken)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

<a name="userRatingsItemTypeItemIdItemRatingPut"></a>
# **userRatingsItemTypeItemIdItemRatingPut**
> InlineResponse20016 userRatingsItemTypeItemIdItemRatingPut(itemType, itemId, itemRating)



This route updates a given rating of a given type.

### Example
```javascript
var TheTvdbApiV2 = require('the_tvdb_api_v2');
var defaultClient = TheTvdbApiV2.ApiClient.default;

// Configure API key authorization: jwtToken
var jwtToken = defaultClient.authentications['jwtToken'];
jwtToken.apiKey = 'YOUR API KEY';
// Uncomment the following line to set a prefix for the API key, e.g. "Token" (defaults to null)
//jwtToken.apiKeyPrefix = 'Token';

var apiInstance = new TheTvdbApiV2.UsersApi();

var itemType = "itemType_example"; // String | Item to update. Can be either 'series', 'episode', or 'image'

var itemId = 789; // Number | ID of the ratings record that you wish to modify

var itemRating = 789; // Number | The updated rating number


var callback = function(error, data, response) {
  if (error) {
    console.error(error);
  } else {
    console.log('API called successfully. Returned data: ' + data);
  }
};
apiInstance.userRatingsItemTypeItemIdItemRatingPut(itemType, itemId, itemRating, callback);
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **itemType** | **String**| Item to update. Can be either &#39;series&#39;, &#39;episode&#39;, or &#39;image&#39; | 
 **itemId** | **Number**| ID of the ratings record that you wish to modify | 
 **itemRating** | **Number**| The updated rating number | 

### Return type

[**InlineResponse20016**](InlineResponse20016.md)

### Authorization

[jwtToken](../README.md#jwtToken)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

<a name="userRatingsQueryGet"></a>
# **userRatingsQueryGet**
> InlineResponse20015 userRatingsQueryGet(opts)



Returns an array of ratings for a given user that match the query.

### Example
```javascript
var TheTvdbApiV2 = require('the_tvdb_api_v2');
var defaultClient = TheTvdbApiV2.ApiClient.default;

// Configure API key authorization: jwtToken
var jwtToken = defaultClient.authentications['jwtToken'];
jwtToken.apiKey = 'YOUR API KEY';
// Uncomment the following line to set a prefix for the API key, e.g. "Token" (defaults to null)
//jwtToken.apiKeyPrefix = 'Token';

var apiInstance = new TheTvdbApiV2.UsersApi();

var opts = { 
  'itemType': "itemType_example" // String | Item to query. Can be either 'series', 'episode', or 'banner'
};

var callback = function(error, data, response) {
  if (error) {
    console.error(error);
  } else {
    console.log('API called successfully. Returned data: ' + data);
  }
};
apiInstance.userRatingsQueryGet(opts, callback);
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **itemType** | **String**| Item to query. Can be either &#39;series&#39;, &#39;episode&#39;, or &#39;banner&#39; | [optional] 

### Return type

[**InlineResponse20015**](InlineResponse20015.md)

### Authorization

[jwtToken](../README.md#jwtToken)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

<a name="userRatingsQueryParamsGet"></a>
# **userRatingsQueryParamsGet**
> InlineResponse2004 userRatingsQueryParamsGet()



Returns a list of query params for use in the &#x60;/user/ratings/query&#x60; route.

### Example
```javascript
var TheTvdbApiV2 = require('the_tvdb_api_v2');
var defaultClient = TheTvdbApiV2.ApiClient.default;

// Configure API key authorization: jwtToken
var jwtToken = defaultClient.authentications['jwtToken'];
jwtToken.apiKey = 'YOUR API KEY';
// Uncomment the following line to set a prefix for the API key, e.g. "Token" (defaults to null)
//jwtToken.apiKeyPrefix = 'Token';

var apiInstance = new TheTvdbApiV2.UsersApi();

var callback = function(error, data, response) {
  if (error) {
    console.error(error);
  } else {
    console.log('API called successfully. Returned data: ' + data);
  }
};
apiInstance.userRatingsQueryParamsGet(callback);
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

