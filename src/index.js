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

(function(factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient', 'model/Auth', 'model/AuthenticationString', 'model/BasicEpisode', 'model/Conflict', 'model/Episode', 'model/EpisodeDataQueryParams', 'model/EpisodeRecordData', 'model/FilterKeys', 'model/InlineResponse200', 'model/InlineResponse2001', 'model/InlineResponse20010', 'model/InlineResponse20010Data', 'model/InlineResponse20010RatingsInfo', 'model/InlineResponse20011', 'model/InlineResponse20011Data', 'model/InlineResponse20012', 'model/InlineResponse20012Data', 'model/InlineResponse20013', 'model/InlineResponse20013Data', 'model/InlineResponse20014', 'model/InlineResponse20014Data', 'model/InlineResponse20015', 'model/InlineResponse20015Data', 'model/InlineResponse20016', 'model/InlineResponse2001Data', 'model/InlineResponse2002', 'model/InlineResponse2003', 'model/InlineResponse2004', 'model/InlineResponse2005', 'model/InlineResponse2005Data', 'model/InlineResponse2006', 'model/InlineResponse2006Data', 'model/InlineResponse2007', 'model/InlineResponse2007Data', 'model/InlineResponse2007Links', 'model/InlineResponse2008', 'model/InlineResponse2009', 'model/InlineResponse2009Data', 'model/InlineResponse200Data', 'model/InlineResponse200Errors', 'model/InlineResponse401', 'model/InlineResponse404', 'model/InlineResponse409', 'model/JSONErrors', 'model/Language', 'model/LanguageData', 'model/Links', 'model/NotAuthorized', 'model/NotFound', 'model/Series', 'model/SeriesActors', 'model/SeriesActorsData', 'model/SeriesData', 'model/SeriesEpisodes', 'model/SeriesEpisodesQuery', 'model/SeriesEpisodesQueryParams', 'model/SeriesEpisodesSummary', 'model/SeriesImageQueryResult', 'model/SeriesImageQueryResults', 'model/SeriesImagesCount', 'model/SeriesImagesCounts', 'model/SeriesImagesQueryParam', 'model/SeriesImagesQueryParams', 'model/SeriesSearchData', 'model/Token', 'model/Update', 'model/UpdateData', 'model/UpdateDataQueryParams', 'model/User', 'model/UserData', 'model/UserFavorites', 'model/UserFavoritesData', 'model/UserRatings', 'model/UserRatingsData', 'model/UserRatingsDataNoLinks', 'model/UserRatingsQueryParams', 'api/AuthenticationApi', 'api/EpisodesApi', 'api/LanguagesApi', 'api/SearchApi', 'api/SeriesApi', 'api/UpdatesApi', 'api/UsersApi'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('./ApiClient'), require('./model/Auth'), require('./model/AuthenticationString'), require('./model/BasicEpisode'), require('./model/Conflict'), require('./model/Episode'), require('./model/EpisodeDataQueryParams'), require('./model/EpisodeRecordData'), require('./model/FilterKeys'), require('./model/InlineResponse200'), require('./model/InlineResponse2001'), require('./model/InlineResponse20010'), require('./model/InlineResponse20010Data'), require('./model/InlineResponse20010RatingsInfo'), require('./model/InlineResponse20011'), require('./model/InlineResponse20011Data'), require('./model/InlineResponse20012'), require('./model/InlineResponse20012Data'), require('./model/InlineResponse20013'), require('./model/InlineResponse20013Data'), require('./model/InlineResponse20014'), require('./model/InlineResponse20014Data'), require('./model/InlineResponse20015'), require('./model/InlineResponse20015Data'), require('./model/InlineResponse20016'), require('./model/InlineResponse2001Data'), require('./model/InlineResponse2002'), require('./model/InlineResponse2003'), require('./model/InlineResponse2004'), require('./model/InlineResponse2005'), require('./model/InlineResponse2005Data'), require('./model/InlineResponse2006'), require('./model/InlineResponse2006Data'), require('./model/InlineResponse2007'), require('./model/InlineResponse2007Data'), require('./model/InlineResponse2007Links'), require('./model/InlineResponse2008'), require('./model/InlineResponse2009'), require('./model/InlineResponse2009Data'), require('./model/InlineResponse200Data'), require('./model/InlineResponse200Errors'), require('./model/InlineResponse401'), require('./model/InlineResponse404'), require('./model/InlineResponse409'), require('./model/JSONErrors'), require('./model/Language'), require('./model/LanguageData'), require('./model/Links'), require('./model/NotAuthorized'), require('./model/NotFound'), require('./model/Series'), require('./model/SeriesActors'), require('./model/SeriesActorsData'), require('./model/SeriesData'), require('./model/SeriesEpisodes'), require('./model/SeriesEpisodesQuery'), require('./model/SeriesEpisodesQueryParams'), require('./model/SeriesEpisodesSummary'), require('./model/SeriesImageQueryResult'), require('./model/SeriesImageQueryResults'), require('./model/SeriesImagesCount'), require('./model/SeriesImagesCounts'), require('./model/SeriesImagesQueryParam'), require('./model/SeriesImagesQueryParams'), require('./model/SeriesSearchData'), require('./model/Token'), require('./model/Update'), require('./model/UpdateData'), require('./model/UpdateDataQueryParams'), require('./model/User'), require('./model/UserData'), require('./model/UserFavorites'), require('./model/UserFavoritesData'), require('./model/UserRatings'), require('./model/UserRatingsData'), require('./model/UserRatingsDataNoLinks'), require('./model/UserRatingsQueryParams'), require('./api/AuthenticationApi'), require('./api/EpisodesApi'), require('./api/LanguagesApi'), require('./api/SearchApi'), require('./api/SeriesApi'), require('./api/UpdatesApi'), require('./api/UsersApi'));
  }
}(function(ApiClient, Auth, AuthenticationString, BasicEpisode, Conflict, Episode, EpisodeDataQueryParams, EpisodeRecordData, FilterKeys, InlineResponse200, InlineResponse2001, InlineResponse20010, InlineResponse20010Data, InlineResponse20010RatingsInfo, InlineResponse20011, InlineResponse20011Data, InlineResponse20012, InlineResponse20012Data, InlineResponse20013, InlineResponse20013Data, InlineResponse20014, InlineResponse20014Data, InlineResponse20015, InlineResponse20015Data, InlineResponse20016, InlineResponse2001Data, InlineResponse2002, InlineResponse2003, InlineResponse2004, InlineResponse2005, InlineResponse2005Data, InlineResponse2006, InlineResponse2006Data, InlineResponse2007, InlineResponse2007Data, InlineResponse2007Links, InlineResponse2008, InlineResponse2009, InlineResponse2009Data, InlineResponse200Data, InlineResponse200Errors, InlineResponse401, InlineResponse404, InlineResponse409, JSONErrors, Language, LanguageData, Links, NotAuthorized, NotFound, Series, SeriesActors, SeriesActorsData, SeriesData, SeriesEpisodes, SeriesEpisodesQuery, SeriesEpisodesQueryParams, SeriesEpisodesSummary, SeriesImageQueryResult, SeriesImageQueryResults, SeriesImagesCount, SeriesImagesCounts, SeriesImagesQueryParam, SeriesImagesQueryParams, SeriesSearchData, Token, Update, UpdateData, UpdateDataQueryParams, User, UserData, UserFavorites, UserFavoritesData, UserRatings, UserRatingsData, UserRatingsDataNoLinks, UserRatingsQueryParams, AuthenticationApi, EpisodesApi, LanguagesApi, SearchApi, SeriesApi, UpdatesApi, UsersApi) {
  'use strict';

  /**
   * API_v2_targets_v1_functionality_with_a_few_minor_additions__The_API_is_accessible_via_httpsapi_thetvdb_com_and_provides_the_following_REST_endpoints_in_JSON_format_How_to_use_this_API_documentation________________You_may_browse_the_API_routes_without_authentication_but_if_you_wish_to_send_requests_to_the_API_and_see_response_data_then_you_must_authenticate_1__Obtain_a_JWT_token_by_POSTing__to_the_login_route_in_the_Authentication_section_with_your_API_key_and_credentials_1__Paste_the_JWT_token_from_the_response_into_the_JWT_Token_field_at_the_top_of_the_page_and_click_the_Add_Token_button_You_will_now_be_able_to_use_the_remaining_routes_to_send_requests_to_the_API_and_get_a_response_Language_Selection________________Language_selection_is_done_via_the_Accept_Language_header__At_the_moment_you_may_only_pass_one_language_abbreviation_in_the_header_at_a_time__Valid_language_abbreviations_can_be_found_at_the_languages_route__Authentication________________Authentication_to_use_the_API_is_similar_to_the_How_to_section_above__Users_must_POST_to_the_login_route_with_their_API_key_and_credentials_in_the_following_format_in_order_to_obtain_a_JWT_token_apikeyAPIKEYusernameUSERNAMEuserkeyUSERKEYNote_that_the_username_and_key_are_ONLY_required_for_the_user_routes__The_users_key_is_labled_Account_Identifier_in_the_account_section_of_the_main_site_The_token_is_then_used_in_all_subsequent_requests_by_providing_it_in_the_Authorization_header__The_header_will_look_like_Authorization_Bearer_yourJWTtoken__Currently_the_token_expires_after_24_hours__You_can_GET_the_refresh_token_route_to_extend_that_expiration_date_Versioning________________You_may_request_a_different_version_of_the_API_by_including_an_Accept_header_in_your_request_with_the_following_format_Acceptapplicationvnd_thetvdb_vVERSION__This_documentation_automatically_uses_the_version_seen_at_the_top_and_bottom_of_the_page_.<br>
   * The <code>index</code> module provides access to constructors for all the classes which comprise the public API.
   * <p>
   * An AMD (recommended!) or CommonJS application will generally do something equivalent to the following:
   * <pre>
   * var TheTvdbApiV2 = require('index'); // See note below*.
   * var xxxSvc = new TheTvdbApiV2.XxxApi(); // Allocate the API class we're going to use.
   * var yyyModel = new TheTvdbApiV2.Yyy(); // Construct a model instance.
   * yyyModel.someProperty = 'someValue';
   * ...
   * var zzz = xxxSvc.doSomething(yyyModel); // Invoke the service.
   * ...
   * </pre>
   * <em>*NOTE: For a top-level AMD script, use require(['index'], function(){...})
   * and put the application logic within the callback function.</em>
   * </p>
   * <p>
   * A non-AMD browser application (discouraged) might do something like this:
   * <pre>
   * var xxxSvc = new TheTvdbApiV2.XxxApi(); // Allocate the API class we're going to use.
   * var yyy = new TheTvdbApiV2.Yyy(); // Construct a model instance.
   * yyyModel.someProperty = 'someValue';
   * ...
   * var zzz = xxxSvc.doSomething(yyyModel); // Invoke the service.
   * ...
   * </pre>
   * </p>
   * @module index
   * @version 2.1.2
   */
  var exports = {
    /**
     * The ApiClient constructor.
     * @property {module:ApiClient}
     */
    ApiClient: ApiClient,
    /**
     * The Auth model constructor.
     * @property {module:model/Auth}
     */
    Auth: Auth,
    /**
     * The AuthenticationString model constructor.
     * @property {module:model/AuthenticationString}
     */
    AuthenticationString: AuthenticationString,
    /**
     * The BasicEpisode model constructor.
     * @property {module:model/BasicEpisode}
     */
    BasicEpisode: BasicEpisode,
    /**
     * The Conflict model constructor.
     * @property {module:model/Conflict}
     */
    Conflict: Conflict,
    /**
     * The Episode model constructor.
     * @property {module:model/Episode}
     */
    Episode: Episode,
    /**
     * The EpisodeDataQueryParams model constructor.
     * @property {module:model/EpisodeDataQueryParams}
     */
    EpisodeDataQueryParams: EpisodeDataQueryParams,
    /**
     * The EpisodeRecordData model constructor.
     * @property {module:model/EpisodeRecordData}
     */
    EpisodeRecordData: EpisodeRecordData,
    /**
     * The FilterKeys model constructor.
     * @property {module:model/FilterKeys}
     */
    FilterKeys: FilterKeys,
    /**
     * The InlineResponse200 model constructor.
     * @property {module:model/InlineResponse200}
     */
    InlineResponse200: InlineResponse200,
    /**
     * The InlineResponse2001 model constructor.
     * @property {module:model/InlineResponse2001}
     */
    InlineResponse2001: InlineResponse2001,
    /**
     * The InlineResponse20010 model constructor.
     * @property {module:model/InlineResponse20010}
     */
    InlineResponse20010: InlineResponse20010,
    /**
     * The InlineResponse20010Data model constructor.
     * @property {module:model/InlineResponse20010Data}
     */
    InlineResponse20010Data: InlineResponse20010Data,
    /**
     * The InlineResponse20010RatingsInfo model constructor.
     * @property {module:model/InlineResponse20010RatingsInfo}
     */
    InlineResponse20010RatingsInfo: InlineResponse20010RatingsInfo,
    /**
     * The InlineResponse20011 model constructor.
     * @property {module:model/InlineResponse20011}
     */
    InlineResponse20011: InlineResponse20011,
    /**
     * The InlineResponse20011Data model constructor.
     * @property {module:model/InlineResponse20011Data}
     */
    InlineResponse20011Data: InlineResponse20011Data,
    /**
     * The InlineResponse20012 model constructor.
     * @property {module:model/InlineResponse20012}
     */
    InlineResponse20012: InlineResponse20012,
    /**
     * The InlineResponse20012Data model constructor.
     * @property {module:model/InlineResponse20012Data}
     */
    InlineResponse20012Data: InlineResponse20012Data,
    /**
     * The InlineResponse20013 model constructor.
     * @property {module:model/InlineResponse20013}
     */
    InlineResponse20013: InlineResponse20013,
    /**
     * The InlineResponse20013Data model constructor.
     * @property {module:model/InlineResponse20013Data}
     */
    InlineResponse20013Data: InlineResponse20013Data,
    /**
     * The InlineResponse20014 model constructor.
     * @property {module:model/InlineResponse20014}
     */
    InlineResponse20014: InlineResponse20014,
    /**
     * The InlineResponse20014Data model constructor.
     * @property {module:model/InlineResponse20014Data}
     */
    InlineResponse20014Data: InlineResponse20014Data,
    /**
     * The InlineResponse20015 model constructor.
     * @property {module:model/InlineResponse20015}
     */
    InlineResponse20015: InlineResponse20015,
    /**
     * The InlineResponse20015Data model constructor.
     * @property {module:model/InlineResponse20015Data}
     */
    InlineResponse20015Data: InlineResponse20015Data,
    /**
     * The InlineResponse20016 model constructor.
     * @property {module:model/InlineResponse20016}
     */
    InlineResponse20016: InlineResponse20016,
    /**
     * The InlineResponse2001Data model constructor.
     * @property {module:model/InlineResponse2001Data}
     */
    InlineResponse2001Data: InlineResponse2001Data,
    /**
     * The InlineResponse2002 model constructor.
     * @property {module:model/InlineResponse2002}
     */
    InlineResponse2002: InlineResponse2002,
    /**
     * The InlineResponse2003 model constructor.
     * @property {module:model/InlineResponse2003}
     */
    InlineResponse2003: InlineResponse2003,
    /**
     * The InlineResponse2004 model constructor.
     * @property {module:model/InlineResponse2004}
     */
    InlineResponse2004: InlineResponse2004,
    /**
     * The InlineResponse2005 model constructor.
     * @property {module:model/InlineResponse2005}
     */
    InlineResponse2005: InlineResponse2005,
    /**
     * The InlineResponse2005Data model constructor.
     * @property {module:model/InlineResponse2005Data}
     */
    InlineResponse2005Data: InlineResponse2005Data,
    /**
     * The InlineResponse2006 model constructor.
     * @property {module:model/InlineResponse2006}
     */
    InlineResponse2006: InlineResponse2006,
    /**
     * The InlineResponse2006Data model constructor.
     * @property {module:model/InlineResponse2006Data}
     */
    InlineResponse2006Data: InlineResponse2006Data,
    /**
     * The InlineResponse2007 model constructor.
     * @property {module:model/InlineResponse2007}
     */
    InlineResponse2007: InlineResponse2007,
    /**
     * The InlineResponse2007Data model constructor.
     * @property {module:model/InlineResponse2007Data}
     */
    InlineResponse2007Data: InlineResponse2007Data,
    /**
     * The InlineResponse2007Links model constructor.
     * @property {module:model/InlineResponse2007Links}
     */
    InlineResponse2007Links: InlineResponse2007Links,
    /**
     * The InlineResponse2008 model constructor.
     * @property {module:model/InlineResponse2008}
     */
    InlineResponse2008: InlineResponse2008,
    /**
     * The InlineResponse2009 model constructor.
     * @property {module:model/InlineResponse2009}
     */
    InlineResponse2009: InlineResponse2009,
    /**
     * The InlineResponse2009Data model constructor.
     * @property {module:model/InlineResponse2009Data}
     */
    InlineResponse2009Data: InlineResponse2009Data,
    /**
     * The InlineResponse200Data model constructor.
     * @property {module:model/InlineResponse200Data}
     */
    InlineResponse200Data: InlineResponse200Data,
    /**
     * The InlineResponse200Errors model constructor.
     * @property {module:model/InlineResponse200Errors}
     */
    InlineResponse200Errors: InlineResponse200Errors,
    /**
     * The InlineResponse401 model constructor.
     * @property {module:model/InlineResponse401}
     */
    InlineResponse401: InlineResponse401,
    /**
     * The InlineResponse404 model constructor.
     * @property {module:model/InlineResponse404}
     */
    InlineResponse404: InlineResponse404,
    /**
     * The InlineResponse409 model constructor.
     * @property {module:model/InlineResponse409}
     */
    InlineResponse409: InlineResponse409,
    /**
     * The JSONErrors model constructor.
     * @property {module:model/JSONErrors}
     */
    JSONErrors: JSONErrors,
    /**
     * The Language model constructor.
     * @property {module:model/Language}
     */
    Language: Language,
    /**
     * The LanguageData model constructor.
     * @property {module:model/LanguageData}
     */
    LanguageData: LanguageData,
    /**
     * The Links model constructor.
     * @property {module:model/Links}
     */
    Links: Links,
    /**
     * The NotAuthorized model constructor.
     * @property {module:model/NotAuthorized}
     */
    NotAuthorized: NotAuthorized,
    /**
     * The NotFound model constructor.
     * @property {module:model/NotFound}
     */
    NotFound: NotFound,
    /**
     * The Series model constructor.
     * @property {module:model/Series}
     */
    Series: Series,
    /**
     * The SeriesActors model constructor.
     * @property {module:model/SeriesActors}
     */
    SeriesActors: SeriesActors,
    /**
     * The SeriesActorsData model constructor.
     * @property {module:model/SeriesActorsData}
     */
    SeriesActorsData: SeriesActorsData,
    /**
     * The SeriesData model constructor.
     * @property {module:model/SeriesData}
     */
    SeriesData: SeriesData,
    /**
     * The SeriesEpisodes model constructor.
     * @property {module:model/SeriesEpisodes}
     */
    SeriesEpisodes: SeriesEpisodes,
    /**
     * The SeriesEpisodesQuery model constructor.
     * @property {module:model/SeriesEpisodesQuery}
     */
    SeriesEpisodesQuery: SeriesEpisodesQuery,
    /**
     * The SeriesEpisodesQueryParams model constructor.
     * @property {module:model/SeriesEpisodesQueryParams}
     */
    SeriesEpisodesQueryParams: SeriesEpisodesQueryParams,
    /**
     * The SeriesEpisodesSummary model constructor.
     * @property {module:model/SeriesEpisodesSummary}
     */
    SeriesEpisodesSummary: SeriesEpisodesSummary,
    /**
     * The SeriesImageQueryResult model constructor.
     * @property {module:model/SeriesImageQueryResult}
     */
    SeriesImageQueryResult: SeriesImageQueryResult,
    /**
     * The SeriesImageQueryResults model constructor.
     * @property {module:model/SeriesImageQueryResults}
     */
    SeriesImageQueryResults: SeriesImageQueryResults,
    /**
     * The SeriesImagesCount model constructor.
     * @property {module:model/SeriesImagesCount}
     */
    SeriesImagesCount: SeriesImagesCount,
    /**
     * The SeriesImagesCounts model constructor.
     * @property {module:model/SeriesImagesCounts}
     */
    SeriesImagesCounts: SeriesImagesCounts,
    /**
     * The SeriesImagesQueryParam model constructor.
     * @property {module:model/SeriesImagesQueryParam}
     */
    SeriesImagesQueryParam: SeriesImagesQueryParam,
    /**
     * The SeriesImagesQueryParams model constructor.
     * @property {module:model/SeriesImagesQueryParams}
     */
    SeriesImagesQueryParams: SeriesImagesQueryParams,
    /**
     * The SeriesSearchData model constructor.
     * @property {module:model/SeriesSearchData}
     */
    SeriesSearchData: SeriesSearchData,
    /**
     * The Token model constructor.
     * @property {module:model/Token}
     */
    Token: Token,
    /**
     * The Update model constructor.
     * @property {module:model/Update}
     */
    Update: Update,
    /**
     * The UpdateData model constructor.
     * @property {module:model/UpdateData}
     */
    UpdateData: UpdateData,
    /**
     * The UpdateDataQueryParams model constructor.
     * @property {module:model/UpdateDataQueryParams}
     */
    UpdateDataQueryParams: UpdateDataQueryParams,
    /**
     * The User model constructor.
     * @property {module:model/User}
     */
    User: User,
    /**
     * The UserData model constructor.
     * @property {module:model/UserData}
     */
    UserData: UserData,
    /**
     * The UserFavorites model constructor.
     * @property {module:model/UserFavorites}
     */
    UserFavorites: UserFavorites,
    /**
     * The UserFavoritesData model constructor.
     * @property {module:model/UserFavoritesData}
     */
    UserFavoritesData: UserFavoritesData,
    /**
     * The UserRatings model constructor.
     * @property {module:model/UserRatings}
     */
    UserRatings: UserRatings,
    /**
     * The UserRatingsData model constructor.
     * @property {module:model/UserRatingsData}
     */
    UserRatingsData: UserRatingsData,
    /**
     * The UserRatingsDataNoLinks model constructor.
     * @property {module:model/UserRatingsDataNoLinks}
     */
    UserRatingsDataNoLinks: UserRatingsDataNoLinks,
    /**
     * The UserRatingsQueryParams model constructor.
     * @property {module:model/UserRatingsQueryParams}
     */
    UserRatingsQueryParams: UserRatingsQueryParams,
    /**
     * The AuthenticationApi service constructor.
     * @property {module:api/AuthenticationApi}
     */
    AuthenticationApi: AuthenticationApi,
    /**
     * The EpisodesApi service constructor.
     * @property {module:api/EpisodesApi}
     */
    EpisodesApi: EpisodesApi,
    /**
     * The LanguagesApi service constructor.
     * @property {module:api/LanguagesApi}
     */
    LanguagesApi: LanguagesApi,
    /**
     * The SearchApi service constructor.
     * @property {module:api/SearchApi}
     */
    SearchApi: SearchApi,
    /**
     * The SeriesApi service constructor.
     * @property {module:api/SeriesApi}
     */
    SeriesApi: SeriesApi,
    /**
     * The UpdatesApi service constructor.
     * @property {module:api/UpdatesApi}
     */
    UpdatesApi: UpdatesApi,
    /**
     * The UsersApi service constructor.
     * @property {module:api/UsersApi}
     */
    UsersApi: UsersApi
  };

  return exports;
}));
