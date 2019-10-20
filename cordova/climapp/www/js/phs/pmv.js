/*
Copyright (c) 2019, Boris Kingma, The Netherlands, Kopenhagen University and TNO the Netherlands. All rights reserved.

//	ORIGINAL Developed by Ingvar Holmer, 2008.


Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

- Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
- Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.
- Neither the name of the Department of Design Sciences (EAT), Lund University nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

*************************************************************************************************************************************************

*/
"use strict;";

var heatindex = heatindex || {};

heatindex.PMV = ( function( options ){
    var params = options || {	air:{
										"Tair": 	0, 	//C
										"rh": 	60, 	//% relative humidity
										"Trad": 	0, 	//C mean radiant temperature
										"v_air": 	0.2, 	//m/s air velocity
								},
								body:{
										"M": 		150, 	//W/m2 
										"work": 	0,		//W/m2 external work 
								},
								cloth:{
										"Icl": 		0.5, 	//clo
										"p": 	50, 	// Air permeability (low < 5, medium 50, high > 100 l/m2s) 
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
    var limit = { };
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
	    limit = { PMV: -99,
				  PPD: -1,
		};
	    move = params.move;
	    skin = {};
	    sweat = {};
	}
	
	
	function calcPMV() {
		if (body.M<=58) {
			body.M=58;
		}
		if (body.M>=232) {
			body.M=232;
		}
		if (air.Ta<=10) {
			air.Ta=10;
		}
		// Calculation of stationary w (m/s), NOT used
		if (move.v_walk<=0.0052*(body.M-58)) {
			move.v_walk=0.0052*(body.M-58); 
		}	
		if (move.v_walk>=1.2) {
			move.v_walk=1.2;
		}
		if (air.v_air<=0.1) {
			air.v_air=0.1;
		}
		if (air.v_air>=4) {
			air.v_air=4;
		}
		var Icl=cloth.Icl*0.155;
		var Ia= 0.092*Math.exp(-0.15*air.v_air-0.22*move.v_walk)-0.0045;
		var Tsk=35.7-0.0285*body.M;
		var calculation=0; 

			// Calculation of Pa (Pa) 
		var Ta = air.Tair;
		var Pa=(air.rh/100)*0.1333*Math.exp(18.6686-4030.183/(Ta+235));
		
		

		// *** Calculation of Dlimneutral and Dlimminimal *** 
		// Calculation of S (W/m2),fcl (n.d.), hr W/m2C with stepwise iteration 
		var Tcl=Ta;
		var Tr=air.Trad;
		var hr=3; 
		var S=0; 
		var ArAdu=0.77;
		var factor=500; 
		var Iclr=Icl; // Initial values !
		var fcl = 1;
		var E = 0;
		var Ediff = 0;
		var Hres = 0;
		var balance = 0;
		do {
			fcl=1.05+0.65*Icl;
			E=0.42*((body.M-body.work)-58);
			Ediff=3.05*(0.255*Tsk-3.36-Pa);
			Hres=1.73E-2*body.M*(5.867-Pa)+1.4E-3*body.M*(34-Ta);
			Tcl=Tsk-Icl*(body.M-body.work-E-Ediff-Hres-S);      
			hr=5.67E-8*0.95*ArAdu*(Math.exp(4*Math.log(273+Tcl))-Math.exp(4*Math.log(273+Tr)))/(Tcl-Tr);
			hc=12.1*Math.pow(air.v_air,0.5);
			R=fcl*hr*(Tcl-Tr);
			C=fcl*hc*(Tcl-Ta);
			balance=body.M-body.work-E-Ediff-Hres-R-C-S;  
			if (balance>0)  {
				S=S+factor;
				factor=factor/2;
			}
			else {
				S=S-factor;
			}     
		} while (Math.abs(balance) > 0.01);
		
		S = body.M-body.work-E-Ediff-Hres-R-C;

		limit.PMV=(0.303*Math.exp(-0.036*body.M)+0.028)*S;
		limit.PPD= 100-95*Math.exp(-0.03353*Math.pow(limit.PMV,4)-0.2179*Math.pow(limit.PMV,2))

	}

	function current_result(){
        return limit;
	}
	
    // Reveal public pointers to 
    // private functions and properties
    return{
		set_options: set_options,
        sim_run : calcPMV,
        current_result : current_result,
    };
})();



