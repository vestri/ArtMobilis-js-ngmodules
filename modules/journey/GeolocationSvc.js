/**
* A singleton that retrieve gps position and converts it to flat coordinates.
* @class angular_module.journey.GeolocationSvc
* @memberOf angular_module.journey
*/

angular.module('journey')

.service('GeolocationSvc', function(CoordinatesConverterSvc) {

  var _position = { x: 0, y: 0 };
  var _converter;
  var _watch_id;
  var _watching = false;

  var _retry_rate_ms = 1000;
  var _retry_max = 10;
  var _retry_nbr = 0;

  var _loading = false;

  var _on_watch;
  var _on_error;


  function OnNewPosition() {
    var event = new CustomEvent('device_move_xy', { detail: { x: _position.x, y: _position.y } });
    document.dispatchEvent(event);
  }

  function SetCoords(latitude, longitude) {
    _position = CoordinatesConverterSvc.ConvertLocalCoordinates(latitude, longitude);
    OnNewPosition();
  }

  function OnSuccess(pos) {
    _retry_nbr = 0;
    _watching = true;
    _loading = false;
    if (_on_watch) {
      _on_watch();
      _on_watch = undefined;
    }
    SetCoords(pos.coords.latitude, pos.coords.longitude);
  }

  function OnError(e) {
    console.log('Geolocation error: ' + e.message);
    if (_retry_nbr < _retry_max) {
      ++_retry_nbr;
      window.setTimeout(WatchPosition, _retry_rate_ms);
    }
    else {
      _watching = false;
      _loading = false;
      if (_on_error)
        _on_error(e.message);
    }
  }

  function WatchPosition() {
    _watch_id = navigator.geolocation.watchPosition(OnSuccess, OnError);
  }


  this.Start = function(on_watch, on_error) {
    if (!_watching && !_loading) {
      _on_watch = on_watch;
      _on_error = on_error;
      if (navigator && navigator.geolocation) {
        _loading = true;
        _retry_nbr = 0;
        WatchPosition();
      }
      else {
        if (_on_error)
          _on_error('geolocation unavailable');
      }
    }
  };

  this.Stop = function() {
    if (_watching) {
      navigator.geolocation.clearWatch(_watch_id);
      _watching = false;
    }
  };

  this.GetPosition = function() {
    return { x: _position.x, y: _position.y };
  };

  this.IsLoading = function() {
    return _loading;
  };

  this.IsWatching = function() {
    return _watching;
  };

  this.SimulateNewCoords = function(latitude, longitude) {
    SetCoords(latitude, longitude);
  };

  this.SimulateNewPosition = function(x, y) {
    _position.x = x;
    _position.y = y;
    OnNewPosition();
  };


});