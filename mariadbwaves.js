var mqtt = require('mqtt'); // using Mqtt npm
var mqttClient = mqtt.connect('mqtt://broker.mqttdashboard.com');	
var topicToPublishTo="iot/tyaccel";
  
const mariadb = require('mariadb/callback');
const conn = mariadb.createConnection({host:"localhost",user:"dit",password:"dit",database:"waves"});
//console.log(conn);
	
	
	
	conn.query("select * from wavedata  LIMIT 10", (err,res,meta) => {
	  if (err) throw err;
	  console.log(res);
	 // [ 
	//    { height: 5, period: 3, ts:? }, 
	//    { height: 5, period: 3, ts:? }, 
	//  
	// ]  
	 //res : { affectedRows: 1, insertId: 1, warningStatus: 0 }
	});
