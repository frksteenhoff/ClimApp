/*
Copyright (c) 2019, Boris Kingma, The Netherlands, Kopenhagen University and TNO the Netherlands. All rights reserved.

//	ORIGINAL Developed by Ingvar Holmer and Hakan O. Nilsson, 1990.
//	Altered by Hakan O. Nilsson and Ingvar Holmer, 1992.
//	Javascript original by Tomas Morales & Pilar Armenderiz, 1998.
//	Modified content and code by Hakan O. Nilsson and Ingvar Holmer, 2000-2002.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

- Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
- Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.
- Neither the name of the Department of Design Sciences (EAT), Lund University nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

*************************************************************************************************************************************************

*/
"use strict;";

var heatindex = heatindex || {};

heatindex.IREQ = ( function( options ){
    var params = options || {	air:{
										"Tair": 	0, 	//C
										"rh": 	60, 	//% relative humidity
										"Trad": 	0, 	//C mean radiant temperature
										"v_air": 	0.4, 	//m/s air velocity
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
    var limit = { IREQminimal: -1,
				  ICLminimal: -1,
				  IREQneutral: -1,
			      ICLneutral: -1,
			      DLEminimal: -1,
		 		  DLEneutral: -1};
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
	    limit = { IREQminimal: -1,
				  ICLminimal: -1,
				  IREQneutral: -1,
				  ICLneutral: -1,
				  DLEminimal: -1,
			 	  DLEneutral: -1};
	    move = params.move;
	    skin = {};
	    sweat = {};
	}
	
	var M,Ta,Tr,p,w,v,rh,Tsk,wetness,Tex,Pex,
	Psks,fcl,W,vp,Icl,Iclr,Pa,Tcl,hc,hr,
	IREQ,Ia,Rt,factor,Balance,R,C,Hres,
	E,S,DLE,ArAdu,IclCorr,slask,worktype,calculation,
	message,IREQneutral,IREQminimal,DLEneutral,DLEminimal = 1;
	
	function calcIREQ(){
	    var MAXITERATIONS = 1000;
		var iteration = 0;
		
		M = body.M; 
		W = body.work;
		Ta = air.Tair; 
		Tr = air.Trad;
		p = cloth.p; 
		w = move.v_walk;
		v = air.v_air; 
		rh = air.rh;
		Icl = cloth.Icl;
		if (M<=58) {
			M=58;
		}
		if (M>=400) {
			M=400; 
		}
		//if (Ta>=10) {
		//	Ta=10;
		//}
		// Calculation of stationary w (m/s)
		if (w<=0.0052*(M-58)) {
			w=0.0052*(M-58);
		}	
		if (w>=1.2) {
			w=1.2; 
		}
		if (v<=0.4) {
			v=0.4; 
		}
		if (v>=18) {
			v=18; 
		}
		Icl=Icl*0.155;
		Ia=0.092*Math.exp(-0.15*v-0.22*w)-0.0045;
		calculation=0; 
		do {
			calculation=calculation+1;
			// Calculation of Tsk (C) and wetness (%) 
			if (calculation==1) {
				// For IREQminimal, DLEminimal ! 
				Tsk=33.34-0.0354*M;
				wetness=0.06;
			}
	         	else	{
				// For IREQneutral, DLEneutral ! 
				Tsk=35.7-0.0285*M;
				wetness=0.001*M;
		 	}
			// Calculation of Tex (C) and Pex,Psks,Pa (Pa) 
			Tex=29+0.2*Ta;                     
			Pex=0.1333*Math.exp(18.6686-4030.183/(Tex+235));
			Psks=0.1333*Math.exp(18.6686-4030.183/(Tsk+235)); 
			Pa=(rh/100)*0.1333*Math.exp(18.6686-4030.183/(Ta+235));
			// Calculation of IREQ (m2C/W),Rt (m2kPa/W),fcl (n.d.),hr W/m2C with stepwise iteration 
			IREQ=0.5; hr=3; ArAdu=0.77; factor=0.5; // Initial values ! 
			
			iteration = 0;
			
			do {
				iteration = iteration + 1;
				
				fcl=1+1.197*IREQ;        
				Rt=(0.06/0.38)*(Ia+IREQ);
				E=wetness*(Psks-Pa)/Rt;
				Hres=1.73E-2*M*(Pex-Pa)+1.4E-3*M*(Tex-Ta);      
				Tcl=Tsk-IREQ*(M-W-E-Hres);
				hr=5.67E-8*0.95*ArAdu*(Math.exp(4*Math.log(273+Tcl))-Math.exp(4*Math.log(273+Tr)))/(Tcl-Tr);
				hc=1/Ia-hr;
				R=fcl*hr*(Tcl-Tr);
				C=fcl*hc*(Tcl-Ta);
				Balance=M-W-E-Hres-R-C;
				if (Balance>0)  {
					IREQ=IREQ-factor;
					factor=factor/2;
				}
				else {
					IREQ=IREQ+factor;         
				}

			} while (Math.abs(Balance) > 0.01 && iteration < MAXITERATIONS ); 
			IREQ=(Tsk-Tcl)/(R+C);

			// *** Calculation of Dlimneutral and Dlimminimal *** 
			// Calculation of S (W/m2), Rt (m2kPa/W), fcl (n.d.), hr W/m2C with stepwise iteration 
			Tcl=Ta; hr=3; S=-40; ArAdu=0.77; factor=500; Iclr=Icl; // Initial values !
			do {
				fcl=1+1.197*Iclr;
				Iclr=((Icl+0.085/fcl)*(0.54*Math.exp(-0.15*v-0.22*w)*Math.pow(p,0.075)-0.06*Math.log(p)+0.5)-
				(0.092*Math.exp(-0.15*v-0.22*w)-0.0045)/fcl);
				Rt=(0.06/0.38)*(Ia+Iclr);
				E=wetness*(Psks-Pa)/Rt;
				Hres=1.73E-2*M*(Pex-Pa)+1.4E-3*M*(Tex-Ta);
				Tcl=Tsk-Iclr*(M-W-E-Hres-S);      
				hr=5.67E-8*0.95*ArAdu*(Math.exp(4*Math.log(273+Tcl))-
				Math.exp(4*Math.log(273+Tr)))/(Tcl-Tr);
				hc=1/Ia-hr;
				R=fcl*hr*(Tcl-Tr);
				C=fcl*hc*(Tcl-Ta);
				Balance=M-W-E-Hres-R-C-S;  
				if (Balance>0)  {
					S=S+factor;
					factor=factor/2;
				}
				else {
					S=S-factor;
				}     
			} while (Math.abs(Balance) > 0.01);
			DLE=-40/S;
			if (calculation==1) {
				limit.IREQminimal = Math.round((IREQ/0.155)*10)/10;
				limit.ICLminimal =Math.round((((IREQ+Ia/fcl)/(0.54*Math.exp(-0.15*v-0.22*w)*
				Math.pow(p,0.075)-0.06*Math.log(p)+0.5))-0.085/fcl)/0.155*10)/10;
				
				limit.DLEminimal=Math.round(DLE*10)/10
			}
			else	{
				limit.IREQneutral= Math.round((IREQ/0.155)*10)/10;
				limit.ICLneutral = Math.round((((IREQ+Ia/fcl)/(0.54*Math.exp(-0.15*v-0.22*w)*
				Math.pow(p,0.075)-0.06*Math.log(p)+0.5))-0.085/fcl)/0.155*10)/10;
				limit.DLEneutral = Math.round(DLE*10)/10
			}
		} while (calculation < 2);
	}
	
	function current_result(){
        return limit;
	}
	
    // Reveal public pointers to 
    // private functions and properties
    return{
		set_options: set_options,
        sim_run : calcIREQ,
        current_result : current_result,
    };
})();
