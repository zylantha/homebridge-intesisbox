module.exports = function TemperatureHumidity (SENSOR_GPIO, SENSOR_TYPE, raspberry, debug) {

	return {
		SENSOR_TYPE: SENSOR_TYPE || 22,
		SENSOR_GPIO: SENSOR_GPIO || 4,
    sensorLib: raspberry == true ? require('node-dht-sensor') : false,
      init: function () {
          if(raspberry == true) {
            console.log('is rapberry', this.sensorLib);
            return this.sensorLib.initialize(this.SENSOR_TYPE, SENSOR_GPIO);
          } else {
            console.log("Not initialised because not a raspberry");
            return this;
          }
      },
      read: function () {
        if (raspberry === true) {
          var readout = this.sensorLib.read();
          var text = 'Temperature: ' + readout.temperature.toFixed(2) + 'C, ' +'humidity: ' + readout.humidity.toFixed(2) + '%';
          //console.log(text);
          return {
            date: new Date(),
            temperature: readout.temperature.toFixed(2),
            humidity: readout.humidity.toFixed(2),
            text: text
          };
        } else {
          return {
            date: new Date(),
            temperature: 31,
            humidity: 99,
            text: "Fake value."
          };
        }
      }
  }
};
