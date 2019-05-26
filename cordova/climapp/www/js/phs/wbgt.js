/*
Copyright (c) 2019, Boris Kingma, The Netherlands, TNO the Netherlands. All rights reserved.

//	ORIGINAL www.arbobondgenoten.nl/arbothem/fysisch/klimaat/calculator-wbgt.htm
//	Altered by Boris Kingma, 2019.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

- Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
- Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.
- Neither the name of the Department of Design Sciences (EAT), Lund University nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

*************************************************************************************************************************************************

*/
"use strict;";

var heatindex = heatindex || {};

heatindex.WBGT = ( function( options ){
    var params = options || {	air:{
										"Tair": 	0, 	//C
										"rh": 	60, 	//% relative humidity
										"Trad": 	0, 	//C mean radiant temperature
										"v_air": 	0.4, 	//m/s air velocity
										"wbgt": 0,
										"radkey": "Shadow",
										"windkey": "Windstil"
								},
								body:{
										"A": 		1.86,
										"M": 		150, 	//W/m2 
										"work": 	0,		//W/m2 external work 
										"actkey": "Light",
								},
								cloth:{
										"Icl": 		0.5, 	//clo
										"p": 		50, 	// Air permeability (low < 5, medium 50, high > 100 l/m2s)
										"clokey": "Summer attire",
										"hoodkey": "None"
								},
								move:{
										"v_walk": 	0,	//m/s walking speed
								},
						};

    var air = params.air;
    var body = params.body;
    var cloth = params.cloth;
    var core =  {};
    var heatex = {};
    var limit = { RAL: -1,
			  WBGT: -1,
			  index: -1,
			 };
    var move = params.move;
    var skin = {};
    var sweat = {};
	
	
	function set_options( options_ ){
		params = options_;
	    air = params.air;
	    body = params.body;
	    cloth = params.cloth;
	    core =  {};
	    heatex = {};
	    limit = { RAL: -1,
				  WBGT: -1,
				  index: -1,
				 };
	    move = params.move;
	    skin = {};
	    sweat = {};
	}
	
	
	function dewPoint(){ //from view-source:https://www.arbobondgenoten.nl/arbothem/fysisch/klimaat/calculator-wbgt.htm
		let temp= air.Tair;
		let RH = air.rh;
	    let kelvin=temp + 273;
		let Ps = 6.11 * Math.pow( 10, 7.5 * temp/(237.7 + temp));
		let P =(RH * Ps)/100;
		let DP = ( -430.22 + 237.7 * Math.log(P))/(-(Math.log(P)) + 19.08);
		let td = DP + 273;
		return td;
	}
	//indoor
     function wetBulbTemp(){ //from view-source:https://www.arbobondgenoten.nl/arbothem/fysisch/klimaat/calculator-wbgt.htm
 		 let temp= air.Tair;
 		 let RH = air.rh;
		 let ex = 0.6108*Math.exp((17.27*temp)/(temp+237.3));
		 let ex_h = ex*RH/100;
		 let d_p = 237.3*(((Math.log(ex_h/0.6108))/17.27)/(1-((Math.log(ex_h/0.6108))/17.27)));
		 let prem =(4099*ex)/Math.pow((temp+237.3),2);
		 let seco  =(4099*ex_h )/Math.pow((d_p+237.3),2);
		 let third =(prem + seco)/2;
		 let natwetbulb  =temp-( ex  -  ex_h )/(third+0.00066*101.325);
		 let natwetbulbest = natwetbulb +1;
		 return natwetbulbest;
    }
	//indoor
	function wetBulbGlobeTempIndoor(){ 
		let GT = air.Tair;//globe temp = air temp assumption for indoor - correction for radiation later
		let WBT = wetBulbTemp();
		
		let dClo = clothingWBGTCorrection();
		let dRad = radiationWBGTCorrection();
		let dWind = windWBGTCorrection();
		let dHood = hoodWBGTCorrection();
		let WBGT = 0.7 * WBT + 0.3 * GT + dClo + dRad + dWind + dHood;
		return WBGT;
	}
	
	function wetBulbGlobeTempOutdoor(){ 
		let dClo = clothingWBGTCorrection();
		let dHood = hoodWBGTCorrection();
		let WBGT = air.WBGT + dClo + dHood;
		return WBGT;
	}
	function windWBGTCorrection(){
		let db = {"Windstil": 0,
				  "Redelijk": -0.2,
				  "Stevig": -0.4 };
		return db[ air.windkey ];
	}
	function radiationWBGTCorrection(){
		let db = {"Schaduw": 0,
				  "Halfschaduw": 2.1,
				  "Direct": 3.1,
				  "Extreem": 4.5};
		return db[ air.radkey ];
	}
	function clothingWBGTCorrection(){
		let db = {"Zomerkleding": 0,
				  "Overall": 3,
				  "Beschermende": 5}; // deviation from ISO7243 which has correction 11C, but in line with original FNV heatstress 
				  					  //- source: Canadian Infrastructure, Health and Safety Association) Lejla Krdzalic
		return db[ cloth.clokey ];
	}
	function hoodWBGTCorrection(){
		let db = {"Geen": 0,
				  "Helm": 1,
				  "Muts": 1 }; 
		return db[ cloth.hoodkey ];
	}
	function RAL(){
		let A = body.A; //m2
		let M = body.M * A; //W
		let RALaccl = 56.7 - 11.5 * Math.log10( M ); //ISO7243 acclimatised - not yet implemented
		let RALunaccl = 59.9 - 14.1 * Math.log10( M ); //ISO7243 unacclimatised
		//let RAL = 
		return RALunaccl;
	}
	
	function indoor_result(){
	    limit.RAL = RAL();
		limit.WBGT = wetBulbGlobeTempIndoor();
		limit.index = limit.WBGT / limit.RAL;
		limit.colorclass = "green";
		if( limit.index > 1.2 ){
			limit.colorclass = "red";
		}
		else if ( limit.index > 1 ){
			limit.colorclass = "yellow";
		}
		return limit;
	}
	
	function outdoor_result(){
	    limit.RAL = RAL();
		limit.WBGT = wetBulbGlobeTempOutdoor();
		limit.index = limit.WBGT / limit.RAL;
		limit.colorclass = "green";
		if( limit.index > 1.2 ){
			limit.colorclass = "red";
		}
		else if ( limit.index > 1 ){
			limit.colorclass = "yellow";
		}
		return limit;
	}
	
    // Reveal public pointers to 
    // private functions and properties
    return{
		set_options: set_options,
        indoor_result : indoor_result,
		outdoor_result : outdoor_result,
    };
})();