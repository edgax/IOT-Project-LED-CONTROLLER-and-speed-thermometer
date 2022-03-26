//Example node.js app for inserting data into Influxdb database
//NOTE: before running this you need to create an empty waves database by going into the influx //client and typing in
// influx>create database waves;
//
//include the required npm modules
const Influx = require('influx');
const os = require('os');
const influx = new Influx.InfluxDB({

// set up the database
 host: 'localhost',
 database: 'Acceleromete',
 schema: [
   {
     measurement: 'wave_measurement',
     fields: {
       //there are two fields	
       wave_height: Influx.FieldType.FLOAT,
       wave_period: Influx.FieldType.INTEGER
     },
      //this tag would be included with the timestamp in the index, to allow individual machines to be queried.
     tags: [
     'buoy_os'
     ]
   }
 ]
})


  influx.writePoints([
    {
      measurement: 'Acceleration Measurment', 
      tags: { buoy_os: os.hostname() },
      fields: { wave_height: random(20, 3000), wave_period: random(2, 60)},
    }
  ]);


//do a select statement to get the data back.
influx.query(`
    select * from wave_measurement
    where buoy_os = ${Influx.escape.stringLit(os.hostname())}
    order by time desc
    limit 10
  `).then(rows => {
// provide summary to the user for each record.
  rows.forEach(row => console.log(`The wave period at ${row.buoy_os} was ${row.wave_period}s and wave height was ${row.wave_height}cm`))
});
  
// random number generator to add new wave data.
function random (low, high) { return Math.floor(Math.random() * (high - low) + low); }
