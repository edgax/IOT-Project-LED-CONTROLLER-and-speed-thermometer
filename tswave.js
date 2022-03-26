var influxdb = require('influx');
//var sleep = require('sleep');
var root = new influxdb.InfluxDB('localhost', 8086, 'root', 'root');

root.createDatabase('waves', function(err) {
  if (err && err.message.indexOf("exist") == -1) {
    console.log("Cannot create db", err);
    process.exit(1);
  };

  var client = new influxdb.InfluxDB('localhost', 8086, 'root',
'root', 'waves');

  function random (low, high) { return Math.floor(Math.random() *
(high - low) + low); }
  function doInsert(i) {
    var height_in_cm = random(20, 3000);
    var period_in_sec = random(2, 60);
    var peak_force_n = random(1, 100);

    client.writePoint("series.name", {
      'peak_force': peak_force_n,
      'wave_height': height_in_cm,
      'wave_period': period_in_sec
    }, function(err) {
      if (err) {
        console.log("Cannot write data", err);
        process.exit(1);
      }
    });
  }

  var i = 0;
  while (i < 1000) {
    doInsert(i);
    i++;
  }
  
});
