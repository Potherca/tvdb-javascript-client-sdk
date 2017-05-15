/**
 * TheTVDB API v2
 * API v2 targets v1 functionality with a few minor additions. The API is accessible via https://api.thetvdb.com and provides the following REST endpoints in JSON format.   How to use this API documentation ----------------   You may browse the API routes without authentication, but if you wish to send requests to the API and see response data, then you must authenticate. 1. Obtain a JWT token by `POST`ing  to the `/login` route in the `Authentication` section with your API key and credentials. 1. Paste the JWT token from the response into the \"JWT Token\" field at the top of the page and click the 'Add Token' button.   You will now be able to use the remaining routes to send requests to the API and get a response.   Language Selection ----------------   Language selection is done via the `Accept-Language` header. At the moment, you may only pass one language abbreviation in the header at a time. Valid language abbreviations can be found at the `/languages` route..   Authentication ----------------   Authentication to use the API is similar to the How-to section above. Users must `POST` to the `/login` route with their API key and credentials in the following format in order to obtain a JWT token.  `{\"apikey\":\"APIKEY\",\"username\":\"USERNAME\",\"userkey\":\"USERKEY\"}`  Note that the username and key are ONLY required for the `/user` routes. The user's key is labled `Account Identifier` in the account section of the main site. The token is then used in all subsequent requests by providing it in the `Authorization` header. The header will look like: `Authorization: Bearer <yourJWTtoken>`. Currently, the token expires after 24 hours. You can `GET` the `/refresh_token` route to extend that expiration date.   Versioning ----------------   You may request a different version of the API by including an `Accept` header in your request with the following format: `Accept:application/vnd.thetvdb.v$VERSION`. This documentation automatically uses the version seen at the top and bottom of the page.
 *
 * OpenAPI spec version: 2.1.2
 * 
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient', 'model/InlineResponse20010', 'model/InlineResponse20011', 'model/InlineResponse2004', 'model/InlineResponse2005', 'model/InlineResponse2006', 'model/InlineResponse2007', 'model/InlineResponse2008', 'model/InlineResponse2009', 'model/InlineResponse401', 'model/InlineResponse404'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'), require('../model/InlineResponse20010'), require('../model/InlineResponse20011'), require('../model/InlineResponse2004'), require('../model/InlineResponse2005'), require('../model/InlineResponse2006'), require('../model/InlineResponse2007'), require('../model/InlineResponse2008'), require('../model/InlineResponse2009'), require('../model/InlineResponse401'), require('../model/InlineResponse404'));
  } else {
    // Browser globals (root is window)
    if (!root.TheTvdbApiV2) {
      root.TheTvdbApiV2 = {};
    }
    root.TheTvdbApiV2.SeriesApi = factory(root.TheTvdbApiV2.ApiClient, root.TheTvdbApiV2.InlineResponse20010, root.TheTvdbApiV2.InlineResponse20011, root.TheTvdbApiV2.InlineResponse2004, root.TheTvdbApiV2.InlineResponse2005, root.TheTvdbApiV2.InlineResponse2006, root.TheTvdbApiV2.InlineResponse2007, root.TheTvdbApiV2.InlineResponse2008, root.TheTvdbApiV2.InlineResponse2009, root.TheTvdbApiV2.InlineResponse401, root.TheTvdbApiV2.InlineResponse404);
  }
}(this, function(ApiClient, InlineResponse20010, InlineResponse20011, InlineResponse2004, InlineResponse2005, InlineResponse2006, InlineResponse2007, InlineResponse2008, InlineResponse2009, InlineResponse401, InlineResponse404) {
  'use strict';

  /**
   * Series service.
   * @module api/SeriesApi
   * @version 2.1.2
   */

  /**
   * Constructs a new SeriesApi. 
   * @alias module:api/SeriesApi
   * @class
   * @param {module:ApiClient} apiClient Optional API client implementation to use,
   * default to {@link module:ApiClient#instance} if unspecified.
   */
  var exports = function(apiClient) {
    this.apiClient = apiClient || ApiClient.instance;


    /**
     * Callback function to receive the result of the seriesIdActorsGet operation.
     * @callback module:api/SeriesApi~seriesIdActorsGetCallback
     * @param {String} error Error message, if any.
     * @param {module:model/InlineResponse2006} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * Returns actors for the given series id
     * @param {Number} id ID of the series
     * @param {module:api/SeriesApi~seriesIdActorsGetCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {@link module:model/InlineResponse2006}
     */
    this.seriesIdActorsGet = function(id, callback) {
      var postBody = null;

      // verify the required parameter 'id' is set
      if (id == undefined || id == null) {
        throw new Error("Missing the required parameter 'id' when calling seriesIdActorsGet");
      }


      var pathParams = {
        'id': id
      };
      var queryParams = {
      };
      var headerParams = {
      };
      var formParams = {
      };

      var authNames = ['jwtToken'];
      var contentTypes = ['application/json'];
      var accepts = ['application/json'];
      var returnType = InlineResponse2006;

      return this.apiClient.callApi(
        '/series/{id}/actors', 'GET',
        pathParams, queryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }

    /**
     * Callback function to receive the result of the seriesIdEpisodesGet operation.
     * @callback module:api/SeriesApi~seriesIdEpisodesGetCallback
     * @param {String} error Error message, if any.
     * @param {module:model/InlineResponse2007} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * All episodes for a given series. Paginated with 100 results per page.
     * @param {Number} id ID of the series
     * @param {Object} opts Optional parameters
     * @param {String} opts.page Page of results to fetch. Defaults to page 1 if not provided.
     * @param {module:api/SeriesApi~seriesIdEpisodesGetCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {@link module:model/InlineResponse2007}
     */
    this.seriesIdEpisodesGet = function(id, opts, callback) {
      opts = opts || {};
      var postBody = null;

      // verify the required parameter 'id' is set
      if (id == undefined || id == null) {
        throw new Error("Missing the required parameter 'id' when calling seriesIdEpisodesGet");
      }


      var pathParams = {
        'id': id
      };
      var queryParams = {
        'page': opts['page']
      };
      var headerParams = {
      };
      var formParams = {
      };

      var authNames = ['jwtToken'];
      var contentTypes = ['application/json'];
      var accepts = ['application/json'];
      var returnType = InlineResponse2007;

      return this.apiClient.callApi(
        '/series/{id}/episodes', 'GET',
        pathParams, queryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }

    /**
     * Callback function to receive the result of the seriesIdEpisodesQueryGet operation.
     * @callback module:api/SeriesApi~seriesIdEpisodesQueryGetCallback
     * @param {String} error Error message, if any.
     * @param {module:model/InlineResponse2007} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * This route allows the user to query against episodes for the given series. The response is a paginated array of episode records that have been filtered down to basic information.
     * @param {Number} id ID of the series
     * @param {Object} opts Optional parameters
     * @param {String} opts.absoluteNumber Absolute number of the episode
     * @param {String} opts.airedSeason Aired season number
     * @param {String} opts.airedEpisode Aired episode number
     * @param {String} opts.dvdSeason DVD season number
     * @param {String} opts.dvdEpisode DVD episode number
     * @param {String} opts.imdbId IMDB id of the series
     * @param {String} opts.page Page of results to fetch. Defaults to page 1 if not provided.
     * @param {String} opts.acceptLanguage Records are returned with the Episode name and Overview in the desired language, if it exists. If there is no translation for the given language, then the record is still returned but with empty values for the translated fields.
     * @param {module:api/SeriesApi~seriesIdEpisodesQueryGetCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {@link module:model/InlineResponse2007}
     */
    this.seriesIdEpisodesQueryGet = function(id, opts, callback) {
      opts = opts || {};
      var postBody = null;

      // verify the required parameter 'id' is set
      if (id == undefined || id == null) {
        throw new Error("Missing the required parameter 'id' when calling seriesIdEpisodesQueryGet");
      }


      var pathParams = {
        'id': id
      };
      var queryParams = {
        'absoluteNumber': opts['absoluteNumber'],
        'airedSeason': opts['airedSeason'],
        'airedEpisode': opts['airedEpisode'],
        'dvdSeason': opts['dvdSeason'],
        'dvdEpisode': opts['dvdEpisode'],
        'imdbId': opts['imdbId'],
        'page': opts['page']
      };
      var headerParams = {
        'Accept-Language': opts['acceptLanguage']
      };
      var formParams = {
      };

      var authNames = ['jwtToken'];
      var contentTypes = ['application/json'];
      var accepts = ['application/json'];
      var returnType = InlineResponse2007;

      return this.apiClient.callApi(
        '/series/{id}/episodes/query', 'GET',
        pathParams, queryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }

    /**
     * Callback function to receive the result of the seriesIdEpisodesQueryParamsGet operation.
     * @callback module:api/SeriesApi~seriesIdEpisodesQueryParamsGetCallback
     * @param {String} error Error message, if any.
     * @param {module:model/InlineResponse2004} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * Returns the allowed query keys for the &#x60;/series/{id}/episodes/query&#x60; route
     * @param {Number} id ID of the series
     * @param {module:api/SeriesApi~seriesIdEpisodesQueryParamsGetCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {@link module:model/InlineResponse2004}
     */
    this.seriesIdEpisodesQueryParamsGet = function(id, callback) {
      var postBody = null;

      // verify the required parameter 'id' is set
      if (id == undefined || id == null) {
        throw new Error("Missing the required parameter 'id' when calling seriesIdEpisodesQueryParamsGet");
      }


      var pathParams = {
        'id': id
      };
      var queryParams = {
      };
      var headerParams = {
      };
      var formParams = {
      };

      var authNames = ['jwtToken'];
      var contentTypes = ['application/json'];
      var accepts = ['application/json'];
      var returnType = InlineResponse2004;

      return this.apiClient.callApi(
        '/series/{id}/episodes/query/params', 'GET',
        pathParams, queryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }

    /**
     * Callback function to receive the result of the seriesIdEpisodesSummaryGet operation.
     * @callback module:api/SeriesApi~seriesIdEpisodesSummaryGetCallback
     * @param {String} error Error message, if any.
     * @param {module:model/InlineResponse2008} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * Returns a summary of the episodes and seasons available for the series.  __Note__: Season \&quot;0\&quot; is for all episodes that are considered to be specials.
     * @param {Number} id ID of the series
     * @param {module:api/SeriesApi~seriesIdEpisodesSummaryGetCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {@link module:model/InlineResponse2008}
     */
    this.seriesIdEpisodesSummaryGet = function(id, callback) {
      var postBody = null;

      // verify the required parameter 'id' is set
      if (id == undefined || id == null) {
        throw new Error("Missing the required parameter 'id' when calling seriesIdEpisodesSummaryGet");
      }


      var pathParams = {
        'id': id
      };
      var queryParams = {
      };
      var headerParams = {
      };
      var formParams = {
      };

      var authNames = ['jwtToken'];
      var contentTypes = ['application/json'];
      var accepts = ['application/json'];
      var returnType = InlineResponse2008;

      return this.apiClient.callApi(
        '/series/{id}/episodes/summary', 'GET',
        pathParams, queryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }

    /**
     * Callback function to receive the result of the seriesIdFilterGet operation.
     * @callback module:api/SeriesApi~seriesIdFilterGetCallback
     * @param {String} error Error message, if any.
     * @param {module:model/InlineResponse2005} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * Returns a series records, filtered by the supplied comma-separated list of keys. Query keys can be found at the &#x60;/series/{id}/filter/params&#x60; route.
     * @param {Number} id ID of the series
     * @param {String} keys Comma-separated list of keys to filter by
     * @param {Object} opts Optional parameters
     * @param {String} opts.acceptLanguage Records are returned with the Episode name and Overview in the desired language, if it exists. If there is no translation for the given language, then the record is still returned but with empty values for the translated fields.
     * @param {module:api/SeriesApi~seriesIdFilterGetCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {@link module:model/InlineResponse2005}
     */
    this.seriesIdFilterGet = function(id, keys, opts, callback) {
      opts = opts || {};
      var postBody = null;

      // verify the required parameter 'id' is set
      if (id == undefined || id == null) {
        throw new Error("Missing the required parameter 'id' when calling seriesIdFilterGet");
      }

      // verify the required parameter 'keys' is set
      if (keys == undefined || keys == null) {
        throw new Error("Missing the required parameter 'keys' when calling seriesIdFilterGet");
      }


      var pathParams = {
        'id': id
      };
      var queryParams = {
        'keys': keys
      };
      var headerParams = {
        'Accept-Language': opts['acceptLanguage']
      };
      var formParams = {
      };

      var authNames = ['jwtToken'];
      var contentTypes = ['application/json'];
      var accepts = ['application/json'];
      var returnType = InlineResponse2005;

      return this.apiClient.callApi(
        '/series/{id}/filter', 'GET',
        pathParams, queryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }

    /**
     * Callback function to receive the result of the seriesIdFilterParamsGet operation.
     * @callback module:api/SeriesApi~seriesIdFilterParamsGetCallback
     * @param {String} error Error message, if any.
     * @param {module:model/InlineResponse2004} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * Returns the list of keys available for the &#x60;/series/{id}/filter&#x60; route
     * @param {Number} id ID of the series
     * @param {Object} opts Optional parameters
     * @param {String} opts.acceptLanguage Records are returned with the Episode name and Overview in the desired language, if it exists. If there is no translation for the given language, then the record is still returned but with empty values for the translated fields.
     * @param {module:api/SeriesApi~seriesIdFilterParamsGetCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {@link module:model/InlineResponse2004}
     */
    this.seriesIdFilterParamsGet = function(id, opts, callback) {
      opts = opts || {};
      var postBody = null;

      // verify the required parameter 'id' is set
      if (id == undefined || id == null) {
        throw new Error("Missing the required parameter 'id' when calling seriesIdFilterParamsGet");
      }


      var pathParams = {
        'id': id
      };
      var queryParams = {
      };
      var headerParams = {
        'Accept-Language': opts['acceptLanguage']
      };
      var formParams = {
      };

      var authNames = ['jwtToken'];
      var contentTypes = ['application/json'];
      var accepts = ['application/json'];
      var returnType = InlineResponse2004;

      return this.apiClient.callApi(
        '/series/{id}/filter/params', 'GET',
        pathParams, queryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }

    /**
     * Callback function to receive the result of the seriesIdGet operation.
     * @callback module:api/SeriesApi~seriesIdGetCallback
     * @param {String} error Error message, if any.
     * @param {module:model/InlineResponse2005} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * Returns a series records that contains all information known about a particular series id.
     * @param {Number} id ID of the series
     * @param {Object} opts Optional parameters
     * @param {String} opts.acceptLanguage Records are returned with the Episode name and Overview in the desired language, if it exists. If there is no translation for the given language, then the record is still returned but with empty values for the translated fields.
     * @param {module:api/SeriesApi~seriesIdGetCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {@link module:model/InlineResponse2005}
     */
    this.seriesIdGet = function(id, opts, callback) {
      opts = opts || {};
      var postBody = null;

      // verify the required parameter 'id' is set
      if (id == undefined || id == null) {
        throw new Error("Missing the required parameter 'id' when calling seriesIdGet");
      }


      var pathParams = {
        'id': id
      };
      var queryParams = {
      };
      var headerParams = {
        'Accept-Language': opts['acceptLanguage']
      };
      var formParams = {
      };

      var authNames = ['jwtToken'];
      var contentTypes = ['application/json'];
      var accepts = ['application/json'];
      var returnType = InlineResponse2005;

      return this.apiClient.callApi(
        '/series/{id}', 'GET',
        pathParams, queryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }

    /**
     * Callback function to receive the result of the seriesIdHead operation.
     * @callback module:api/SeriesApi~seriesIdHeadCallback
     * @param {String} error Error message, if any.
     * @param data This operation does not return a value.
     * @param {String} response The complete HTTP response.
     */

    /**
     * Returns header information only about the given series ID.
     * @param {Number} id ID of the series
     * @param {Object} opts Optional parameters
     * @param {String} opts.acceptLanguage Records are returned with the Episode name and Overview in the desired language, if it exists. If there is no translation for the given language, then the record is still returned but with empty values for the translated fields.
     * @param {module:api/SeriesApi~seriesIdHeadCallback} callback The callback function, accepting three arguments: error, data, response
     */
    this.seriesIdHead = function(id, opts, callback) {
      opts = opts || {};
      var postBody = null;

      // verify the required parameter 'id' is set
      if (id == undefined || id == null) {
        throw new Error("Missing the required parameter 'id' when calling seriesIdHead");
      }


      var pathParams = {
        'id': id
      };
      var queryParams = {
      };
      var headerParams = {
        'Accept-Language': opts['acceptLanguage']
      };
      var formParams = {
      };

      var authNames = ['jwtToken'];
      var contentTypes = ['application/json'];
      var accepts = ['application/json'];
      var returnType = null;

      return this.apiClient.callApi(
        '/series/{id}', 'HEAD',
        pathParams, queryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }

    /**
     * Callback function to receive the result of the seriesIdImagesGet operation.
     * @callback module:api/SeriesApi~seriesIdImagesGetCallback
     * @param {String} error Error message, if any.
     * @param {module:model/InlineResponse2009} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * Returns a summary of the images for a particular series
     * @param {Number} id ID of the series
     * @param {Object} opts Optional parameters
     * @param {String} opts.acceptLanguage Records are returned with the Episode name and Overview in the desired language, if it exists. If there is no translation for the given language, then the record is still returned but with empty values for the translated fields.
     * @param {module:api/SeriesApi~seriesIdImagesGetCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {@link module:model/InlineResponse2009}
     */
    this.seriesIdImagesGet = function(id, opts, callback) {
      opts = opts || {};
      var postBody = null;

      // verify the required parameter 'id' is set
      if (id == undefined || id == null) {
        throw new Error("Missing the required parameter 'id' when calling seriesIdImagesGet");
      }


      var pathParams = {
        'id': id
      };
      var queryParams = {
      };
      var headerParams = {
        'Accept-Language': opts['acceptLanguage']
      };
      var formParams = {
      };

      var authNames = ['jwtToken'];
      var contentTypes = ['application/json'];
      var accepts = ['application/json'];
      var returnType = InlineResponse2009;

      return this.apiClient.callApi(
        '/series/{id}/images', 'GET',
        pathParams, queryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }

    /**
     * Callback function to receive the result of the seriesIdImagesQueryGet operation.
     * @callback module:api/SeriesApi~seriesIdImagesQueryGetCallback
     * @param {String} error Error message, if any.
     * @param {module:model/InlineResponse20010} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * Query images for the given series ID.
     * @param {Number} id ID of the series
     * @param {Object} opts Optional parameters
     * @param {String} opts.keyType Type of image you&#39;re querying for (fanart, poster, etc. See ../images/query/params for more details).
     * @param {String} opts.resolution Resolution to filter by (1280x1024, for example)
     * @param {String} opts.subKey Subkey for the above query keys. See /series/{id}/images/query/params for more information
     * @param {String} opts.acceptLanguage Records are returned with the Episode name and Overview in the desired language, if it exists. If there is no translation for the given language, then the record is still returned but with empty values for the translated fields.
     * @param {module:api/SeriesApi~seriesIdImagesQueryGetCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {@link module:model/InlineResponse20010}
     */
    this.seriesIdImagesQueryGet = function(id, opts, callback) {
      opts = opts || {};
      var postBody = null;

      // verify the required parameter 'id' is set
      if (id == undefined || id == null) {
        throw new Error("Missing the required parameter 'id' when calling seriesIdImagesQueryGet");
      }


      var pathParams = {
        'id': id
      };
      var queryParams = {
        'keyType': opts['keyType'],
        'resolution': opts['resolution'],
        'subKey': opts['subKey']
      };
      var headerParams = {
        'Accept-Language': opts['acceptLanguage']
      };
      var formParams = {
      };

      var authNames = ['jwtToken'];
      var contentTypes = ['application/json'];
      var accepts = ['application/json'];
      var returnType = InlineResponse20010;

      return this.apiClient.callApi(
        '/series/{id}/images/query', 'GET',
        pathParams, queryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }

    /**
     * Callback function to receive the result of the seriesIdImagesQueryParamsGet operation.
     * @callback module:api/SeriesApi~seriesIdImagesQueryParamsGetCallback
     * @param {String} error Error message, if any.
     * @param {module:model/InlineResponse20011} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * Returns the allowed query keys for the &#x60;/series/{id}/images/query&#x60; route. Contains a parameter record for each unique &#x60;keyType&#x60;, listing values that will return results.
     * @param {Number} id ID of the series
     * @param {Object} opts Optional parameters
     * @param {String} opts.acceptLanguage Records are returned with the Episode name and Overview in the desired language, if it exists. If there is no translation for the given language, then the record is still returned but with empty values for the translated fields.
     * @param {module:api/SeriesApi~seriesIdImagesQueryParamsGetCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {@link module:model/InlineResponse20011}
     */
    this.seriesIdImagesQueryParamsGet = function(id, opts, callback) {
      opts = opts || {};
      var postBody = null;

      // verify the required parameter 'id' is set
      if (id == undefined || id == null) {
        throw new Error("Missing the required parameter 'id' when calling seriesIdImagesQueryParamsGet");
      }


      var pathParams = {
        'id': id
      };
      var queryParams = {
      };
      var headerParams = {
        'Accept-Language': opts['acceptLanguage']
      };
      var formParams = {
      };

      var authNames = ['jwtToken'];
      var contentTypes = ['application/json'];
      var accepts = ['application/json'];
      var returnType = InlineResponse20011;

      return this.apiClient.callApi(
        '/series/{id}/images/query/params', 'GET',
        pathParams, queryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }
  };

  return exports;
}));
