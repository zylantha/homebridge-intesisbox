
var express = require('express');
var app = express();
var rpi433    = require('rpi-433');

var TX_GPIO = 4;

var rfEmitter = rpi433.emitter({
      pin: TX_GPIO || 4
});

var data = {
    targetHeatingCoolingState: 0,
    targetTemperature: 20,
    currentHeatingCoolingState: 0,
    currentTemperature: 19,
    currentRelativeHumidity: 30
};

function send(value) {
    var code;

    if (value == 0) { 
      code = 2; //odd value not 0
    } else if (data.currentHeatingCoolingState == 1) {
      code = 1; //even value
    }

    if (code !== undefined) {
      rfEmitter.sendCode(code, function(error, stdout) {
          if(error) console.log("An error occured while sending", data.currentHeatingCoolingState, "\n Are you sudo?");
          console.log("Sent: " + stdout);
      });
    }
};

function loop() {
    send(data.currentHeatingCoolingState);
};

loop();
var interval = setInterval(loop, 30*1000);

//ROUTING
app.get('/', function (req, res) {
  res.sendStatus(200);
})
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
})
//to manage old pluggin
.get('/off', function (req, res, next) { 
  console.log("Off");
  data.currentHeatingCoolingState = 0;
  data.targetHeatingCoolingState = 0;
  send(0);
  res.sendStatus(200);
})
.get('/comfort', function (req, res, next) { 
  console.log("Confort");
  data.currentHeatingCoolingState = 1;
  data.targetHeatingCoolingState = 1;
  send(1);
  res.sendStatus(200);
})
.get('*', function (req, res, next) { 
  console.log("Other request", req.params);
  res.sendStatus(200);
});

var server = app.listen(4321, function () {

  var host = server.address().address;
  var port = server.address().port;

  console.log('Global : app listening at', host, port);

});