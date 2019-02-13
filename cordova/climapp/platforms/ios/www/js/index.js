/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

var app = {
	knowledgeBase: undefined,
	pageMap: undefined,
	currentPageID: undefined,
	
	
    // Application Constructor
    initialize: function() {
        document.addEventListener('deviceready', this.onDeviceReady.bind(this), false);
		//this.onDeviceReady(); //call this to run on browser, as browser does not fire the event by itself.
    },

    // deviceready Event Handler
    //
    // Bind any cordova events here. Common events are:
    // 'pause', 'resume', etc.
    onDeviceReady: function() {
        this.receivedEvent('deviceready');
    },

    // Update DOM on a Received Event
    receivedEvent: function(id) {
		this.initListeners();
		this.loadSettings();
		this.loadUI( "dashboard" );
		
		this.updateLocation();
		
		//
		
    },
	initListeners: function(){
		// navigation menu
		$("#js-navbar-toggle").on('click', function () {
		  	$("#js-menu").toggle('active');
		});
	},
	loadSettings: function(){
		this.pageMap = { "dashboard": "page-hello-world.html",
						 "settings": "page-hello-world.html" };
		
		//if ( localStorage.getItem("knowledgebase") !== null) {
		//	this.knowledgeBase = JSON.parse( localStorage.getItem("knowledgebase") );
		//}
		//else{
			this.knowledgeBase = { "position": { "lat": 0, 
												 "lng": 0, 
												 "timestamp": "" },
								   "weather": {	"station": "",
												"lat": 0,
												"lng": 0,
											    "distance": -1,
												"utc": "",
												"wbgt": -99,
												"windchill": -99 }
											};
		//}
	},
	saveSettings: function(){
		console.log( "saving settings" );
		let jsonData = JSON.stringify( this.knowledgeBase );
		localStorage.setItem("knowledgebase", jsonData );
	},
	updateLocation: function(){
		var self = this; //copy current scope into local scope for use in anonymous function 
		let options = {timeout: 30000 };
		navigator.geolocation.getCurrentPosition( 
			function( position ){ //on success
				self.knowledgeBase.position.lat = position.coords.latitude;
				self.knowledgeBase.position.lng = position.coords.longitude;
				self.knowledgeBase.position.timestamp = new Date( position.timestamp ).toJSON();
				
				self.updateWeather();
				
				self.saveSettings();
				self.updateUI();
			}, 
			function( error ){ //on error
				console.log( error );
			},
			options
		);
	},
	updateWeather: function(){
		var self = this;
		if( 'position' in this.knowledgeBase ){
			let url = "https://www.sensationmapps.com/WBGT/api/worldweather.php";
			let data = { "action": "helios",
						 "lat": this.knowledgeBase.position.lat,
					 	 "lon": this.knowledgeBase.position.lng,
					 	 "utc": new Date().toJSON() };
			$.get( url, 
				   data, 
				   function( output ){//on success
					   let weather = JSON.parse( output );
					   self.knowledgeBase.weather.station = weather.station;
					   self.knowledgeBase.weather.distance = weather.distance;
					   self.knowledgeBase.weather.utc = weather.utc;
					   
					   self.knowledgeBase.weather.lat = weather.lat;
					   self.knowledgeBase.weather.lng = weather.lon;
					   self.knowledgeBase.weather.wbgt = weather.wbgt_max;
					   self.knowledgeBase.weather.windchill = weather.windchill;
					   
	   				   self.saveSettings();
	   				   self.updateUI();
			});
		}
	},
	loadUI: function( pageid ){
		var self = this;
		$.get( this.pageMap[ pageid ], function( content ){
			console.log( "loaded: " + pageid);
			self.currentPageID = pageid;
			$("#content").html( content );
			self.updateUI();
			//$("#tipOfTheDay").html( "Tip of the Day");
		})
	},
	updateUI: function(){
		if( this.currentPageID == "dashboard" ){
			console.log("current page 'dashboard'");
			if( 'weather' in this.knowledgeBase && this.knowledgeBase.weather.station !== "" ){
				let distance = parseFloat( this.knowledgeBase.weather.distance ).toFixed(0);
				
				$("#station").html( this.knowledgeBase.weather.station + " ("+ distance +" km)" );
				$("#utc").html( this.knowledgeBase.weather.utc );
				
				$("#wbgt").html( this.knowledgeBase.weather.wbgt );
				$("#windchill").html( this.knowledgeBase.weather.windchill );
				
			}
		}
	}
	
};

app.initialize();