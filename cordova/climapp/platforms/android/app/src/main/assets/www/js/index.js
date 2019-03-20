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
		this.loadSettings();
		if( this.knowledgeBase.isFirstUse ){//onboarding
			this.loadUI( "onboarding" );
		}else{
			this.loadUI( "dashboard" );
		}
		this.updateLocation();
    },
	initNavbarListeners: function(){
		// navigation menu
		var self = this;
		$("div[data-listener='navbar']").off();
		$("div[data-listener='navbar']").on("touchstart", function(){
			let target = $( this ).attr("data-target");
			self.loadUI( target );
		});
	},
	initSettingsListeners: function(){
		var self = this;
		$("div[data-listener='wheel']").off(); //prevent multiple instances of listeners on same object
		$("div[data-listener='wheel']").on("touchstart", function(){
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
	initGeolocationListeners: function(){
		var self = this;
		$("div[data-listener='geolocation']").off(); //prevent multiple instances of listeners on same object
		$("div[data-listener='geolocation']").on("touchstart", function(){
			self.updateLocation();
		});		
	},
	initActivityListeners: function(){
		var self = this;
		$("div[data-listener='activity']").off(); //prevent multiple instances of listeners on same object
		$("div[data-listener='activity']").on("touchstart", function(){
			var target = $(this).attr("data-target");
			self.knowledgeBase.activity.selected = target;
			
			$( "div[data-listener='activity']" ).removeClass( "selected" );
			self.calcThermalIndices();
			self.updateUI();
		});	
	},
	loadSettings: function(){
		this.pageMap = { "dashboard": "./pages/dashboard.html",
						 "settings": "./pages/settings.html",
		 				 "onboarding": "./pages/onboarding.html"};
		localStorage.clear();
		if ( localStorage.getItem("knowledgebase") !== null ) {
			this.knowledgeBase = JSON.parse( localStorage.getItem("knowledgebase") );
		}
		else{
			var self = this;
			this.knowledgeBase = { "isFirstUse": true,
								   "position": { "lat": 0, 
												 "lng": 0, 
												 "timestamp": "" },
								   "weather": {	"station": "",
												"lat": 0,
												"lng": 0,
											    "distance": -1,
												"utc": [""],
												"wbgt": [-99],
												"windchill": [-99],
			 									"temperature": [-99],
												"globetemperature": [-99],
											    "humidity": [-99],
												"watervapourpressure": [-99],
												"windspeed": [-99],
												"radiation": [-99]
									},
								  "settings": { "age": {"title": "What is your age?",
														"value": 36},
												 "height": {"title": "What is your height?",
															"value": 186},
												 "weight": {"title": "What is your weight?",
															"value": 82},
												 "gender": {"title": "What is your gender?",
															"value": "Male"},
												 "BSA": function(){ //m2
													 let w = self.knowledgeBase.settings.weight.value; //kg
													 let h = self.knowledgeBase.settings.height.value / 100; //m
													 return ( Math.pow(1.8, 0.725) * 0.20247 * Math.pow(80, 0.425 ) );//dubois & dubois 
												 },
												 "M": function(){ //W/m2
													 let ISO_selected = self.knowledgeBase.activity.selected;
												 	 let ISO_level = self.knowledgeBase.activity.values[ ISO_selected ];
													 return 50 * (ISO_level);
												 }
								   },
								  "activity": { "label": {	"LOW-": "Resting, sitting at ease.\nBreathing not challenged.",
													 		"LOW":"Light manual work:\nwriting, typing, drawing, book-keeping.\nEasy to breathe and carry on a conversation.",
													 		"MEDIUM":"Walking 2.5 - 5.5km/h. Sustained arm and hand work: handling moderately heavy machinery, weeding, picking fruits.",
														 	"HIGH":"Intense arm and trunk work: carrying heavy material, shovelling, sawing, hand mowing, concrete block laying.",
															"HIGH+":"Very intense activity at fast maximum pace:\nworking with an ax, climbing stairs, running on level surface." 
												},
												"values": { "LOW-": 1, //ISO 8896
															"LOW": 2,
															"MEDIUM": 3,
															"HIGH": 4,
															"HIGH+": 5
												},	
												"selected": "LOW",	
									},
									"thermalindices":	{ 
												"ireq":[{ 	"ICLminimal":0.0,//array of objects
							  						    	"ICLneutral": 0.0,
									 				    	"DLEneutral": 0.0,
															"DLEminimal": 0.0,
															"utc":"2019/12/31 00:00:00",
												}],
											  	"phs": [{ "D_Tre" : 0.0,//array of objects
													   	 "Dwl50": 0.0,
													   	 "SWtotg": 0.0,
													     "utc":"2019/12/31 00:00:00",
											  	}],
												"wbgt": { "RAL" : function(){
																		let M = self.knowledgeBase.settings.M(); //W/m2
																		let BSA = self.knowledgeBase.settings.BSA(); //m2
																		let watt = M * BSA;
																		return 59.9 - 14.1 * Math.log10( watt );
																	},
														"risk" : function( wbgt ){ //wbgt from weather report
																		let RAL = self.knowledgeBase.thermalindices.wbgt.RAL();
																		let risk = wbgt / RAL; 
																		return 3 * ( ( risk ) / 1.2 ); //scale >1.2 to >3 for visualisation
																	}
												},
												"windchill":{ 
													"risk": function( windchill ){ //returns time before frostbite in minutes
														if( windchill <-50 ){
															return 2;
														}
														else if( windchill < -40 ){
															return 10;
														}
														else if( windchill < -20 ){
															return 30;
														}
														else if( windchill < -15 ){
															return 60;
														}
													}
												}
									},
									"gauge":{
										"cold":{
											"title": { 0: "Good",
													  1: "Cool",
													  2: "Cold",
													  3: "Very cold",
													  4: "Extremely cold!"},
											"sectors":[{
												          color : "#00ff00",
													      lo : 0,
												          hi : 1
												        },{
												          color : "#00ffdd",
												          lo : 1,
												          hi : 2
												        },{
												          color : "#00aaaa",
												          lo : 2,
												          hi : 3
												        },{
												          color : "#0000ff",
												          lo : 3,
												          hi : 4
												        } ],
											},
										"heat":{
											"title":{ 0: "Good",
													  1: "Warm",
													  2: "Hot",
													  3: "Very hot",
													  4: "Extremely hot!"},
											"sectors":[{
										          color : "#00ff00",
											      lo : 0,
										          hi : 1
										        },{
										          color : "#ddff00",
										          lo : 1,
										          hi : 2
										        },{
										          color : "#aaaa00",
										          lo : 2,
										          hi : 3
										        },{
										          color : "#ff0000",
										          lo : 3,
										          hi : 4
										        } ]
											}
										
									},
									"thresholds":{
										"ireq":{
											"icl": 1.0
										},
										"phs":{
											"duration": 120,
											"sweat":1.0,
										},
									},
									"sim":{
										"duration": 240, //minutes (required for PHS)
									}
								  };
		}
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
		localStorage.setItem("knowledgebase", jsonData );
	},
	updateLocation: function(){
		//$('i.fa-sync-alt').toggleClass("fa-spin");
		var self = this; //copy current scope into local scope for use in anonymous function 
		let options = {timeout: 30000 };
		
		navigator.geolocation.getCurrentPosition( 
			function( position ){ //on success
				self.knowledgeBase.position.lat = position.coords.latitude;
				self.knowledgeBase.position.lng = position.coords.longitude;
				self.knowledgeBase.position.timestamp = new Date( position.timestamp ).toJSON();
				console.log( "loc found: " + JSON.stringify( position.coords ) );
				self.updateWeather();
				//setTimeout( function(){ $('i.fa-sync-alt').toggleClass("fa-spin") }, 1000 );
				
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
			let appid = "f22065144b2119439a589cbfb9d851d3";
			let url = "https://www.sensationmapps.com/WBGT/api/worldweather.php";
			let data = { "action": "helios",
						 "lat": this.knowledgeBase.position.lat,
					 	 "lon": this.knowledgeBase.position.lng,
						 "climapp": appid,
					 	 "utc": new Date().toJSON() };
			$.get( url, 
				   data, 
				   function( output ){//on success
					   try{
					   	   let weather = JSON.parse( output );
						   self.knowledgeBase.weather.station = weather.station;
						   self.knowledgeBase.weather.distance = weather.distance ? weather.distance : 0;
						   self.knowledgeBase.weather.utc = "utc" in weather ? weather.utc : weather.dt;
					   	   self.knowledgeBase.weather.utc = self.knowledgeBase.weather.utc.map( function(val){
							   	let str = val.replace(/-/g,"/");
								str += " UTC";
								return str;
					   	   });
						   self.knowledgeBase.weather.lat = weather.lat;
						   self.knowledgeBase.weather.lng = weather.lon;
						   self.knowledgeBase.weather.wbgt = weather.wbgt_max.map(Number);
						   self.knowledgeBase.weather.windchill = weather.windchill.map(Number);
						   self.knowledgeBase.weather.temperature = weather.tair.map(Number);
						   self.knowledgeBase.weather.globetemperature = weather.tglobe.map(Number);
						   self.knowledgeBase.weather.humidity = weather.rh.map(Number);
						   self.knowledgeBase.weather.watervapourpressure = [];
						   $.each( self.knowledgeBase.weather.humidity,
							   function( key, val){
								   let T = self.knowledgeBase.weather.temperature[key];
								   let wvp = ( val * 0.01) * Math.exp( 18.965 - 4030/(T+235));	
								   self.knowledgeBase.weather.watervapourpressure.push( wvp );	
						   }); 
						   self.knowledgeBase.weather.windspeed = weather.vair.map(Number).map( function( v ){
							   return Math.pow( v, 0.16 );
						   } );
						   
						   self.knowledgeBase.weather.radiation = weather.solar.map(Number);
					   	   console.log( "succes weather " + JSON.stringify( self.knowledgeBase.weather ));
		   				   self.saveSettings();
						   self.calcThermalIndices();
		   				   self.updateUI();
					   }
					   catch( error ){
						   console.log( error );
					   }
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
		})
	},
	calcThermalIndices: function( ){
		this.knowledgeBase.thermalindices.ireq = [];
		this.knowledgeBase.thermalindices.phs = [];
			var index = 0; //
			//ireq
			var options =  {	air:{
											"Tair": this.knowledgeBase.weather.temperature[index], 	//C
											"rh": 	this.knowledgeBase.weather.humidity[index], 	//% relative humidity
											"Pw_air": this.knowledgeBase.weather.watervapourpressure[index],   //kPa partial water vapour pressure
											"Trad": this.knowledgeBase.weather.globetemperature[index], 	//C mean radiant temperature
											"v_air": this.knowledgeBase.weather.windspeed[index], 	//m/s air velocity at ground level
									},
									body:{
											"M": this.knowledgeBase.settings.M(), 	//W/m2 
											"work": 	0,		//W/m2 external work 
											"posture": 	2,		//1= sitting, 2= standing, 3= crouching
											"weight":   this.knowledgeBase.settings.weight.value,		//kg  
											"height": 	this.knowledgeBase.settings.height.value / 100,	//m
											"drink": 	0,	// may drink freely
											"accl": 	0		//% acclimatisation state either 0 or 100						
									},
									cloth:{
											"Icl": 		0.8, 	//clo
											"p": 		50, 	// Air permeability (low < 5, medium 50, high > 100 l/m2s)
											"im_st": 	0.38, 	// static moisture permeability index
											"fAref": 	0.54,	// Fraction covered by reflective clothing
											"Fr": 		0.97,	// Emissivity reflective clothing
									},
									move:{
											"walk_dir":	NaN, 	//degree walk direction
											"v_walk": 	0,	//m/s walking speed
									},
									sim: {
											"mod": 0
									}
							};
		
			heatindex.IREQ.set_options( options );
			heatindex.IREQ.sim_run();
		
			var ireq = heatindex.IREQ.current_result();
			var ireq_object = {
				"ICLminimal": ireq.ICLminimal,
				"DLEminimal": ireq.DLEminimal,
				"ICLneutral": ireq.ICLneutral,
				"DLEneutral": ireq.DLEneutral,
				"utc": this.knowledgeBase.weather.utc[index],
			};
			this.knowledgeBase.thermalindices.ireq.push( ireq_object );
			
			heatindex.PHS.set_options( options );
			heatindex.PHS.sim_init();
			
			let simduration = this.knowledgeBase.sim.duration;
			for( var i=1;i<=simduration;i++){
				var res = heatindex.PHS.time_step();
			}
			var phs = heatindex.PHS.current_result();
			var phs_object = {
				"D_Tre": phs.D_Tre,
				"Dwl50": phs.Dwl50,
				"SWtotg": phs.SWtotg,
				"utc": this.knowledgeBase.weather.utc[index],
			};
			this.knowledgeBase.thermalindices.phs.push( phs_object );
	},
	updateUI: function(){
		// context dependent filling of content
		this.initNavbarListeners();
		
		if( this.currentPageID == "onboarding"){
		}
		else if( this.currentPageID == "dashboard" ){
			if( 'weather' in this.knowledgeBase && this.knowledgeBase.weather.station !== "" ){
				let distance = parseFloat( this.knowledgeBase.weather.distance ).toFixed(0);
				let local_date = new Date( this.knowledgeBase.weather.utc[0] ); //
				
				$("#current_time").html( local_date.toLocaleString() );
				$("#station").html( this.knowledgeBase.weather.station + " ("+ distance +" km)" );
				$("#temperature").html( parseFloat( this.knowledgeBase.weather.temperature[0] ).toFixed(0) );
				$("#windspeed").html( parseFloat( this.knowledgeBase.weather.windspeed[0] ).toFixed(0) );
				$("#humidity").html( parseFloat( this.knowledgeBase.weather.humidity[0] ).toFixed(0) );
				
			}
			this.initGeolocationListeners();
			this.initActivityListeners();
			let selected = this.knowledgeBase.activity.selected;
			
			$("div[data-target='"+selected+"']").addClass("selected");
			let caption_ = this.knowledgeBase.activity.label[ selected ];
			$("#activityCaption").html( caption_ );
			
			
			let icl_min = this.knowledgeBase.thermalindices.ireq[0].ICLminimal;
			let dle_min = 60 * this.knowledgeBase.thermalindices.ireq[0].DLEminimal;
			dle_min = dle_min.toFixed(0);
			let d_tre = this.knowledgeBase.thermalindices.phs[0].D_Tre;
			let d_sw = this.knowledgeBase.thermalindices.phs[0].Dwl50;
			let sw_tot_per_hour = 0.001 * 60 * this.knowledgeBase.thermalindices.phs[0].SWtotg / 
			(this.knowledgeBase.sim.duration ); //liter per hour
			sw_tot_per_hour = sw_tot_per_hour.toFixed(1);
			
			
			let cold_index = icl_min;
			let heat_index = this.knowledgeBase.thermalindices.wbgt.risk( this.knowledgeBase.weather.wbgt[0] );
			
			let draw_cold_gauge = cold_index > heat_index;
			let draw_heat_gauge = !draw_cold_gauge;
			
			let icl_min_threshold = this.knowledgeBase.thresholds.ireq.icl;
			let duration_threshold = this.knowledgeBase.thresholds.phs.duration;
			let sweat_threshold = this.knowledgeBase.thresholds.phs.sweat;
			
			let tip_html = "";
			
			if( icl_min > icl_min_threshold ){
				//this.drawGauge( 'main_gauge', width, icl_min , "cold stress level" );
				tip_html += "<p><span class='score'>"+dle_min+"</span> minutes before low body temperature.</p>";
			}
			/* 
			// requires phs to be calculated with ireqmin
			if( icl_min > icl_min_threshold 
				&& 
				( d_tre < duration_threshold || d_sw < duration_threshold ) ){
				tip_html += "<p class='label'>Implication when adjusting clothing appropriatly to cold.</p>";
			}
			*/
			if( d_tre < duration_threshold ){
				//this.drawGauge( 'main_gauge', width, icl_min , "heat stress level" );
				tip_html += "<p><span class='score'>"+d_tre+"</span> minutes before high body temperature.</p>";
			}
			if( d_sw < duration_threshold ){
				//this.drawGauge( 'main_gauge', width, icl_min , "heat stress level" );
				tip_html += "<p>Risk for severe dehydration in <span class='score'>"+d_sw+"</span> minutes.</p>";
			}
			if( sw_tot_per_hour >= sweat_threshold ){
				//
				tip_html += "<p><span class='score'>"+sw_tot_per_hour+"</span> liter sweat loss per hour.</p>";
			}
			
			if( tip_html === ""){
				tip_html += "<p>No significant thermal stress expected.</p>";
			}
			let width = $( window ).width() / 1.67;
			$("#main_gauge").width( width );
			$("#main_gauge").html("");//clear gauge
			
			if( draw_cold_gauge ){
				this.drawGauge( 'main_gauge', width, cold_index , "cold" );
			}
			else if( draw_heat_gauge ){
				this.drawGauge( 'main_gauge', width, heat_index , "heat" );
			}
			
			$("#tips").html( tip_html );
			
		}
		else if( this.currentPageID == "settings" ){
			this.initSettingsListeners();
			$("#age").html( this.knowledgeBase.settings.age.value );
			$("#height").html( this.knowledgeBase.settings.height.value );
			$("#weight").html( this.knowledgeBase.settings.weight.value );
			$("#gender").html( this.knowledgeBase.settings.gender.value );	
		}
	},
	drawGauge: function( id, width, value, key ){
		var title = this.knowledgeBase.gauge[key].title[ Math.floor( value ) ];
	    var g = new JustGage({
	      id: id,
	      value: value,
	      min: 0,
	      max: 4,
	      title: title,
		  titleFontColor: "#222",
		  gaugeColor: "rgba(80,80,80,0.5)",
		  decimals: 1,
	      customSectors: this.knowledgeBase.gauge[key].sectors,
	      counter: true
	    });
	}
	
	
};

app.initialize();