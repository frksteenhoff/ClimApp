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
		
		/*
		heatindex.PHS.sim_init();
		for( var i=1;i<=480;i++){
			var res = heatindex.PHS.time_step();
			console.log(res);
		}
		console.log( heatindex.PHS.current_result() );
		*/
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
		var self = this;
		$("div[data-listener='navbar']").on("click", function(){
			let target = $( this ).attr("data-target");
			self.loadUI( target );
		});
		/*
		$("#sync-toggle").on('click', function () {
			$("#sync-toggle").toggleClass('fa-spin');
		});
		*/
	},
	initSettingsListeners: function(){
		var self = this;
		$("div[data-listener='wheel']").off(); //prevent multiple instances of listeners on same object
		$("div[data-listener='wheel']").on("click", function(){
			var target = $(this).attr("data-target");
			let title_ = self.knowledgeBase.settings[target].title;
			var items_ = self.getSelectables( target );
			
			
			var config = {
			    title: title_,
			    items:[ [ items_ ] ],
			    positiveButtonText: "Done",
			    negativeButtonText: "Cancel"
			};
			window.SelectorCordovaPlugin.showSelector(config, function(result) {
				self.knowledgeBase.settings[target].value = items_[result[0].index].value;
			    self.saveSettings();
				self.updateUI();
			}, function() {
			    console.log('Canceled');
			});
			
		});		
	},
	initActivityListeners: function(){
		var self = this;
		$("div[data-listener='activity']").off(); //prevent multiple instances of listeners on same object
		$("div[data-listener='activity']").on("click", function(){
			var target = $(this).attr("data-target");
			self.knowledgeBase.activity.selected = target;
			
			$( "div[data-listener='activity']" ).removeClass( "selected" );
			self.updateUI();
		});	
	},
	loadSettings: function(){
		this.pageMap = { "dashboard": "./pages/dashboard.html",
						 "settings": "./pages/settings.html" };
		
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
												"windchill": -99,
			 									"temperature": -99,
												"globetemperature": -99,
											    "humidity": -99,
												"windspeed": -99,
												"radiation": -99},
								  "settings": { "age": {"title": "What is your age?",
														"value": ""},
												 "height": {"title": "What is your height?",
															"value": ""},
												 "weight": {"title": "What is your weight?",
															"value": ""},
												 "gender": {"title": "What is your gender?",
															"value": ""} },
								  "activity": { "label": {	"LOW-": "Resting, sitting at ease.\nBreathing not challenged.",
													 		"LOW":"Light manual work:\nwriting, typing, drawing, book-keeping.\nEasy to breathe and carry on a conversation.",
													 		"MEDIUM":"Sustained arm and hand work: handling moderately heavy machinery, weeding, picking fruits.",
														 	"HIGH":"Intense arm and trunk work: carrying heavy material, shovelling, sawing, hand mowing, concrete block laying.",
															"HIGH+":"Very intense activity at fast maximum pace:\nworking with an ax, climbing stairs, running on level surface." 
												},
												"values": { "LOW-": 58,
															"LOW": 70,
															"MEDIUM": 150,
															"HIGH": 300,
															"HIGH+": 500
												},	
												"selected": "LOW",	
											}				
								  };
		//}
	},
	getSelectables: function( key ){
		var obj_array = [];
		if( key === "age" ){
			for( var i=0; i<100; i++){
				obj_array.push({description: (i+12) + " year", value: (i+12) });
			}
		}
		else if( key === "height" ){
			for( var i=0; i<100; i++){
				obj_array.push({description: (i+120) + " cm", value: (i+120)  } );
			}
		}
		else if( key === "weight" ){
			for( var i=0; i<100; i++){
				obj_array.push({description: (i+40) + " kg", value: (i+40) } );
			}
		}
		else if( key === "gender" ){
			obj_array.push({description: "Female", value: "Female" } );
			obj_array.push({description: "Male", value: "Male" } );
		}
		return obj_array;
	},
	saveSettings: function(){
		let jsonData = JSON.stringify( this.knowledgeBase );
		console.log( "saving settings: " + jsonData );
		
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
					   self.knowledgeBase.weather.temperature = weather.tair;
					   self.knowledgeBase.weather.globetemperature = weather.tglobe;
					   self.knowledgeBase.weather.humidity = weather.rh;
					   self.knowledgeBase.weather.windspeed = weather.vair;
					   self.knowledgeBase.weather.radiation = weather.solar;
					   
					   
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
		// context dependent filling of content
		if( this.currentPageID == "dashboard" ){
			if( 'weather' in this.knowledgeBase && this.knowledgeBase.weather.station !== "" ){
				let distance = parseFloat( this.knowledgeBase.weather.distance ).toFixed(0);
				$("#station").html( this.knowledgeBase.weather.station + " ("+ distance +" km)" );
				$("#temperature").html( parseFloat( this.knowledgeBase.weather.temperature ).toFixed(0) );
				$("#humidity").html( parseFloat( this.knowledgeBase.weather.humidity ).toFixed(0) );
			}
			
			this.initActivityListeners();
			let selected = this.knowledgeBase.activity.selected;
			
			$("div[data-target='"+selected+"']").addClass("selected");
			let caption_ = this.knowledgeBase.activity.label[ selected ];
			$("#activityCaption").html( caption_ );
			
			let width = $( window ).width() / 3;
			this.drawGauge( 'main_gauge', width, -0.75, 32 );
			
			width = $( window ).width() / 7;
			this.drawGauge( 'ct1', width, 1.5, 32);
			this.drawGauge( 'ct2', width, 2.2, 32 );
			this.drawGauge( 'ct3', width, 0.5, 32);
			this.drawGauge( 'ct4', width, -1.2, 32 );
			this.drawGauge( 'ct5', width, -2.6, 32 );
			
		}
		else if( this.currentPageID == "settings" ){
			this.initSettingsListeners();
			$("#age").html( this.knowledgeBase.settings.age.value );
			$("#height").html( this.knowledgeBase.settings.height.value );
			$("#weight").html( this.knowledgeBase.settings.weight.value );
			$("#gender").html( this.knowledgeBase.settings.gender.value );	
		}
	},
	drawGauge: function( id, width, value, fontsize ){
		var gauge = new RadialGauge({
		    renderTo: id,
		    width: width,
		    height: width,
			value: value,
			units: "",
		    title: "",
    		ticksAngle: 270,
		    startAngle: 45,
		    minValue: -4,
		    maxValue: 4,
		    majorTicks: [
		        -4,
		        -3,
		        -2,
		        -1,
		        0,
		        1,
		        2,
		        3,
		        4
		    ],
		    minorTicks: 0,
		    strokeTicks: false,
		    highlights: [
		        {
		            "from": -4,
		            "to": -3,
		            "color": "rgba(0, 0, 255, 1.0)"
		        },
		        {
		            "from": -3,
		            "to": -2,
		            "color": "rgba(0, 128, 255, 1.0)"
		        },
		        {
		            "from": -2,
		            "to": -1,
		            "color": "rgba(0, 255, 255, 1.0)"
		        },
		        {
		            "from": -1,
		            "to": 1,
		            "color": "rgba(0, 255, 0, 1.0)"
		        },
		        {
		            "from": 1,
		            "to": 2,
		            "color": "rgba(255, 255, 0, 1.0)"
		        },
		        {
		            "from": 2,
		            "to": 3,
		            "color": "rgba(255, 128, 0, 1.0)"
		        },
		        {
		            "from": 3,
		            "to": 4,
		            "color": "rgba(255, 0, 0, 1.0)"
		        }
		    ],
    		colorPlate: '#fff',
    		colorPlateEnd: '#f3f3f3',
			borderShadowWidth: 0,
		    borders: false,
		    needleType: "arrow",
		    needleWidth: 5,
			needleShadow: false,
			colorNeedle: "#f00",
			colorNeedleEnd: "#000",
		    needleCircleSize: 7,
		    needleCircleOuter: false,
		    needleCircleInner: false,
			animationDuration: 1500,
		    animationRule: "linear",
		    valueBox: false,
			fontNumbersSize: fontsize,
		}).draw();
	}
	
	
};

app.initialize();