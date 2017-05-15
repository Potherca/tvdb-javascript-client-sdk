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
    instance = new TheTvdbApiV2.Series();
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

  describe('Series', function() {
    it('should create an instance of Series', function() {
      // uncomment below and update the code to test Series
      //var instane = new TheTvdbApiV2.Series();
      //expect(instance).to.be.a(TheTvdbApiV2.Series);
    });

    it('should have the property added (base name: "added")', function() {
      // uncomment below and update the code to test the property added
      //var instane = new TheTvdbApiV2.Series();
      //expect(instance).to.be();
    });

    it('should have the property airsDayOfWeek (base name: "airsDayOfWeek")', function() {
      // uncomment below and update the code to test the property airsDayOfWeek
      //var instane = new TheTvdbApiV2.Series();
      //expect(instance).to.be();
    });

    it('should have the property airsTime (base name: "airsTime")', function() {
      // uncomment below and update the code to test the property airsTime
      //var instane = new TheTvdbApiV2.Series();
      //expect(instance).to.be();
    });

    it('should have the property aliases (base name: "aliases")', function() {
      // uncomment below and update the code to test the property aliases
      //var instane = new TheTvdbApiV2.Series();
      //expect(instance).to.be();
    });

    it('should have the property banner (base name: "banner")', function() {
      // uncomment below and update the code to test the property banner
      //var instane = new TheTvdbApiV2.Series();
      //expect(instance).to.be();
    });

    it('should have the property firstAired (base name: "firstAired")', function() {
      // uncomment below and update the code to test the property firstAired
      //var instane = new TheTvdbApiV2.Series();
      //expect(instance).to.be();
    });

    it('should have the property genre (base name: "genre")', function() {
      // uncomment below and update the code to test the property genre
      //var instane = new TheTvdbApiV2.Series();
      //expect(instance).to.be();
    });

    it('should have the property id (base name: "id")', function() {
      // uncomment below and update the code to test the property id
      //var instane = new TheTvdbApiV2.Series();
      //expect(instance).to.be();
    });

    it('should have the property imdbId (base name: "imdbId")', function() {
      // uncomment below and update the code to test the property imdbId
      //var instane = new TheTvdbApiV2.Series();
      //expect(instance).to.be();
    });

    it('should have the property lastUpdated (base name: "lastUpdated")', function() {
      // uncomment below and update the code to test the property lastUpdated
      //var instane = new TheTvdbApiV2.Series();
      //expect(instance).to.be();
    });

    it('should have the property network (base name: "network")', function() {
      // uncomment below and update the code to test the property network
      //var instane = new TheTvdbApiV2.Series();
      //expect(instance).to.be();
    });

    it('should have the property networkId (base name: "networkId")', function() {
      // uncomment below and update the code to test the property networkId
      //var instane = new TheTvdbApiV2.Series();
      //expect(instance).to.be();
    });

    it('should have the property overview (base name: "overview")', function() {
      // uncomment below and update the code to test the property overview
      //var instane = new TheTvdbApiV2.Series();
      //expect(instance).to.be();
    });

    it('should have the property rating (base name: "rating")', function() {
      // uncomment below and update the code to test the property rating
      //var instane = new TheTvdbApiV2.Series();
      //expect(instance).to.be();
    });

    it('should have the property runtime (base name: "runtime")', function() {
      // uncomment below and update the code to test the property runtime
      //var instane = new TheTvdbApiV2.Series();
      //expect(instance).to.be();
    });

    it('should have the property seriesId (base name: "seriesId")', function() {
      // uncomment below and update the code to test the property seriesId
      //var instane = new TheTvdbApiV2.Series();
      //expect(instance).to.be();
    });

    it('should have the property seriesName (base name: "seriesName")', function() {
      // uncomment below and update the code to test the property seriesName
      //var instane = new TheTvdbApiV2.Series();
      //expect(instance).to.be();
    });

    it('should have the property siteRating (base name: "siteRating")', function() {
      // uncomment below and update the code to test the property siteRating
      //var instane = new TheTvdbApiV2.Series();
      //expect(instance).to.be();
    });

    it('should have the property siteRatingCount (base name: "siteRatingCount")', function() {
      // uncomment below and update the code to test the property siteRatingCount
      //var instane = new TheTvdbApiV2.Series();
      //expect(instance).to.be();
    });

    it('should have the property status (base name: "status")', function() {
      // uncomment below and update the code to test the property status
      //var instane = new TheTvdbApiV2.Series();
      //expect(instance).to.be();
    });

    it('should have the property zap2itId (base name: "zap2itId")', function() {
      // uncomment below and update the code to test the property zap2itId
      //var instane = new TheTvdbApiV2.Series();
      //expect(instance).to.be();
    });

  });

}));
