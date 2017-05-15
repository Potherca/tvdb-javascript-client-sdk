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
    // AMD.
    define(['expect.js', '../../src/index'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    factory(require('expect.js'), require('../../src/index'));
  } else {
    // Browser globals (root is window)
    factory(root.expect, root.TheTvdbApiV2);
  }
}(this, function(expect, TheTvdbApiV2) {
  'use strict';

  var instance;

  beforeEach(function() {
    instance = new TheTvdbApiV2.Episode();
  });

  var getProperty = function(object, getter, property) {
    // Use getter method if present; otherwise, get the property directly.
    if (typeof object[getter] === 'function')
      return object[getter]();
    else
      return object[property];
  }

  var setProperty = function(object, setter, property, value) {
    // Use setter method if present; otherwise, set the property directly.
    if (typeof object[setter] === 'function')
      object[setter](value);
    else
      object[property] = value;
  }

  describe('Episode', function() {
    it('should create an instance of Episode', function() {
      // uncomment below and update the code to test Episode
      //var instane = new TheTvdbApiV2.Episode();
      //expect(instance).to.be.a(TheTvdbApiV2.Episode);
    });

    it('should have the property absoluteNumber (base name: "absoluteNumber")', function() {
      // uncomment below and update the code to test the property absoluteNumber
      //var instane = new TheTvdbApiV2.Episode();
      //expect(instance).to.be();
    });

    it('should have the property airedEpisodeNumber (base name: "airedEpisodeNumber")', function() {
      // uncomment below and update the code to test the property airedEpisodeNumber
      //var instane = new TheTvdbApiV2.Episode();
      //expect(instance).to.be();
    });

    it('should have the property airedSeason (base name: "airedSeason")', function() {
      // uncomment below and update the code to test the property airedSeason
      //var instane = new TheTvdbApiV2.Episode();
      //expect(instance).to.be();
    });

    it('should have the property airsAfterSeason (base name: "airsAfterSeason")', function() {
      // uncomment below and update the code to test the property airsAfterSeason
      //var instane = new TheTvdbApiV2.Episode();
      //expect(instance).to.be();
    });

    it('should have the property airsBeforeEpisode (base name: "airsBeforeEpisode")', function() {
      // uncomment below and update the code to test the property airsBeforeEpisode
      //var instane = new TheTvdbApiV2.Episode();
      //expect(instance).to.be();
    });

    it('should have the property airsBeforeSeason (base name: "airsBeforeSeason")', function() {
      // uncomment below and update the code to test the property airsBeforeSeason
      //var instane = new TheTvdbApiV2.Episode();
      //expect(instance).to.be();
    });

    it('should have the property director (base name: "director")', function() {
      // uncomment below and update the code to test the property director
      //var instane = new TheTvdbApiV2.Episode();
      //expect(instance).to.be();
    });

    it('should have the property directors (base name: "directors")', function() {
      // uncomment below and update the code to test the property directors
      //var instane = new TheTvdbApiV2.Episode();
      //expect(instance).to.be();
    });

    it('should have the property dvdChapter (base name: "dvdChapter")', function() {
      // uncomment below and update the code to test the property dvdChapter
      //var instane = new TheTvdbApiV2.Episode();
      //expect(instance).to.be();
    });

    it('should have the property dvdDiscid (base name: "dvdDiscid")', function() {
      // uncomment below and update the code to test the property dvdDiscid
      //var instane = new TheTvdbApiV2.Episode();
      //expect(instance).to.be();
    });

    it('should have the property dvdEpisodeNumber (base name: "dvdEpisodeNumber")', function() {
      // uncomment below and update the code to test the property dvdEpisodeNumber
      //var instane = new TheTvdbApiV2.Episode();
      //expect(instance).to.be();
    });

    it('should have the property dvdSeason (base name: "dvdSeason")', function() {
      // uncomment below and update the code to test the property dvdSeason
      //var instane = new TheTvdbApiV2.Episode();
      //expect(instance).to.be();
    });

    it('should have the property episodeName (base name: "episodeName")', function() {
      // uncomment below and update the code to test the property episodeName
      //var instane = new TheTvdbApiV2.Episode();
      //expect(instance).to.be();
    });

    it('should have the property filename (base name: "filename")', function() {
      // uncomment below and update the code to test the property filename
      //var instane = new TheTvdbApiV2.Episode();
      //expect(instance).to.be();
    });

    it('should have the property firstAired (base name: "firstAired")', function() {
      // uncomment below and update the code to test the property firstAired
      //var instane = new TheTvdbApiV2.Episode();
      //expect(instance).to.be();
    });

    it('should have the property guestStars (base name: "guestStars")', function() {
      // uncomment below and update the code to test the property guestStars
      //var instane = new TheTvdbApiV2.Episode();
      //expect(instance).to.be();
    });

    it('should have the property id (base name: "id")', function() {
      // uncomment below and update the code to test the property id
      //var instane = new TheTvdbApiV2.Episode();
      //expect(instance).to.be();
    });

    it('should have the property imdbId (base name: "imdbId")', function() {
      // uncomment below and update the code to test the property imdbId
      //var instane = new TheTvdbApiV2.Episode();
      //expect(instance).to.be();
    });

    it('should have the property lastUpdated (base name: "lastUpdated")', function() {
      // uncomment below and update the code to test the property lastUpdated
      //var instane = new TheTvdbApiV2.Episode();
      //expect(instance).to.be();
    });

    it('should have the property lastUpdatedBy (base name: "lastUpdatedBy")', function() {
      // uncomment below and update the code to test the property lastUpdatedBy
      //var instane = new TheTvdbApiV2.Episode();
      //expect(instance).to.be();
    });

    it('should have the property overview (base name: "overview")', function() {
      // uncomment below and update the code to test the property overview
      //var instane = new TheTvdbApiV2.Episode();
      //expect(instance).to.be();
    });

    it('should have the property productionCode (base name: "productionCode")', function() {
      // uncomment below and update the code to test the property productionCode
      //var instane = new TheTvdbApiV2.Episode();
      //expect(instance).to.be();
    });

    it('should have the property seriesId (base name: "seriesId")', function() {
      // uncomment below and update the code to test the property seriesId
      //var instane = new TheTvdbApiV2.Episode();
      //expect(instance).to.be();
    });

    it('should have the property showUrl (base name: "showUrl")', function() {
      // uncomment below and update the code to test the property showUrl
      //var instane = new TheTvdbApiV2.Episode();
      //expect(instance).to.be();
    });

    it('should have the property siteRating (base name: "siteRating")', function() {
      // uncomment below and update the code to test the property siteRating
      //var instane = new TheTvdbApiV2.Episode();
      //expect(instance).to.be();
    });

    it('should have the property siteRatingCount (base name: "siteRatingCount")', function() {
      // uncomment below and update the code to test the property siteRatingCount
      //var instane = new TheTvdbApiV2.Episode();
      //expect(instance).to.be();
    });

    it('should have the property thumbAdded (base name: "thumbAdded")', function() {
      // uncomment below and update the code to test the property thumbAdded
      //var instane = new TheTvdbApiV2.Episode();
      //expect(instance).to.be();
    });

    it('should have the property thumbAuthor (base name: "thumbAuthor")', function() {
      // uncomment below and update the code to test the property thumbAuthor
      //var instane = new TheTvdbApiV2.Episode();
      //expect(instance).to.be();
    });

    it('should have the property thumbHeight (base name: "thumbHeight")', function() {
      // uncomment below and update the code to test the property thumbHeight
      //var instane = new TheTvdbApiV2.Episode();
      //expect(instance).to.be();
    });

    it('should have the property thumbWidth (base name: "thumbWidth")', function() {
      // uncomment below and update the code to test the property thumbWidth
      //var instane = new TheTvdbApiV2.Episode();
      //expect(instance).to.be();
    });

    it('should have the property writers (base name: "writers")', function() {
      // uncomment below and update the code to test the property writers
      //var instane = new TheTvdbApiV2.Episode();
      //expect(instance).to.be();
    });

  });

}));
