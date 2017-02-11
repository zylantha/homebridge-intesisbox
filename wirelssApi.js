
var express = require('express');
var app = express();

var WirelessThermostat = require('./WirelessThermostat.js');
var wirelessThermostat = new WirelessThermostat().init();

var data = {
    targetHeatingCoolingState: 3,
    targetTemperature: 20,
    currentHeatingCoolingState: 1,
    currentTemperature: 19,
    currentRelativeHumidity: 30
};

wirelessThermostat.send(1, 3, null, function(value) {
  console.log("Success, currentHeatingCoolingState: ", value);
  data.currentHeatingCoolingState = value;

  wirelessThermostat.send(1, 4, null, function(value) {
    console.log("Success, currentTemperature: ", value/10);
    data.currentTemperature = value/10;
    
    wirelessThermostat.send(1, 5, null, function(value) {
      console.log("Success, currentRelativeHumidity: ", value/10);
      data.currentRelativeHumidity = value/10;
    }); 
  });
});





//ROUTING
app
.get('/status', function (req, res, next) {
  res.send(data);
})
.get('/targetTemperature/:temperature', function (req, res, next) { //Set Temperature
  var tt = parseInt(req.params.temperature);
  var id = 1;
  var command = 1;

  wirelessThermostat.send(id, command, tt, function(value) {
    console.log("Success, responded: ", value);
    data.targetTemperature = tt;
    res.sendStatus(200);
  });

})
.get('/targetHeatingCoolingState/:state', function (req, res, next) { //Set target state
  var thcs = parseInt(req.params.state);
  var id = 1;
  var command = 0;

  wirelessThermostat.send(id, command, thcs, function(value) {
    console.log("Success, responded: ", value);
    data.targetHeatingCoolingState = thcs;
    res.sendStatus(200);
  });
});


var server = app.listen(4321, function () {
  var host = server.address().address;
  var port = server.address().port;
  console.log('Global : app listening at', host, port);
});
