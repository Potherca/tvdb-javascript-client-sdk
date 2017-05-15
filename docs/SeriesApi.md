# TheTvdbApiV2.SeriesApi

All URIs are relative to *https://localhost/*

Method | HTTP request | Description
------------- | ------------- | -------------
[**seriesIdActorsGet**](SeriesApi.md#seriesIdActorsGet) | **GET** /series/{id}/actors | 
[**seriesIdEpisodesGet**](SeriesApi.md#seriesIdEpisodesGet) | **GET** /series/{id}/episodes | 
[**seriesIdEpisodesQueryGet**](SeriesApi.md#seriesIdEpisodesQueryGet) | **GET** /series/{id}/episodes/query | 
[**seriesIdEpisodesQueryParamsGet**](SeriesApi.md#seriesIdEpisodesQueryParamsGet) | **GET** /series/{id}/episodes/query/params | 
[**seriesIdEpisodesSummaryGet**](SeriesApi.md#seriesIdEpisodesSummaryGet) | **GET** /series/{id}/episodes/summary | 
[**seriesIdFilterGet**](SeriesApi.md#seriesIdFilterGet) | **GET** /series/{id}/filter | 
[**seriesIdFilterParamsGet**](SeriesApi.md#seriesIdFilterParamsGet) | **GET** /series/{id}/filter/params | 
[**seriesIdGet**](SeriesApi.md#seriesIdGet) | **GET** /series/{id} | 
[**seriesIdHead**](SeriesApi.md#seriesIdHead) | **HEAD** /series/{id} | 
[**seriesIdImagesGet**](SeriesApi.md#seriesIdImagesGet) | **GET** /series/{id}/images | 
[**seriesIdImagesQueryGet**](SeriesApi.md#seriesIdImagesQueryGet) | **GET** /series/{id}/images/query | 
[**seriesIdImagesQueryParamsGet**](SeriesApi.md#seriesIdImagesQueryParamsGet) | **GET** /series/{id}/images/query/params | 


<a name="seriesIdActorsGet"></a>
# **seriesIdActorsGet**
> InlineResponse2006 seriesIdActorsGet(id)



Returns actors for the given series id

### Example
```javascript
var TheTvdbApiV2 = require('the_tvdb_api_v2');
var defaultClient = TheTvdbApiV2.ApiClient.default;

// Configure API key authorization: jwtToken
var jwtToken = defaultClient.authentications['jwtToken'];
jwtToken.apiKey = 'YOUR API KEY';
// Uncomment the following line to set a prefix for the API key, e.g. "Token" (defaults to null)
//jwtToken.apiKeyPrefix = 'Token';

var apiInstance = new TheTvdbApiV2.SeriesApi();

var id = 789; // Number | ID of the series


var callback = function(error, data, response) {
  if (error) {
    console.error(error);
  } else {
    console.log('API called successfully. Returned data: ' + data);
  }
};
apiInstance.seriesIdActorsGet(id, callback);
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **id** | **Number**| ID of the series | 

### Return type

[**InlineResponse2006**](InlineResponse2006.md)

### Authorization

[jwtToken](../README.md#jwtToken)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

<a name="seriesIdEpisodesGet"></a>
# **seriesIdEpisodesGet**
> InlineResponse2007 seriesIdEpisodesGet(id, opts)



All episodes for a given series. Paginated with 100 results per page.

### Example
```javascript
var TheTvdbApiV2 = require('the_tvdb_api_v2');
var defaultClient = TheTvdbApiV2.ApiClient.default;

// Configure API key authorization: jwtToken
var jwtToken = defaultClient.authentications['jwtToken'];
jwtToken.apiKey = 'YOUR API KEY';
// Uncomment the following line to set a prefix for the API key, e.g. "Token" (defaults to null)
//jwtToken.apiKeyPrefix = 'Token';

var apiInstance = new TheTvdbApiV2.SeriesApi();

var id = 789; // Number | ID of the series

var opts = { 
  'page': "page_example" // String | Page of results to fetch. Defaults to page 1 if not provided.
};

var callback = function(error, data, response) {
  if (error) {
    console.error(error);
  } else {
    console.log('API called successfully. Returned data: ' + data);
  }
};
apiInstance.seriesIdEpisodesGet(id, opts, callback);
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **id** | **Number**| ID of the series | 
 **page** | **String**| Page of results to fetch. Defaults to page 1 if not provided. | [optional] 

### Return type

[**InlineResponse2007**](InlineResponse2007.md)

### Authorization

[jwtToken](../README.md#jwtToken)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

<a name="seriesIdEpisodesQueryGet"></a>
# **seriesIdEpisodesQueryGet**
> InlineResponse2007 seriesIdEpisodesQueryGet(id, opts)



This route allows the user to query against episodes for the given series. The response is a paginated array of episode records that have been filtered down to basic information.

### Example
```javascript
var TheTvdbApiV2 = require('the_tvdb_api_v2');
var defaultClient = TheTvdbApiV2.ApiClient.default;

// Configure API key authorization: jwtToken
var jwtToken = defaultClient.authentications['jwtToken'];
jwtToken.apiKey = 'YOUR API KEY';
// Uncomment the following line to set a prefix for the API key, e.g. "Token" (defaults to null)
//jwtToken.apiKeyPrefix = 'Token';

var apiInstance = new TheTvdbApiV2.SeriesApi();

var id = 789; // Number | ID of the series

var opts = { 
  'absoluteNumber': "absoluteNumber_example", // String | Absolute number of the episode
  'airedSeason': "airedSeason_example", // String | Aired season number
  'airedEpisode': "airedEpisode_example", // String | Aired episode number
  'dvdSeason': "dvdSeason_example", // String | DVD season number
  'dvdEpisode': "dvdEpisode_example", // String | DVD episode number
  'imdbId': "imdbId_example", // String | IMDB id of the series
  'page': "page_example", // String | Page of results to fetch. Defaults to page 1 if not provided.
  'acceptLanguage': "acceptLanguage_example" // String | Records are returned with the Episode name and Overview in the desired language, if it exists. If there is no translation for the given language, then the record is still returned but with empty values for the translated fields.
};

var callback = function(error, data, response) {
  if (error) {
    console.error(error);
  } else {
    console.log('API called successfully. Returned data: ' + data);
  }
};
apiInstance.seriesIdEpisodesQueryGet(id, opts, callback);
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **id** | **Number**| ID of the series | 
 **absoluteNumber** | **String**| Absolute number of the episode | [optional] 
 **airedSeason** | **String**| Aired season number | [optional] 
 **airedEpisode** | **String**| Aired episode number | [optional] 
 **dvdSeason** | **String**| DVD season number | [optional] 
 **dvdEpisode** | **String**| DVD episode number | [optional] 
 **imdbId** | **String**| IMDB id of the series | [optional] 
 **page** | **String**| Page of results to fetch. Defaults to page 1 if not provided. | [optional] 
 **acceptLanguage** | **String**| Records are returned with the Episode name and Overview in the desired language, if it exists. If there is no translation for the given language, then the record is still returned but with empty values for the translated fields. | [optional] 

### Return type

[**InlineResponse2007**](InlineResponse2007.md)

### Authorization

[jwtToken](../README.md#jwtToken)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

<a name="seriesIdEpisodesQueryParamsGet"></a>
# **seriesIdEpisodesQueryParamsGet**
> InlineResponse2004 seriesIdEpisodesQueryParamsGet(id)



Returns the allowed query keys for the &#x60;/series/{id}/episodes/query&#x60; route

### Example
```javascript
var TheTvdbApiV2 = require('the_tvdb_api_v2');
var defaultClient = TheTvdbApiV2.ApiClient.default;

// Configure API key authorization: jwtToken
var jwtToken = defaultClient.authentications['jwtToken'];
jwtToken.apiKey = 'YOUR API KEY';
// Uncomment the following line to set a prefix for the API key, e.g. "Token" (defaults to null)
//jwtToken.apiKeyPrefix = 'Token';

var apiInstance = new TheTvdbApiV2.SeriesApi();

var id = 789; // Number | ID of the series


var callback = function(error, data, response) {
  if (error) {
    console.error(error);
  } else {
    console.log('API called successfully. Returned data: ' + data);
  }
};
apiInstance.seriesIdEpisodesQueryParamsGet(id, callback);
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **id** | **Number**| ID of the series | 

### Return type

[**InlineResponse2004**](InlineResponse2004.md)

### Authorization

[jwtToken](../README.md#jwtToken)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

<a name="seriesIdEpisodesSummaryGet"></a>
# **seriesIdEpisodesSummaryGet**
> InlineResponse2008 seriesIdEpisodesSummaryGet(id)



Returns a summary of the episodes and seasons available for the series.  __Note__: Season \&quot;0\&quot; is for all episodes that are considered to be specials.

### Example
```javascript
var TheTvdbApiV2 = require('the_tvdb_api_v2');
var defaultClient = TheTvdbApiV2.ApiClient.default;

// Configure API key authorization: jwtToken
var jwtToken = defaultClient.authentications['jwtToken'];
jwtToken.apiKey = 'YOUR API KEY';
// Uncomment the following line to set a prefix for the API key, e.g. "Token" (defaults to null)
//jwtToken.apiKeyPrefix = 'Token';

var apiInstance = new TheTvdbApiV2.SeriesApi();

var id = 789; // Number | ID of the series


var callback = function(error, data, response) {
  if (error) {
    console.error(error);
  } else {
    console.log('API called successfully. Returned data: ' + data);
  }
};
apiInstance.seriesIdEpisodesSummaryGet(id, callback);
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **id** | **Number**| ID of the series | 

### Return type

[**InlineResponse2008**](InlineResponse2008.md)

### Authorization

[jwtToken](../README.md#jwtToken)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

<a name="seriesIdFilterGet"></a>
# **seriesIdFilterGet**
> InlineResponse2005 seriesIdFilterGet(id, keys, opts)



Returns a series records, filtered by the supplied comma-separated list of keys. Query keys can be found at the &#x60;/series/{id}/filter/params&#x60; route.

### Example
```javascript
var TheTvdbApiV2 = require('the_tvdb_api_v2');
var defaultClient = TheTvdbApiV2.ApiClient.default;

// Configure API key authorization: jwtToken
var jwtToken = defaultClient.authentications['jwtToken'];
jwtToken.apiKey = 'YOUR API KEY';
// Uncomment the following line to set a prefix for the API key, e.g. "Token" (defaults to null)
//jwtToken.apiKeyPrefix = 'Token';

var apiInstance = new TheTvdbApiV2.SeriesApi();

var id = 789; // Number | ID of the series

var keys = "keys_example"; // String | Comma-separated list of keys to filter by

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
apiInstance.seriesIdFilterGet(id, keys, opts, callback);
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **id** | **Number**| ID of the series | 
 **keys** | **String**| Comma-separated list of keys to filter by | 
 **acceptLanguage** | **String**| Records are returned with the Episode name and Overview in the desired language, if it exists. If there is no translation for the given language, then the record is still returned but with empty values for the translated fields. | [optional] 

### Return type

[**InlineResponse2005**](InlineResponse2005.md)

### Authorization

[jwtToken](../README.md#jwtToken)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

<a name="seriesIdFilterParamsGet"></a>
# **seriesIdFilterParamsGet**
> InlineResponse2004 seriesIdFilterParamsGet(id, opts)



Returns the list of keys available for the &#x60;/series/{id}/filter&#x60; route

### Example
```javascript
var TheTvdbApiV2 = require('the_tvdb_api_v2');
var defaultClient = TheTvdbApiV2.ApiClient.default;

// Configure API key authorization: jwtToken
var jwtToken = defaultClient.authentications['jwtToken'];
jwtToken.apiKey = 'YOUR API KEY';
// Uncomment the following line to set a prefix for the API key, e.g. "Token" (defaults to null)
//jwtToken.apiKeyPrefix = 'Token';

var apiInstance = new TheTvdbApiV2.SeriesApi();

var id = 789; // Number | ID of the series

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
apiInstance.seriesIdFilterParamsGet(id, opts, callback);
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **id** | **Number**| ID of the series | 
 **acceptLanguage** | **String**| Records are returned with the Episode name and Overview in the desired language, if it exists. If there is no translation for the given language, then the record is still returned but with empty values for the translated fields. | [optional] 

### Return type

[**InlineResponse2004**](InlineResponse2004.md)

### Authorization

[jwtToken](../README.md#jwtToken)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

<a name="seriesIdGet"></a>
# **seriesIdGet**
> InlineResponse2005 seriesIdGet(id, opts)



Returns a series records that contains all information known about a particular series id.

### Example
```javascript
var TheTvdbApiV2 = require('the_tvdb_api_v2');
var defaultClient = TheTvdbApiV2.ApiClient.default;

// Configure API key authorization: jwtToken
var jwtToken = defaultClient.authentications['jwtToken'];
jwtToken.apiKey = 'YOUR API KEY';
// Uncomment the following line to set a prefix for the API key, e.g. "Token" (defaults to null)
//jwtToken.apiKeyPrefix = 'Token';

var apiInstance = new TheTvdbApiV2.SeriesApi();

var id = 789; // Number | ID of the series

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
apiInstance.seriesIdGet(id, opts, callback);
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **id** | **Number**| ID of the series | 
 **acceptLanguage** | **String**| Records are returned with the Episode name and Overview in the desired language, if it exists. If there is no translation for the given language, then the record is still returned but with empty values for the translated fields. | [optional] 

### Return type

[**InlineResponse2005**](InlineResponse2005.md)

### Authorization

[jwtToken](../README.md#jwtToken)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

<a name="seriesIdHead"></a>
# **seriesIdHead**
> seriesIdHead(id, opts)



Returns header information only about the given series ID.

### Example
```javascript
var TheTvdbApiV2 = require('the_tvdb_api_v2');
var defaultClient = TheTvdbApiV2.ApiClient.default;

// Configure API key authorization: jwtToken
var jwtToken = defaultClient.authentications['jwtToken'];
jwtToken.apiKey = 'YOUR API KEY';
// Uncomment the following line to set a prefix for the API key, e.g. "Token" (defaults to null)
//jwtToken.apiKeyPrefix = 'Token';

var apiInstance = new TheTvdbApiV2.SeriesApi();

var id = 789; // Number | ID of the series

var opts = { 
  'acceptLanguage': "acceptLanguage_example" // String | Records are returned with the Episode name and Overview in the desired language, if it exists. If there is no translation for the given language, then the record is still returned but with empty values for the translated fields.
};

var callback = function(error, data, response) {
  if (error) {
    console.error(error);
  } else {
    console.log('API called successfully.');
  }
};
apiInstance.seriesIdHead(id, opts, callback);
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **id** | **Number**| ID of the series | 
 **acceptLanguage** | **String**| Records are returned with the Episode name and Overview in the desired language, if it exists. If there is no translation for the given language, then the record is still returned but with empty values for the translated fields. | [optional] 

### Return type

null (empty response body)

### Authorization

[jwtToken](../README.md#jwtToken)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

<a name="seriesIdImagesGet"></a>
# **seriesIdImagesGet**
> InlineResponse2009 seriesIdImagesGet(id, opts)



Returns a summary of the images for a particular series

### Example
```javascript
var TheTvdbApiV2 = require('the_tvdb_api_v2');
var defaultClient = TheTvdbApiV2.ApiClient.default;

// Configure API key authorization: jwtToken
var jwtToken = defaultClient.authentications['jwtToken'];
jwtToken.apiKey = 'YOUR API KEY';
// Uncomment the following line to set a prefix for the API key, e.g. "Token" (defaults to null)
//jwtToken.apiKeyPrefix = 'Token';

var apiInstance = new TheTvdbApiV2.SeriesApi();

var id = 789; // Number | ID of the series

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
apiInstance.seriesIdImagesGet(id, opts, callback);
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **id** | **Number**| ID of the series | 
 **acceptLanguage** | **String**| Records are returned with the Episode name and Overview in the desired language, if it exists. If there is no translation for the given language, then the record is still returned but with empty values for the translated fields. | [optional] 

### Return type

[**InlineResponse2009**](InlineResponse2009.md)

### Authorization

[jwtToken](../README.md#jwtToken)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

<a name="seriesIdImagesQueryGet"></a>
# **seriesIdImagesQueryGet**
> InlineResponse20010 seriesIdImagesQueryGet(id, opts)



Query images for the given series ID.

### Example
```javascript
var TheTvdbApiV2 = require('the_tvdb_api_v2');
var defaultClient = TheTvdbApiV2.ApiClient.default;

// Configure API key authorization: jwtToken
var jwtToken = defaultClient.authentications['jwtToken'];
jwtToken.apiKey = 'YOUR API KEY';
// Uncomment the following line to set a prefix for the API key, e.g. "Token" (defaults to null)
//jwtToken.apiKeyPrefix = 'Token';

var apiInstance = new TheTvdbApiV2.SeriesApi();

var id = 789; // Number | ID of the series

var opts = { 
  'keyType': "keyType_example", // String | Type of image you're querying for (fanart, poster, etc. See ../images/query/params for more details).
  'resolution': "resolution_example", // String | Resolution to filter by (1280x1024, for example)
  'subKey': "subKey_example", // String | Subkey for the above query keys. See /series/{id}/images/query/params for more information
  'acceptLanguage': "acceptLanguage_example" // String | Records are returned with the Episode name and Overview in the desired language, if it exists. If there is no translation for the given language, then the record is still returned but with empty values for the translated fields.
};

var callback = function(error, data, response) {
  if (error) {
    console.error(error);
  } else {
    console.log('API called successfully. Returned data: ' + data);
  }
};
apiInstance.seriesIdImagesQueryGet(id, opts, callback);
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **id** | **Number**| ID of the series | 
 **keyType** | **String**| Type of image you&#39;re querying for (fanart, poster, etc. See ../images/query/params for more details). | [optional] 
 **resolution** | **String**| Resolution to filter by (1280x1024, for example) | [optional] 
 **subKey** | **String**| Subkey for the above query keys. See /series/{id}/images/query/params for more information | [optional] 
 **acceptLanguage** | **String**| Records are returned with the Episode name and Overview in the desired language, if it exists. If there is no translation for the given language, then the record is still returned but with empty values for the translated fields. | [optional] 

### Return type

[**InlineResponse20010**](InlineResponse20010.md)

### Authorization

[jwtToken](../README.md#jwtToken)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

<a name="seriesIdImagesQueryParamsGet"></a>
# **seriesIdImagesQueryParamsGet**
> InlineResponse20011 seriesIdImagesQueryParamsGet(id, opts)



Returns the allowed query keys for the &#x60;/series/{id}/images/query&#x60; route. Contains a parameter record for each unique &#x60;keyType&#x60;, listing values that will return results.

### Example
```javascript
var TheTvdbApiV2 = require('the_tvdb_api_v2');
var defaultClient = TheTvdbApiV2.ApiClient.default;

// Configure API key authorization: jwtToken
var jwtToken = defaultClient.authentications['jwtToken'];
jwtToken.apiKey = 'YOUR API KEY';
// Uncomment the following line to set a prefix for the API key, e.g. "Token" (defaults to null)
//jwtToken.apiKeyPrefix = 'Token';

var apiInstance = new TheTvdbApiV2.SeriesApi();

var id = 789; // Number | ID of the series

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
apiInstance.seriesIdImagesQueryParamsGet(id, opts, callback);
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **id** | **Number**| ID of the series | 
 **acceptLanguage** | **String**| Records are returned with the Episode name and Overview in the desired language, if it exists. If there is no translation for the given language, then the record is still returned but with empty values for the translated fields. | [optional] 

### Return type

[**InlineResponse20011**](InlineResponse20011.md)

### Authorization

[jwtToken](../README.md#jwtToken)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

