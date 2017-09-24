"use strict";

/*

HAP Doc can be found here : https://github.com/KhaosT/HAP-NodeJS/blob/master/lib/gen/HomeKitTypes.js

*/

var Service, Characteristic;

var os = require('os');
var sensor = require('./temperaturehumidity.js');

var IS_RASPBERRY = os.arch() == "arm";
var DEBUG = true;

module.exports = function(homebridge){
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;
  homebridge.registerAccessory("homebridge-simple-thermostat", "Simple Thermostat", SimpleThermostat);
};

function SimpleThermostat(log, config) {
	this.service = new Service.Thermostat(this.name);
	this.log = log;
	this.maxTemp = config.maxTemp || 40;
	this.minTemp = config.minTemp || -20;
	this.SENSOR_GPIO = config.SENSOR_GPIO || 21;
	this.SENSOR_TYPE = config.SENSOR_TYPE || 22;
	this.name = config.name;
	this.sensor = new sensor(this.SENSOR_GPIO, this.SENSOR_TYPE, IS_RASPBERRY, DEBUG);
	//this.sensorUpdater;
	//this.sensorData;
	//this.targetHeatingCoolingStateAutoUpdater;

	if (this.sensor.init()) {
	    this.log("Sensor initialized.");

	    this.updateSensorData = function () {
	      this.sensorData = this.sensor.read();
	      this.log(this.sensorData);
		  this.service.getCharacteristic(Characteristic.CurrentTemperature).updateValue(this.sensorData.temperature, null);
		  this.service.getCharacteristic(Characteristic.CurrentRelativeHumidity).updateValue(this.sensorData.humidity, null);

		  //this.service.setCharacteristic(Characteristic.CurrentRelativeHumidity, this.sensorData.humidity);
	    };
	    this.updateSensorData();

	    this.sensorUpdater = setInterval(function(){this.updateSensorData();}.bind(this), 10*1000);
	} else {
	    this.log('Failed to initialize sensor');
	}
	
	//Characteristic.TemperatureDisplayUnits.CELSIUS = 0;
	//Characteristic.TemperatureDisplayUnits.FAHRENHEIT = 1;
	this.temperatureDisplayUnits = Characteristic.TemperatureDisplayUnits.CELSIUS;

	// The value property of CurrentHeatingCoolingState must be one of the following:
	//Characteristic.CurrentHeatingCoolingState.OFF = 0;
	//Characteristic.CurrentHeatingCoolingState.HEAT = 1;
	//Characteristic.CurrentHeatingCoolingState.COOL = 2;
	this.service.getCharacteristic(Characteristic.TargetTemperature).updateValue(21, null); //TODO Params for default target temps
	//TODO update old values with HAP
	this.targetRelativeHumidity = 0.5;
	this.heatingThresholdTemperature = 25;
	this.coolingThresholdTemperature = 5;
	// The value property of TargetHeatingCoolingState must be one of the following:
	//Characteristic.TargetHeatingCoolingState.OFF = 0;
	//Characteristic.TargetHeatingCoolingState.HEAT = 1;
	//Characteristic.TargetHeatingCoolingState.COOL = 2;
	//Characteristic.TargetHeatingCoolingState.AUTO = 3;
	//this.targetHeatingCoolingState = Characteristic.TargetHeatingCoolingState.AUTO;
	//this.currentHeatingCoolingState = this.service.getCharacteristic(Characteristic.TargetHeatingCoolingState).value;
	this.currentTemperature = this.service.getCharacteristic(Characteristic.CurrentTemperature).value;
}

SimpleThermostat.prototype = {
	//Start
	identify: function(callback) {
		this.log("Identify requested!");
		if (callback !== undefined) callback(null);
	},
	// Required
	getCurrentHeatingCoolingState: function(callback) {
		this.log("getCurrentHeatingCoolingState:", this.service.getCharacteristic(Characteristic.TargetHeatingCoolingState).value);
		var error = null;
		if (error && callback) callback(error);
		if (callback) callback(null, this.service.getCharacteristic(Characteristic.TargetHeatingCoolingState).value);
	},
	getTargetHeatingCoolingState: function(callback) {
		this.log("getTargetHeatingCoolingState:", this.targetHeatingCoolingState);
		var error = null;
		if (error && callback) callback(error);
		if (callback) callback(null, this.targetHeatingCoolingState);	
	},
	setTargetHeatingCoolingState: function(value, callback) {
		this.log("setTargetHeatingCoolingState:", value);

		if(value == Characteristic.TargetHeatingCoolingState.AUTO) {
			if(this.targetHeatingCoolingStateAutoUpdater === undefined) {
				var r = function() {
					var tolerence = 5;
					if (this.service.getCharacteristic(Characteristic.CurrentTemperature).value <= this.service.getCharacteristic(Characteristic.TargetTemperature).value + tolerence && this.service.getCharacteristic(Characteristic.CurrentTemperature).value >= this.service.getCharacteristic(Characteristic.TargetTemperature).value - tolerence) {
						this.log("CurrentTemperature", this.service.getCharacteristic(Characteristic.CurrentTemperature).value, "= TargetTemperature (±tolerence)", this.service.getCharacteristic(Characteristic.TargetTemperature).value, "("+tolerence+")");
					}
					else if (this.service.getCharacteristic(Characteristic.CurrentTemperature).value > this.service.getCharacteristic(Characteristic.TargetTemperature).value + tolerence) {
						this.log("CurrentTemperature", this.service.getCharacteristic(Characteristic.CurrentTemperature).value, "> TargetTemperature (+tolerence)", this.service.getCharacteristic(Characteristic.TargetTemperature).value, "("+tolerence+")");
						this.log("Turn OFF heating.");
						//TODO : OFF heating system
						//TODO : > What about starting the AC ? Need another step or a Max temperature before AC...
					} 
					else if (this.service.getCharacteristic(Characteristic.CurrentTemperature).value < this.service.getCharacteristic(Characteristic.TargetTemperature).value - tolerence) {
						this.log("CurrentTemperature", this.service.getCharacteristic(Characteristic.CurrentTemperature).value, "< TargetTemperature (-tolerence)", this.service.getCharacteristic(Characteristic.TargetTemperature).value, "("+tolerence+")");
						this.log("Turn ON heating.");
						//TODO : ON heating system
						//TODO : OFF Cooling
					} 
					this.log(this.service.getCharacteristic(Characteristic.CurrentTemperature).value, this.service.getCharacteristic(Characteristic.TargetTemperature).value);
				};
				this.targetHeatingCoolingStateAutoUpdater = setInterval(r.bind(this), 1*1000);
			}
		} else clearInterval(this.targetHeatingCoolingStateAutoUpdater);

		if(value == Characteristic.TargetHeatingCoolingState.OFF) {
			this.log("TargetHeatingCoolingState.OFF");
			//TODO : OFF heating system
			//TODO : OFF Cooling system
		}

		if(value == Characteristic.TargetHeatingCoolingState.HEAT) {
			this.log("TargetHeatingCoolingState.HEAT");
			//TODO : ON Heating System
			//TODO : OFF Cooling system
		}

		if(value == Characteristic.TargetHeatingCoolingState.COOL) {
			this.log("TargetHeatingCoolingState.COOL > Not impelemented, do OFF on heating system");
			//TODO : OFF heating system
			//TODO : ON Cooling system
		}

		var error = null;
		if (error && callback) callback(error);
		if (callback) callback(null);
	},
	getCurrentTemperature: function(callback) {
		this.log("getCurrentTemperature:", this.service.getCharacteristic(Characteristic.CurrentTemperature).value);
		var error = null;
		if (error && callback) callback(error);
		if (callback) callback(null, this.service.getCharacteristic(Characteristic.CurrentTemperature).value);
	},
	setCurrentHeatingCoolingState: function(value, callback) {
		this.log("setCurrentHeatingCoolingState:", value);
		//SET ?
		var error = null;
		if (error && callback) callback(error);
		if (callback) callback(null);
	},
	getTargetTemperature: function(callback) {
		this.log("getTargetTemperature:", this.targetTemperature);
		var error = null;
		if (error && callback) callback(error);
		if (callback) callback(null, this.targetTemperature);
	},
	setTargetTemperature: function(value, callback) {
		this.log("setTargetTemperature:", value);
		//SET ?
		var error = null;
		if (error && callback) callback(error);
		if (callback) callback(null);
	},
	getTemperatureDisplayUnits: function(callback) {
		this.log("getTemperatureDisplayUnits:", this.temperatureDisplayUnits);
		var error = null;
		if (error && callback) callback(error);
		if (callback) callback(null, this.temperatureDisplayUnits);
	},
	setTemperatureDisplayUnits: function(value, callback) {
		this.log("setTemperatureDisplayUnits:", value);
		//SET ?
		var error = null;
		if (error && callback) callback(error);
		if (callback) callback(null);
	},

	// Optional
	getCurrentRelativeHumidity: function(callback) {
		this.log("getCurrentRelativeHumidity:", this.currentRelativeHumidity);
		var error = null;
		if (error && callback) callback(error);
		if (callback) callback(null, this.currentRelativeHumidity);
	},
	getTargetRelativeHumidity: function(callback) {
		this.log("getTargetRelativeHumidity:", this.targetRelativeHumidity);
		var error = null;
		if (error && callback) callback(error);
		if (callback) callback(null, this.targetRelativeHumidity);
	},
	setTargetRelativeHumidity: function(value, callback) {
		this.log("setTargetRelativeHumidity:", value);
		//SET ? this.targetRelativeHumidity
		var error = null;
		if (error && callback) callback(error);
		if (callback) callback(null);

	},
/*	getCoolingThresholdTemperature: function(callback) {
		this.log("getCoolingThresholdTemperature: ", this.coolingThresholdTemperature);
		var error = null;
		callback(error, this.coolingThresholdTemperature);
	},
*/	getHeatingThresholdTemperature: function(callback) {
		this.log("implement getHeatingThresholdTemperature for WirelessThermostat");
		this.log("getHeatingThresholdTemperature :" , this.heatingThresholdTemperature);
		var error = null;
		callback(error, this.heatingThresholdTemperature);
	},
	getName: function(callback) {
		this.log("getName :", this.name);
		var error = null;
		callback(error, this.name);
	},

	getServices: function() {

		// you can OPTIONALLY create an information service if you wish to override
		// the default values for things like serial number, model, etc.
		var informationService = new Service.AccessoryInformation();

		informationService
			.setCharacteristic(Characteristic.Manufacturer, "HTTP Manufacturer")
			.setCharacteristic(Characteristic.Model, "HTTP Model")
			.setCharacteristic(Characteristic.SerialNumber, "HTTP Serial Number");

		

		// Required Characteristics
		this.service
			.getCharacteristic(Characteristic.CurrentHeatingCoolingState)
			.on('get', this.getCurrentHeatingCoolingState.bind(this));

		this.service
			.getCharacteristic(Characteristic.TargetHeatingCoolingState)
			.on('get', this.getTargetHeatingCoolingState.bind(this))
			.on('set', this.setTargetHeatingCoolingState.bind(this));

		this.service
			.getCharacteristic(Characteristic.CurrentTemperature)
			.on('get', this.getCurrentTemperature.bind(this));

		this.service
			.getCharacteristic(Characteristic.TargetTemperature)
			.on('get', this.getTargetTemperature.bind(this))
			.on('set', this.setTargetTemperature.bind(this));

		this.service
			.getCharacteristic(Characteristic.TemperatureDisplayUnits)
			.on('get', this.getTemperatureDisplayUnits.bind(this))
			.on('set', this.setTemperatureDisplayUnits.bind(this));

		// Optional Characteristics
		this.service
			.getCharacteristic(Characteristic.CurrentRelativeHumidity)
			.on('get', this.getCurrentRelativeHumidity.bind(this));

		this.service
			.getCharacteristic(Characteristic.TargetRelativeHumidity)
			.on('get', this.getTargetRelativeHumidity.bind(this))
			.on('set', this.setTargetRelativeHumidity.bind(this));
		/*
		this.service
			.getCharacteristic(Characteristic.CoolingThresholdTemperature)
			.on('get', this.getCoolingThresholdTemperature.bind(this));
		*/

		this.service
			.getCharacteristic(Characteristic.HeatingThresholdTemperature)
			.on('get', this.getHeatingThresholdTemperature.bind(this));

		this.service
			.getCharacteristic(Characteristic.Name)
			.on('get', this.getName.bind(this));

		this.service.getCharacteristic(Characteristic.CurrentTemperature)
			.setProps({
				minValue: this.minTemp,
				maxValue: this.maxTemp,
				minStep: 1
			});

		this.service.getCharacteristic(Characteristic.TargetTemperature)
			.setProps({
				minValue: this.minTemp,
				maxValue: this.maxTemp,
				minStep: 1
			});

		return [informationService, this.service];
	}
};
