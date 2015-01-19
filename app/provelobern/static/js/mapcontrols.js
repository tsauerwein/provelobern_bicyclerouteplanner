goog.provide('app.GeoLocateControl');
goog.provide('app.InfoControl');

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
app.ButtonControl = function(options) {
  var label = goog.isDef(options.label) ? options.label : '?';

  var button = goog.dom.createDom(goog.dom.TagName.BUTTON, {
    'type': 'button',
    'title': options.tipLabel
  }, label);

  goog.events.listen(button, goog.events.EventType.CLICK,
      this.handleClick_, false, this);

  goog.events.listen(button, [
    goog.events.EventType.MOUSEOUT,
    goog.events.EventType.FOCUSOUT
  ], function() {
    this.blur();
  }, false);

  var cssClasses = options.className + ' ' + ol.css.CLASS_UNSELECTABLE + ' ' +
      ol.css.CLASS_CONTROL;
  var element = goog.dom.createDom(goog.dom.TagName.DIV, cssClasses, button);

  ol.control.Control.call(this, {
    element: element,
    target: options.target
  });

};
ol.inherits(app.ButtonControl, ol.control.Control);


/**
 * @param {goog.events.BrowserEvent} event The event to handle
 * @private
 */
app.ButtonControl.prototype.handleClick_ = goog.abstractMethod;



/**
 * @constructor
 * @extends {app.ButtonControl}
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

  goog.object.extend(options, {
    tipLabel: goog.isDef(options.tipLabel) ? options.tipLabel : 'Locate',
    className: goog.isDef(options.className) ? options.className : 'ol-locate',
    label: goog.isDef(options.label) ?
        options.label : goog.dom.htmlToDocumentFragment(
            '<span class="glyphicon glyphicon-globe"></span>')
  });

  app.ButtonControl.call(this, options);
};
ol.inherits(app.GeoLocateControl, app.ButtonControl);


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



/**
 * @constructor
 * @extends {app.ButtonControl}
 * @param {Object} options Control options.
 */
app.InfoControl = function(options) {
  this.dialog_ = goog.isDef(options.dialog) ? options.dialog : '#imprint';

  goog.object.extend(options, {
    tipLabel: goog.isDef(options.tipLabel) ? options.tipLabel : 'Info',
    className: goog.isDef(options.className) ? options.className : 'ol-info',
    label: goog.isDef(options.label) ? options.label : '?'
  });

  app.ButtonControl.call(this, options);
};
ol.inherits(app.InfoControl, app.ButtonControl);


/**
 * @param {goog.events.BrowserEvent} event The event to handle
 * @private
 */
app.InfoControl.prototype.handleClick_ = function(event) {
  event.preventDefault();
  $(this.dialog_).modal('show');
};
