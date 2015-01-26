goog.provide('app.MainController');

goog.require('app');
goog.require('app.Drag');
goog.require('app.GeoLocateControl');
goog.require('app.InfoControl');
goog.require('goog.asserts');
goog.require('goog.dom');
goog.require('goog.net.CorsXmlHttpFactory');
goog.require('goog.net.XhrIo');
goog.require('ngeo.GetBrowserLanguage');
goog.require('ngeo.Location');
goog.require('ngeo.mapDirective');
goog.require('ol.Feature');
goog.require('ol.Map');
goog.require('ol.Size');
goog.require('ol.View');
goog.require('ol.control.ZoomToExtent');
goog.require('ol.format.Polyline');
goog.require('ol.geom.Point');
goog.require('ol.layer.Tile');
goog.require('ol.layer.Vector');
goog.require('ol.source.OSM');
goog.require('ol.source.Vector');
goog.require('ol.style.Fill');
goog.require('ol.style.Stroke');
goog.require('ol.style.Style');



/**
 * @param {angular.Scope} $scope Scope.
 * @param {angularGettext.Catalog} gettextCatalog Gettext catalog.
 * @param {string} langUrlTemplate Language URL template.
 * @param {ngeo.GetBrowserLanguage} ngeoGetBrowserLanguage
 *        GetBrowserLanguage Service.
 * @param {ngeo.Location} ngeoLocation ngeo Location service.
 * @constructor
 * @export
 * @ngInject
 */
app.MainController = function($scope, gettextCatalog, langUrlTemplate,
    ngeoGetBrowserLanguage, ngeoLocation) {

  this['scope'] = $scope;

  this.osrmUrl_ =
      'http://provelobern-geomapfish.prod.sig.cloud.camptocamp.net/' +
      '{profile}/viaroute?loc={from}&loc={to}&instructions=false&alt=false' +
      '&z={zoom}&output=json';

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

  /**
   * @type {ol.Feature}
   * @private
   */
  this.startFeature_ = null;

  /**
   * @type {ol.Feature}
   * @private
   */
  this.targetFeature_ = null;

  this.attribution_ = new ol.control.Attribution({
    collapsible: false,
    collapseLabel: '\u00AB'
  });

  this.vectorSource_ = new ol.source.Vector({
    features: []
  });

  this.vectorLayer_ = new ol.layer.Vector({
    source: this.vectorSource_,
    style: function(feature, resolution) {
      return [new ol.style.Style({
        image: new ol.style.Icon(/** @type {olx.style.IconOptions} */ ({
          anchor: [0.5, 42],
          anchorXUnits: 'fraction',
          anchorYUnits: 'pixel',
          src: feature.get('start') ?
              'static/img/marker-a.png' : 'static/img/marker-b.png'
        }))
      })];
    }
  });

  this.routeSource_ = new ol.source.Vector({
    features: []
  });

  this.routeLayer_ = new ol.layer.Vector({
    source: this.routeSource_,
    style: new ol.style.Style({
      fill: new ol.style.Fill({
        color: 'rgba(16, 112, 29, 0.6)'
      }),
      stroke: new ol.style.Stroke({
        color: 'rgba(16, 112, 29, 0.6)',
        width: 5
      })
    })
  });

  var dragInteraction = new app.Drag({
    layerFilter: function(layer) {
      return layer === this.vectorLayer_;
    },
    layerFilterThis: this
  });
  dragInteraction.on(app.Drag.FEATUREDRAGEND, function(evt) {
    this.updateRoute_();
  }, this);

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
      }),
      this.routeLayer_,
      this.vectorLayer_
    ],
    view: new ol.View({
      center: ol.proj.transform([8.415, 47.027], 'EPSG:4326', 'EPSG:3857'),
      zoom: 10
    }),
    controls: ol.control.defaults({
      attribution: false
    }).extend([
      this.attribution_,
      new app.GeoLocateControl({
        extent: this.extentSwiss_
      }),
      new app.InfoControl({
        dialog: '#imprint'
      }),
      new ol.control.ZoomToExtent(
          /** @type {olx.control.ZoomToExtentOptions} */ ({
            extent: this.extentBern_,
            label: goog.dom.htmlToDocumentFragment(
                '<span class="glyphicon glyphicon-fullscreen" ' +
                'aria-hidden="true"></span>')
          }))
    ]),
    interactions: ol.interaction.defaults().extend([dragInteraction])
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

  this.map_.on('click', this.handleMapClick_, this);

  this['map'] = this.map_;

  var projectLanguages = ['en', 'de'];
  var lang = ngeoLocation.getParam('lang');
  if (!goog.array.contains(projectLanguages, lang)) {
    lang = ngeoGetBrowserLanguage(projectLanguages) || 'en';
  }
  this.switchLanguage(lang);
  this['status'] = '';
};


/**
 * @param {string} lang Language code.
 * @export
 */
app.MainController.prototype.switchLanguage = function(lang) {
  this.gettextCatalog_.setCurrentLanguage(lang);
  if (lang !== 'en') {
    this.gettextCatalog_.loadRemote(
        this.langUrlTemplate_.replace('__lang__', lang));
  }
  this['lang'] = lang;
};


/**
 * @param {ol.MapBrowserEvent} event The event to handle.
 * @private
 */
app.MainController.prototype.handleMapClick_ = function(event) {
  if (this.startFeature_ === null) {
    this.setStartCoordinate_(this.map_.getCoordinateFromPixel(event.pixel));
  } else if (this.targetFeature_ === null) {
    this.setTargetCoordinate_(this.map_.getCoordinateFromPixel(event.pixel));
  }
  // else ignore
};


/**
 * @param {ol.Coordinate} coord The coordinate.
 * @private
 */
app.MainController.prototype.setStartCoordinate_ = function(coord) {
  var feature = new ol.Feature({
    geometry: new ol.geom.Point(coord),
    start: true
  });
  this.startFeature_ = feature;
  this.vectorSource_.addFeature(feature);
};


/**
 * @param {ol.Coordinate} coord The coordinate.
 * @private
 */
app.MainController.prototype.setTargetCoordinate_ = function(coord) {
  var feature = new ol.Feature({
    geometry: new ol.geom.Point(coord),
    start: false
  });
  this.targetFeature_ = feature;
  this.vectorSource_.addFeature(feature);
  this.requestRoute_();
};


/**
 * @private
 */
app.MainController.prototype.updateRoute_ = function() {
  if (this.startFeature_ === null || this.targetFeature_ === null) {
    return;
  }
  this.requestRoute_();
};


/**
 * @private
 */
app.MainController.prototype.requestRoute_ = function() {
  var fromPoint =
      /** @type {ol.geom.Point} */ (this.startFeature_.getGeometry());
  var from = ol.proj.transform(
      fromPoint.getCoordinates(), 'EPSG:3857', 'EPSG:4326');
  var toPoint =
      /** @type {ol.geom.Point} */ (this.targetFeature_.getGeometry());
  var to = ol.proj.transform(
      toPoint.getCoordinates(), 'EPSG:3857', 'EPSG:4326');

  var url = this.osrmUrl_
    .replace('{profile}', 'upstream')
    .replace('{from}', from[1] + ',' + from[0])
    .replace('{to}', to[1] + ',' + to[0])
    .replace('{zoom}', '20');

  this.routeSource_.clear();
  goog.net.XhrIo.send(url, goog.bind(function(e) {
    var xhr = /** @type {goog.net.XhrIo} */ (e.target);
    if (!xhr.isSuccess()) {
      this['status'] = 'error';
    }
    var response = xhr.getResponseJson();
    if (response['status'] === 0) {
      var format = new ol.format.Polyline({factor: 1e6});
      var route = format.readGeometry(response['route_geometry'], {
        dataProjection: 'EPSG:4326',
        featureProjection: 'EPSG:3857'
      });
      this.routeSource_.addFeature(new ol.Feature({
        geometry: route
      }));
      this['routeTime'] = response['route_summary']['total_time'];
      this['routeDistance'] = response['route_summary']['total_distance']/1000;
      this['status'] = 'route';
    } else {
      this['status'] = 'route-invalid';
    }
    console.log(response);
    this['scope'].$apply();
  }, this));

};

app.module.controller('MainController', app.MainController);



// /**
//  * @param {angular.Filter} $filter Filter.
//  * @constructor
//  * @ngInject
//  */
// app.MetersFilter = function($filter) {
//   return function(value) {
//     if (value < 1000) {
//       return value + 'm';
//     } else {
//       value = value / 1000;
//       return $filter('number')(value, 1) + 'km';
//     }
//   }
// };

// app.module.filter('meters', app.MetersFilter);
