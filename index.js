/*
{
    "bridge": {
    	...
    },

    "description": "...",

    "accessories": [
        {
            "accessory": "Intesisbox",
            "name": "Living Room AC",

            "server": "192.168.245.213",
            "port": "3310",
            "pin":  "",
            "channel": 1
        }
    ],

    "platforms":[]
}

  this.addCharacteristic(Characteristic.CurrentHeatingCoolingState);
  this.addCharacteristic(Characteristic.TargetHeatingCoolingState);
  this.addCharacteristic(Characteristic.CurrentTemperature);
  this.addCharacteristic(Characteristic.TargetTemperature);
  this.addCharacteristic(Characteristic.TemperatureDisplayUnits);

  // Optional Characteristics
  this.addOptionalCharacteristic(Characteristic.CurrentRelativeHumidity);
  this.addOptionalCharacteristic(Characteristic.TargetRelativeHumidity);
  this.addOptionalCharacteristic(Characteristic.CoolingThresholdTemperature);
  this.addOptionalCharacteristic(Characteristic.HeatingThresholdTemperature);
  this.addOptionalCharacteristic(Characteristic.Name);

*/



var Service, Characteristic;
var net = require('net');

module.exports = function(homebridge){
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;
  homebridge.registerAccessory("homebridge-intesisbox", "Intesisbox", Intesisbox);
};


function Intesisbox(log, config) {
	this.log = log;
	this.name = config.name;
	this.server = config.server;
	this.port = config.port;
	this.log("Intesisbox on", this.server, "port", this.port);
	this.pin = config.pin || null;
	this.channel = config.channel || 1;

        this.client = new net.Socket();

	//Characteristic.TemperatureDisplayUnits.CELSIUS = 0;
	//Characteristic.TemperatureDisplayUnits.FAHRENHEIT = 1;
	this.temperatureDisplayUnits = Characteristic.TemperatureDisplayUnits.CELSIUS;

	this.identity = this.command("ID");

	this.currentTemperature = this.command("GET,"+this.channel+":AMBTEMP");

	this.log(this.currentTemperature);

	// The value property of CurrentHeatingCoolingState must be one of the following:
	//Characteristic.CurrentHeatingCoolingState.OFF = 0;
	//Characteristic.CurrentHeatingCoolingState.HEAT = 1;
	//Characteristic.CurrentHeatingCoolingState.COOL = 2;
//	this.heatingCoolingState = Characteristic.CurrentHeatingCoolingState.AUTO;
//	this.targetTemperature = 21;
//	this.targetRelativeHumidity = 0.5;
//	this.heatingThresholdTemperature = 25;
//	this.coolingThresholdTemperature = 5;
	// The value property of TargetHeatingCoolingState must be one of the following:
	//Characteristic.TargetHeatingCoolingState.OFF = 0;
	//Characteristic.TargetHeatingCoolingState.HEAT = 1;
	//Characteristic.TargetHeatingCoolingState.COOL = 2;
	//Characteristic.TargetHeatingCoolingState.AUTO = 3;
//	this.targetHeatingCoolingState = Characteristic.TargetHeatingCoolingState.AUTO;

	this.service = new Service.Thermostat(this.name);

}

/*
GET,1:*
CHN,1:ONOFF,OFF
CHN,1:MODE,COOL
CHN,1:FANSP,1
CHN,1:VANEUD,SWING
CHN,1:VANELR,AUTO
CHN,1:SETPTEMP,240
CHN,1:AMBTEMP,230
CHN,1:ERRSTATUS,OK
CHN,1:ERRCODE,0
*/

Intesisbox.prototype = {
	command: function(what,cmd,value) {
        	if (this.client.address()[0]==null) {
			this.log("Connecting to "+this.server+":"+this.port);
			this.client.connect(this.port, this.server);
			};

		if (what=="ID")
			this.client.write(what + '\r')
		else if (what=="GET")
			this.client.write(what+","+this.channel+":"+cmd+"\r") // GET
		else
			this.client.write(what+","+this.channel+":"+cmd+","+value+"\r"); // SET

	       	this.client.on('error', function(error) {
               		console.log(error);
       		});

       		this.client.on('data', function(data) {
               		console.log('Received: ' + data);

			if(cmd = "ID")
				return data
			else {
				response = data.toString().split(",");
				return response[2];
			};
       		});

       		this.client.on('close', function() {
               		console.log('Connection closed');
       		});
	},
	//Start
	identify: function(callback) {
		callback(this.command("ID"));
	},
	// Required
	getCurrentHeatingCoolingState: function(callback) {
		if (this.command("GET","ONOFF")=="OFF") 
			callback(0)
		else {
			state = this.command("GET","MODE");
			if (state == "HEAT")
				callback(1)
			else if (state == "COOL")
				callback(2)
			else if (state == "AUTO")
				callback(3);
		};
	},
	getTargetHeatingCoolingState: function(callback) {
                if (this.command("GET","ONOFF")=="OFF")
                        callback(0)
                else {
                        state = this.command("GET","MODE");
                        if (state == "HEAT")
                                callback(1)
                        else if (state == "COOL")
                                callback(2)
                        else if (state == "AUTO")
                                callback(3);
                };
	},
	setTargetHeatingCoolingState: function(value, callback) {
		if(value === undefined) {
			callback(); //Some stuff call this without value doing shit with the rest
		} else {
			if (value = 0)
				this.command("SET","ONOFF",0)
			else if (value = 1) {
				this.command("SET","ONOFF",1);
				this.command("SET","MODE","HEAT");
			} else if (value = 2) {
				this.command("SET","ONOFF",1);
				this.command("SET","MODE","COOL");
			} else if (value = 3) {
				this.command("SET","ONOFF",1);
				this.command("SET","MODE","AUTO");
			};
			callback(null);
		}
	},
	getCurrentTemperature: function(callback) {
		callback(this.command("GET","AMBTEMP")/10.0);
	},
	getTargetTemperature: function(callback) {
		callback(this.command("GET","SETPTEMP")/10.0);
	},
	setTargetTemperature: function(value, callback) {
		callback(this.command("SET","SETPTEMP",value*10));
	},
	getTemperatureDisplayUnits: function(callback) {
		this.log("getTemperatureDisplayUnits:", this.temperatureDisplayUnits);
		var error = null;
		callback(error, this.temperatureDisplayUnits);
	},
	setTemperatureDisplayUnits: function(value, callback) {
		this.log("setTemperatureDisplayUnits from %s to %s", this.temperatureDisplayUnits, value);
		this.temperatureDisplayUnits = value;
		var error = null;
		callback(error);
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
		this.log(this.minTemp);
		return [informationService, this.service];
	}
};
