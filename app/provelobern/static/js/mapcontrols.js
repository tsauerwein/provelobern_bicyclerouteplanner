goog.provide('app.GeoLocateControl');

goog.require('app');
goog.require('goog.dom');
goog.require('ol');
goog.require('ol.Geolocation');
goog.require('ol.control.Control');



/**
 * @constructor
 * @extends {ol.control.Control}
 * @param {Object} options Control options.
 */
app.GeoLocateControl = function(options) {
  /**
   * @type {ol.Geolocation}
   * @private
   */
  this.geolocation_ = null;
  /**
   * @type {boolean}
   * @private
   */
  this.active_ = false;
  /**
   * @type {ol.Extent}
   * @private
   */
  this.extent_ = options.extent;

  var label =
      '<span class="glyphicon glyphicon-globe" aria-hidden="true"></span>';
  var tipLabel = goog.isDef(options.tipLabel) ?
      options.tipLabel : 'Locate';
  var className = goog.isDef(options.className) ?
      options.className : 'ol-locate';

  var button = goog.dom.createDom(goog.dom.TagName.BUTTON, {
    'type': 'button',
    'title': tipLabel
  }, goog.dom.htmlToDocumentFragment(label));

  goog.events.listen(button, goog.events.EventType.CLICK,
      this.handleClick_, false, this);

  goog.events.listen(button, [
    goog.events.EventType.MOUSEOUT,
    goog.events.EventType.FOCUSOUT
  ], function() {
    this.blur();
  }, false);

  var cssClasses = className + ' ' + ol.css.CLASS_UNSELECTABLE + ' ' +
      ol.css.CLASS_CONTROL;
  var element = goog.dom.createDom(goog.dom.TagName.DIV, cssClasses, button);

  ol.control.Control.call(this, {
    element: element,
    target: options.target
  });

};
ol.inherits(app.GeoLocateControl, ol.control.Control);


/**
 * @param {goog.events.BrowserEvent} event The event to handle
 * @private
 */
app.GeoLocateControl.prototype.handleClick_ = function(event) {
  event.preventDefault();
  if (goog.isNull(this.geolocation_)) {
    this.geolocation_ = new ol.Geolocation({
      projection: this.getMap().getView().getProjection()
    });
  }

  if (this.active_) {
    return;
  }

  this.geolocation_.once('change:position', function(e) {
    var coordinates = /** @type {ol.Coordinate} */
                      (this.geolocation_.getPosition());
    var view = this.getMap().getView();
    if (ol.extent.containsCoordinate(this.extent_, coordinates) && (
        coordinates[0] !== view.getCenter()[0] ||
        coordinates[1] !== view.getCenter()[1])) {
      view.setCenter(coordinates);
      view.setZoom(15);
    }

    this.active_ = false;
    this.geolocation_.setTracking(false);
  }, this);
  this.geolocation_.setTracking(true);
};
