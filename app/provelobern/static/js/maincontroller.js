goog.provide('app.MainController');

goog.require('app');
goog.require('app.GeoLocateControl');
goog.require('goog.asserts');
goog.require('goog.dom');
goog.require('ngeo.GetBrowserLanguage');
goog.require('ngeo.Location');
goog.require('ngeo.mapDirective');
goog.require('ol.Map');
goog.require('ol.Size');
goog.require('ol.View');
goog.require('ol.control.ZoomToExtent');
goog.require('ol.layer.Tile');
goog.require('ol.source.OSM');



/**
 * @param {angularGettext.Catalog} gettextCatalog Gettext catalog.
 * @param {string} langUrlTemplate Language URL template.
 * @param {ngeo.GetBrowserLanguage} ngeoGetBrowserLanguage
 *        GetBrowserLanguage Service.
 * @param {ngeo.Location} ngeoLocation ngeo Location service.
 * @constructor
 * @export
 * @ngInject
 */
app.MainController = function(gettextCatalog, langUrlTemplate,
    ngeoGetBrowserLanguage, ngeoLocation) {

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
   * @type {ol.Extent}
   * @private
   */
  this.extentBern_ = ol.proj.transformExtent(
      [7.41871, 46.97244, 7.47007, 46.92553], 'EPSG:4326', 'EPSG:3857');

  /**
   * @type {ol.Extent}
   * @private
   */
  this.extentSwiss_ = ol.proj.transformExtent(
      [5.7997, 45.7016, 10.597, 47.89975], 'EPSG:4326', 'EPSG:3857');

  var attribution = new ol.control.Attribution({
    collapsible: false
  });

  /**
   * @private
   * @type {ol.Map}
   */
  this.map_ = new ol.Map({
    layers: [
      new ol.layer.Tile({
        source: new ol.source.OSM({
          // url: 'http://tile.osm.ch/osm-swiss-style/{z}/{x}/{y}.png',
          url:
              'http://tile{0-9}-osm-ch.provelobern-geomapfish.prod.sig' +
              '.cloud.camptocamp.net/osm-swiss-style/{z}/{x}/{y}.png',
          crossOrigin: null,
          attributions: [
            new ol.Attribution({
              html: '&copy; ' +
                  '<a href="http://www.provelobern.ch/" target="_blank">' +
                  'ProVeloBern</a>'
            }),
            new ol.Attribution({
              html: '&copy; ' +
                  '<a href="http://www.sosm.ch" target="_blank">osm.ch</a>'
            }),
            new ol.Attribution({
              html: '&copy; ' +
                  '<a href="http://www.openstreetmap.org/copyright"' +
                  'target="_blank">OpenStreetMap</a> contributors.'
            })
          ]
        })
      })
    ],
    view: new ol.View({
      center: ol.proj.transform([8.415, 47.027], 'EPSG:4326', 'EPSG:3857'),
      zoom: 10
    }),
    controls: ol.control.defaults({
      attribution: false
    }).extend([
      attribution,
      new app.GeoLocateControl({
        extent: this.extentSwiss_
      }),
      new ol.control.ZoomToExtent(
          /** @type {olx.control.ZoomToExtentOptions} */ ({
            extent: this.extentBern_,
            label: goog.dom.htmlToDocumentFragment(
                '<span class="glyphicon glyphicon-fullscreen" ' +
                'aria-hidden="true"></span>')
          }))
    ])
  });

  var size = this.map_.getSize();
  if (goog.isDef(size)) {
    this.map_.getView().fitExtent(this.extentBern_, size);
  } else {
    this.map_.once('change:size', function() {
      var size = this.map_.getSize();
      goog.asserts.assert(goog.isDef(size));
      this.map_.getView().fitExtent(
          this.extentBern_, /** @type {ol.Size} */ (size));
    }, this);
  }

  this['map'] = this.map_;

  var projectLanguages = ['en', 'de'];
  var lang = ngeoLocation.getParam('lang');
  if (!goog.array.contains(projectLanguages, lang)) {
    lang = ngeoGetBrowserLanguage(projectLanguages) || 'en';
  }
  this.switchLanguage(lang);
};


/**
 * @param {string} lang Language code.
 * @export
 */
app.MainController.prototype.switchLanguage = function(lang) {
  console.log(lang);
  this.gettextCatalog_.setCurrentLanguage(lang);
  if (lang !== 'en') {
    this.gettextCatalog_.loadRemote(
        this.langUrlTemplate_.replace('__lang__', lang));
  }
  this['lang'] = lang;
};


app.module.controller('MainController', app.MainController);
