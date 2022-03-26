//Using Hive broker - dashboard available at http://www.hivemq.com/demos/websocket-client/
//Uses the Paho MQTT JS client library - http://www.eclipse.org/paho/files/jsdoc/index.html to send and receive messages using a web browser
//Example code available at https://www.hivemq.com/blog/mqtt-client-library-encyclopedia-paho-js

//document.getElementById("connect").addEventListener("click", connectToBroker);

// Create a client instance
client = new Paho.MQTT.Client("broker.mqttdashboard.com", 8000, "web_" + parseInt(Math.random() * 100, 10));
var topicSubscribe = "";
var topicSubscribetoLed = "tyController";
var LedMessageOn = "on";
var LedMessageOff = "off";
var topicMessage = "";
// set callback handlers
//client.onConnected = onConnected;
client.onConnectionLost = onConnectionLost;
client.onMessageArrived = onMessageArrivedMine;
 
var connectOptions = {
    onSuccess: onConnectCallback //other options available to set
};

function connectToBroker(){
    // connect the client
    client.connect(connectOptions);
     document.getElementById("messages").innerHTML += '<span>Connected</span><br/>';
	 document.getElementById("Disconnect").removeAttribute("disabled");
	 document.getElementById("buttonSub").removeAttribute("disabled");
	 document.getElementById("buttonPub").removeAttribute("disabled");
	 document.getElementById("LedOn").removeAttribute("disabled");
	 document.getElementById("LedOff").removeAttribute("disabled");
	 document.getElementById("connect").setAttribute("disabled","disabled")
}
function disconnectToBroker(){
    // Disconnect the client
    client.disconnect(connectOptions);
    console.log("Disconnected");
    document.getElementById("messages").innerHTML += '<span>Disconnected</span><br/>';
	document.getElementById("Disconnect").setAttribute("disabled","disabled")//disable the buttons
	document.getElementById("buttonSub").setAttribute("disabled","disabled")
	document.getElementById("buttonPub").setAttribute("disabled","disabled")
	document.getElementById("LedOn").setAttribute("disabled","disabled")
	document.getElementById("LedOff").setAttribute("disabled","disabled")
	document.getElementById("connect").removeAttribute("disabled");
     
}
// called when the client connect request is successful
function onConnectCallback() {
  // Once a connection has been made, make a subscription and send a message.
	console.log("connected");
}

// called when the client loses its connection
function onConnectionLost(responseObject) {
  if (responseObject.errorCode !== 0) {
    console.log("onConnectionLost:"+responseObject.errorMessage);
  }
}

 function publishedToBroker() {
  // Once a connection has been made, make a subscription and send a message.
  if ( document.getElementById('topicSubscribe').value == ''){
		alert('Topic Subcribe is Empty');
  }
  else{
	  topicMessage = document.getElementById("topicMessage").value;
	  
	  if (topicMessage.value == '' || !topicMessage.match(/^[a-zA-Z]+$/)  ) {
	  alert('Please enter a Message to send'); 
	  }else{
		  console.log("published");
		  client.publish(topicSubscribe, topicMessage , 0, false); //publish a message to the broker
	}
  }
 }
function publishedOnLed() {
  // Once a connection has been made, make a subscription and send a message.
  client.publish(topicSubscribetoLed, LedMessageOn , 0, false); //publish a message to the broker
  document.getElementById("messages").innerHTML += '<span>Turning On LED</span><br/>';
  
}

function publishedOffLed() {
  // Once a connection has been made, make a subscription and send a message.
  client.publish(topicSubscribetoLed, LedMessageOff , 0, false); //publish a message to the broker
    document.getElementById("messages").innerHTML += '<span>Turning Off LED</span><br/>';
}



function subscribedToBroker() {
  // Once a connection has been made, make a subscription and send a message.
  
  topicSubscribe = document.getElementById("topicSubscribe").value; 
  
  if (topicSubscribe.value == '' || !topicSubscribe.match(/^[a-zA-Z]+$/)) { //checking if a topic is not empty or if the topsubcribe is only letter
  alert('Please enter a topic to Subcribe or vaild Topic Please'); 
  }else{
  client.subscribe(topicSubscribe);
  console.log("subscribed to topic: " + topicSubscribe);
  document.getElementById("messages").innerHTML += '<span>Subscribing to: ' + topicSubscribe + '</span><br/>';
  }  
}
function onMessageArrivedMine(message) {
  // Once a connection has been made, make a subscription and send a message.
  console.log("message from Broker: " + message.payloadString );
  document.getElementById("messages").innerHTML += '<span>Topic: ' + message.destinationName + '  | ' + message.payloadString + '</span><br/>';
} 

