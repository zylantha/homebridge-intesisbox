
var express = require('express');
var app = express();

var data = {
    targetHeatingCoolingState: 3,
    targetTemperature: 20,
    currentHeatingCoolingState: 1,
    currentTemperature: 19,
    currentRelativeHumidity: 30
};

//ROUTING
app
.get('/status', function (req, res, next) {
  console.log("Get status", data);
  res.send(data);
})
.get('/targetTemperature/:temperature', function (req, res, next) { //Set Temperature
  console.log("Get targetTemperature", req.params.temperature);
  data.currentTemperature = data.targetTemperature;
  data.targetTemperature = parseFloat(req.params.temperature);
  res.sendStatus(200);
})
.get('/targetHeatingCoolingState/:state', function (req, res, next) { //Set target state
  console.log("Get targetHeatingCoolingState", req.params.state);
  data.currentHeatingCoolingState = data.targetHeatingCoolingState == 3 ? 2 : data.targetHeatingCoolingState;
  data.targetHeatingCoolingState = parseInt(req.params.state);
  res.sendStatus(200);
});


var server = app.listen(4321, function () {
  var host = server.address().address;
  var port = server.address().port;
  console.log('Global : app listening at', host, port);
});
