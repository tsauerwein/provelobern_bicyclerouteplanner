goog.provide('app.MainController');

goog.require('app');
goog.require('ngeo.mapDirective');
goog.require('ol.Map');
goog.require('ol.View');
goog.require('ol.layer.Tile');
goog.require('ol.source.OSM');



/**
 * @param {angularGettext.Catalog} gettextCatalog Gettext catalog.
 * @param {string} langUrlTemplate Language URL template.
 * @constructor
 * @export
 * @ngInject
 */
app.MainController = function(gettextCatalog, langUrlTemplate) {

  /**
   * @type {angularGettext.Catalog}
   * @private
   */
  this.gettextCatalog_ = gettextCatalog;

  /**
   * @type {string}
   * @private
   */
  this.langUrlTemplate_ = langUrlTemplate;

  /**
   * @private
   * @type {ol.Map}
   */
  this.map_ = new ol.Map({
    layers: [
      new ol.layer.Tile({
        source: new ol.source.OSM()
      })
    ],
    view: new ol.View({
      center: [0, 0],
      zoom: 4
    })
  });

  this['map'] = this.map_;

  this.switchLanguage('fr');
};


/**
 * @param {string} lang Language code.
 * @export
 */
app.MainController.prototype.switchLanguage = function(lang) {
  this.gettextCatalog_.setCurrentLanguage(lang);
  this.gettextCatalog_.loadRemote(
      this.langUrlTemplate_.replace('__lang__', lang));
  this['lang'] = lang;
};


app.module.controller('MainController', app.MainController);
