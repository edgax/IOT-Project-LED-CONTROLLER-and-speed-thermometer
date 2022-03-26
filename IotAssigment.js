//the code assumes that the setup for the peripheral of interest is as follows
//***localName=Sergeant
//***LED service : uuid=a000, with read and write char uuid=a001
//***accel service : uuid=a012, with read chars uuid=a013, a014, a015
//***button A service : uuid=1eee, read and notify char uuid=2019

//var noble = require('noble-mac');
var noble = require('@abandonware/noble');  //load the BLE noble module c.f. https://github.com/noble/noble

var peripheralOfInterest = 'TyBle';//change the value to match uuid of peripheral of interest e.g. IEEELimerick
var serviceOfInterestUuids = ['a000']; //change this value to match the service of interest
var serviceOfInterestUuids1 = ['1eee']; //change this value to match the service of interest
var serviceOfInterestUuids2 = ['a012']; //change this value to match the service of interest
var peripheralOfInterestUUID = 'fb2ec3e2ac3b'; // interest that is connect to the BLTE on the microbit
var mqtt = require('mqtt'); // using Mqtt npm
var mqttClient = mqtt.connect('mqtt://broker.mqttdashboard.com');
var topicToPublishTo="iot/tyaccel";
var topicToSubscribeTo="iot/tyLed";
//var characteristicOfInterest = ['2019'];
var notifChars = ['2019'];	// Array of UUID's
var charDescForNotify = "button press";
var intervalBetweenReads = 3000;
var state = 0;


// allow duplicate peripheral to be returned (default false) on discovery event
var allowDuplicates = false; 
var characteristicOfInterest = 0;//characteristic that will be written to by this code

//global variable - shared between functions
var peripheralGlobal;
var actuatorData;

noble.on('stateChange', stateChangeEventHandler); //when a stateChange event occurs call the event handler callback function, discoverDeviceEventHandler

function stateChangeEventHandler(state) { //event handler callback function
  if (state === 'poweredOn') {
    console.log("starting scanning for devices with service uuid : ," + serviceOfInterestUuids  + " ," + serviceOfInterestUuids1+ " ," + serviceOfInterestUuids2);  
    //noble.startScanning(); // scanning all the device within the BTLE 
	noble.startScanning(serviceOfInterestUuids, allowDuplicates); //scan for devices containing the service of interest
  } else {
    console.log("stopping scanning");  
    noble.stopScanning();
	process.exit(0);
  }
}

noble.on('discover', discoverDeviceEventHandler); //when a discover event occurs call the event handler callback function, discoverDeviceEventHandler
console.log("up and running");

function discoverDeviceEventHandler(peripheral) { //event handler callback function 
	/* This commented code with some versions of BLE but not all!!!
	var localName = peripheral.advertisement.localName;
	if (localName == null) {//the code assumes that the local name of the peripheral has been set
		return;
	}
	if (localName == peripheralOfInterest) {
	if (localName.indexOf(peripheralOfInterest) > -1){ 
	*/
	if (peripheral.uuid==peripheralOfInterestUUID) {
		console.log('Found device with local name: ' + peripheral.advertisement.localName);
		console.log("peripheral uuid : " + peripheral.uuid);
        peripheralGlobal = peripheral;  //set the peripheralGlobal variable equal to the callback peripheral parameter value
		peripheral.connect(connectCallback); //call the connect function and when it returns the callback function connectCallback will be executed
		//mqttClient.subscribe(topicToSubscribeTo);
		mqttClient.subscribe(topicToSubscribeTo, subscribeCallback); 
		console.log("subscribed to messages on topic '" + topicToSubscribeTo + "'");	
		console.log("Connected to MQTT");
	}; //end if 
}

function connectCallback(error) { //this will be executed when the connect request returns
	if (error) {
		console.log("error connecting to peripheral");
	} else {		
		console.log('connected to peripheral: ' + peripheralGlobal.uuid  + "   " + peripheralGlobal.advertisement.localName);
		peripheralGlobal.discoverServices([], discoverServicesCallback); //call the discoverServices function and when it returns the callback function discoverServicesCallback will be executed
		
	}
	
}

function discoverServicesCallback(error, services) { //this will be executed when the discoverServices request returns
	if (error) {
		console.log("error discovering services");
	} else {
		console.log("The device contains the following services");			
		for (var i in services) {
			console.log('  ' + i + ' uuid: ' + services[i].uuid);	// this display the services  like the a000,1eee,a012
		}
		
		
		for (var i in services) {
			if (serviceOfInterestUuids.includes(services[i].uuid)) {
				console.log("Discovering characteristics of service " + services[i].uuid )
				services[i].discoverCharacteristics(null, discoverCharsCallbackWriteLed);
			}
		
			if (serviceOfInterestUuids1.includes(services[i].uuid)) {
				console.log("Discovering characteristics of service " + services[i].uuid )
				services[i].discoverCharacteristics(null, discoverCharsCallbackButton);
			}
		
			if (serviceOfInterestUuids2.includes(services[i].uuid)) {
				console.log("Discovering characteristics of service " + services[i].uuid )
				services[i].discoverCharacteristics(null, discoverCharsCallAccel);
			}

		}
		
        //pick one service to interrogate
		//var deviceInformationService = services[serviceOfInterest];
		//deviceInformationService.discoverCharacteristics(null, discoverCharsCallback); //call the discoverCharacteristics function and when it returns the callback function discoverCharsCallback will be executed
	}
}

function discoverCharsCallbackWriteLed(error, characteristics) { //this will be executed when the discoverCharacteristics request returns
	if (error) {
		console.log("error discovering characteristics");
	} else {
		console.log('discovered the following characteristics associated with the service:');
		for (var i in characteristics) {
			console.log('  ' + i + ' uuid: ' + characteristics[i].uuid);
        }
        //pick one characteristic to write to
        
        actuatorData = characteristics[characteristicOfInterest];
        
        //characteristics[characteristicOfInterest].read(readAndWriteDataCallback);
		setInterval(ledwrite , 3000, characteristics[characteristicOfInterest]); //read the characteristics values every 5000 milliseconds
	} //end for loop
}

function ledwrite(charToRead) {
	charToRead.read(readAndWriteDataCallback);
}

function readAndWriteDataCallback(error, data) { //this will be executed when the read request returns
	if (error) {
		console.log("error reading data");
	} else {
			
        if (state == 1) { //if the state is equal to 1 turn on the LED 
            actuatorData.write(new Buffer([1]), false, writeDataCallback);
	        console.log("Turned actuator on");
	        mqttClient.publish(topicToPublishTo,"LED is ON");	
            //call the write function and when it returns the callback function writeDataCallback will be executed
        } else if(state == 0) { //if the state is equal to zero turn off the LED
            actuatorData.write(new Buffer([0]), false, writeDataCallback);
            mqttClient.publish(topicToPublishTo,"LED is OFF");	
			console.log("Turned actuator off");
        } else if (state == 2)
        {
			mqttClient.publish(topicToPublishTo, "Enter Blinking Mode");
			actuatorData.write(new Buffer([1]), false, writeDataCallback);	
			actuatorData.write(new Buffer([0]), false, writeDataCallback);
		}
		//peripheralGlobal.disconnect(disconnectCallback);
	}
}
function writeDataCallback(error, data) { //this will be executed when the write request returns
	if (error) {
		console.log("error writing data");
	} else {	
		//peripheralGlobal.disconnect(disconnectCallback);
	}
}
 //----------------------------------------------------------------- Button Fuction below-----------------------------------------------------//
 
 function discoverCharsCallbackButton(error, characteristics) { //this will be executed when the discoverCharacteristics request returns
	if (error) {
		console.log("error discovering characteristics");
	} else {
		for (var i in characteristics) {
			console.log('  characteristic uuid: ' + characteristics[i].uuid); // this print out the service of 1eee
			var UUID = characteristics[i].uuid;	// Create a local varibale to store the UUID 
			if(notifChars.includes(UUID)){	// If the UUID is in the array of notification characteristics:
				console.log('Setting notify for ' + charDescForNotify + " characteristic with uuid : "+ UUID);
				characteristics[i].subscribe(bleSubscribeCallback);	// Enable Notifications & Indications on that characteristic.
				characteristics[i].on('data', dataCallback);	// Register a callback for the data event
			} else{
				console.log('Reading uuid: ' + UUID);	
				characteristics[i].read(readDataCallback);	// Read the characteristic
			}
		}

        //actuatorData.write(new Buffer([1]), false, writeDataCallback); //call the write function and when it returns the callback function writeDataCallback will be executed
	} //end if loop
}

/* Callback for characteristics[i].subscribe */
function bleSubscribeCallback(error){
	if(error){
		console.log('Error Subscribing');
	} else{	
		console.log('Notifications Enabled');
	}
}

/* Callback for BLE data event */
function dataCallback(data, isNotification){

	var UUID = this.uuid;	// Get the UUID of the notifying characteristic. 

	console.log('------------------------------------------');
	console.log('BLE Notification for characteristic with uuid: ' +UUID); // display the notification 
	console.log('characteristic data value is ' + data.toString('hex')); // display the value of the button to be 1 or zero
	mqttClient.publish(topicToPublishTo, " Button Pressed " + UUID +": " + data.toString('hex'));
	console.log('------------------------------------------');
}

function readDataCallback(error, data) { //this will be executed when the read request returns
	if (error) {
		console.log("error reading data");
	} else {	
		console.log("characteristic value is : " + data.toString('hex'));
		//peripheralGlobal.disconnect(disconnectCallback);
	}
}
//----- Aceleremoter------

function discoverCharsCallAccel(error, characteristics) { //this will be executed when the discoverCharacteristics request returns
	if (error) {
		console.log("error discovering characteristics");
	} else {
		console.log('service ' + serviceOfInterestUuids + ' has the following characteristics:  ');
		for (var i in characteristics) {
			console.log('  ' + i + ' uuid: ' + characteristics[i].uuid); 
			setInterval(readChars, intervalBetweenReads, characteristics[i]) //read the characteristics values every "intervalBetweenReads" milliseconds
			
        }
	} //end for loop
}

function readChars(charToRead) {
	charToRead.read(readDataCallback1);
}

function readDataCallback1(error, data) { //this will be executed when the read request returns
	if (error) {
		console.log("error reading data");
	} else {	
		console.log("BLE sensor reading is : " + data.toString('hex'));
		mqttClient.publish(topicToPublishTo, " from device " + peripheralOfInterest +": " + data.toString('hex'));//publishes sensor value to the MQTT topic
		var num = parseInt(data.toString('hex'), 16); // convert the hex value into integer 
		console.log("Display Accel integer " + num); // display the int to see the value
		console.log("Message is published to topic " + topicToPublishTo + " from device " + peripheralOfInterest); //publish the message and the value to the MQTT broker
		
		if (num < '2000' && num > '10')// this if statemt is when the accel moving very fast to show that it dropping if the range from around 200 to 2000 that when the device dected it itself dropped 
		{
			mqttClient.publish(topicToPublishTo, "The device has dropped"); // publish to MQTT to Alert that the device has been dropped
			console.log("Device has been Dropped");
			state = 2; // change the state = 2 to turn on the Blinking mode for LED to show that the device has been dropped 
			
			peripheralGlobal.discoverServices(['a000'], discoverServicesCallback);
		}
	}
}
//----Aceleromoter-------END------

//----MQTT-----
function subscribeCallback() {
mqttClient.on('message', messageEventHandler); //when a 'message' event is received call the messageEventHandler listener function
 }

function messageEventHandler(topic, message) { 
   console.log("Received message'" + message + "' on topic '" + topic + "'");  // This line of console Recived the message from the MQTT Broker
   

   if (message == "on"){ // if the message is on it will run the follow code below which to turn the led on
   state = 1; // change the state = 1 to turn on the LED
   console.log("LED IS ON");
   
   peripheralGlobal.discoverServices(['a000'], discoverServicesCallback); // call the DiscoverServicesCallback but with a parameter a000 but with a state = 1 to turn on the LED
   } else if ( message == 'off'){ // if the message is off it will turn off the LED
   
   state = 0;      // change the state to 0
   console.log("LED IS OFF");
   peripheralGlobal.discoverServices(['a000'], discoverServicesCallback); // call the discoverServicesCall back with a paramter of a000 to turn off LED
   }l
   else if (message == 'getlog')
   {
	   console.log("Log data list below ");
   }

}
//---MQTT------

function disconnectCallback(error){ //this will be executed when the disconnect request returns
	if (error) {
		console.log("error disconnecting");
	} else {
		console.log("Disconnecting and stopping scanning");
		noble.startScanning(serviceOfInterestUuids, allowDuplicates); //restart scanning for devices with the services of interest
		console.log("Re-started scanning");
	}
}









		


