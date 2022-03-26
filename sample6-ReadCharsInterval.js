//the code assumes that the setup for the peripheral of interest is as follows
//***localName=Sergeant
//***LED service : uuid=a000, with read and write char uuid=a001
//***accel service : uuid=a012, with read chars uuid=a013, a014, a015
//***button A service : uuid=1eee, read and notify char uuid=2019

//var noble = require('noble-mac'); //load the BLE noble module c.f. https://github.com/noble/noble 
var noble = require('@abandonware/noble');

var peripheralOfInterest = "TyBle"; //change the value to match uuid of peripheral of interest e.g. Sergeant
var peripheralOfInterestUUID = 'fb2ec3e2ac3b';
var serviceOfInterestUuids = ['a012']; //change this value to match the service of interest
// allow duplicate peripherals to be returned (default false) on discovery event
var allowDuplicates = false; 
var intervalBetweenReads = 5000; //5 secs delay between read requests

noble.on('stateChange', stateChangeEventHandler); //when a stateChange event occurs call the event handler callback function, discoverDeviceEventHandler

function stateChangeEventHandler(state) { //event handler callback function
  if (state === 'poweredOn') {
    console.log("starting scanning for devices with service uuid : " + serviceOfInterestUuids);  
    //noble.startScanning();
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
	}; //end if 
}

function connectCallback(error) { //this will be executed when the connect request returns
	if (error) {
		console.log("error connecting to peripheral");
	} else {		
		console.log('connected to peripheral device: ' + peripheralGlobal.uuid  + "   " + peripheralGlobal.advertisement.localName);
		peripheralGlobal.discoverServices([], discoverServicesCallback); //call the discoverServices function and when it returns the callback function discoverServicesCallback will be executed
	}
}

function discoverServicesCallback(error, services) { //this will be executed when the discoverServices request returns
	if (error) {
		console.log("error discovering services");
	} else {
		console.log("device advertises the following services");			
		for (var i in services) {
			console.log('  ' + i + ' uuid: ' + services[i].uuid);
		}
		for (var i in services) {
			if (serviceOfInterestUuids.includes(services[i].uuid)) {
				services[i].discoverCharacteristics(null, discoverCharsCallback);  //call the discoverCharacteristics function and when it returns the callback function discoverCharsCallback will be executed
			}
		}        
	}
}

function discoverCharsCallback(error, characteristics) { //this will be executed when the discoverCharacteristics request returns
	if (error) {
		console.log("error discovering characteristics");
	} else {
		console.log('service ' + serviceOfInterestUuids + ' has the following characteristics:  ');
		for (var i in characteristics) {
			console.log('  ' + i + ' uuid: ' + characteristics[i].uuid); 
			setInterval(readChars, intervalBetweenReads, characteristics[i], i) //read the characteristics values every "intervalBetweenReads" milliseconds
        }
	} //end for loop
}

function readChars(charToRead, i) {
	console.log("i is " + i);
	charToRead.read(readDataCallback);
}

function readDataCallback(error, data) { //this will be executed when the read request returns
	if (error) {
		console.log("error reading data");
	} else {	
		var time = new Date();
		console.log("characteristic value at " +time.getHours() + ":" + time.getMinutes() + ":" + time.getSeconds()  + " is : " + data.toString('hex'));
	}
}



