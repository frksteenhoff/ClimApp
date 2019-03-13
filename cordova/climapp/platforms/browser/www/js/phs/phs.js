/*
Copyright (c) 2014, Bo Johansson, Lund and Department of Design Sciences (EAT), Lund University
All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

- Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
- Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.
- Neither the name of the Department of Design Sciences (EAT), Lund University nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OFMERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

*************************************************************************************************************************************************

Copyright (c) 2019, Boris Kingma, The Netherlands, Kopenhagen University and TNO the Netherlands. All rights reserved.




*/

"use strict;";

var heatindex = heatindex || {};

heatindex.PHS = ( function ( options ) {
    
    var params = options || {	air:{
										"Tair": 	40, 	//C
										"Pw_air": 	3.7, 	//kPa partial water vapour pressure
										"Trad": 	40, 	//C radiant temperature
										"v_air": 	0.3, 	//m/s air velocity
								},
								body:{
										"posture": 	2,		//1= sitting, 2= standing, 3= crouching
										"M": 		150, 	//W/m2 
										"work": 	0,		//W/m2 external work 
										"weight":   75,		//kg  
										"height": 	1.8,	//m
										"drink": 	0,	// may drink freely
										"accl": 	0		//% acclimatisation state either 0 or 100
								},
								cloth:{
										"Icl": 		0.5, 	//clo
										"im_st": 	0.38, 	// static moisture permeability index
										"fAref": 	0.54,	// Fraction covered by reflective clothing
										"Fr": 		0.97,	// Emissivity reflective clothing
								},
								move:{
										"walk_dir":	NaN, 	//degree walk direction
										"v_walk": 	NaN,	//m/s walking speed
										
								},
								sim: {
										"mod": 0
								}
						};

    var air = params.air;
    var body = params.body;
    var cloth = params.cloth;
    var core =  {};
    var heatex = {};
    var limit = {};
    var move = params.move;
    var skin = {};
    var sweat = {};
  	// sim_mod = 0 default,
    //         = 1 iso7933 ver. 1,
    //         = 2 iso7933 ver. 2,
    //         = 3 as 1 and modified core_temp_pred,
    //         = 4 as 2 and modified core_temp_pred
    var sim_mod = params.sim.mod;
    var sim_time;

    function var_reset(){
		air.v_air = NaN;
        air.Tair = NaN;
        air.Trad = NaN;
        air.Pw_air = NaN;

        body.accl = NaN;
        body.Adu = NaN;
        body.fAdu_rad_aux = NaN;
        body.fAdu_rad = NaN;
        body.drink = NaN;
        body.height = NaN;
        body.M = NaN;
        body.posture = NaN;
        body.spHeat = NaN;
        body.Tbm = NaN;
        body.Tbm_0 = NaN;
        body.weight = NaN;
        body.work = NaN;

        cloth.fAcl = NaN;
        cloth.Ia_st = NaN;
        cloth.CORcl = NaN;
        cloth.CORia = NaN;
        cloth.CORe = NaN;
        cloth.CORtot = NaN;
        cloth.Icl_dyn = NaN;
        cloth.im_dyn = NaN;
        cloth.Rtdyn = NaN;
        cloth.fAcl_rad = NaN;
        cloth.Fr = NaN;
        cloth.fAref = NaN;
        cloth.Icl_st = NaN;
        cloth.im_st = NaN;
        cloth.Tcl = NaN;
        cloth.Icl = NaN;
        cloth.Itot_dyn = NaN;
        cloth.Itot_st = NaN;

        core.dStoreq = NaN;
        core.sk_cr_rel = NaN;
        core.sk_cr_rel_0 = NaN;
        core.Tcr = NaN;
        core.Tcr_0 = NaN;
        core.Tcr_1 = NaN;
        core.Tcreq_rm_ss = NaN;
        core.Tcreq_mr_0 = NaN;
        core.Tcreq_mr = NaN;
        core.Tcreq_mr_ConstTeq = NaN;
        core.Trec_0 = NaN;
        core.Trec = NaN;

        heatex.Hcdyn = NaN;
        heatex.Hr = NaN;
        heatex.Conv = NaN;
        heatex.Rad = NaN;
        heatex.Eresp = NaN;
        heatex.Cresp = NaN;
        heatex.Tresp = NaN;
        heatex.Z = NaN;

        limit.rec_temp = NaN;
        limit.sweat_max50 = NaN;
        limit.sweat_max95 = NaN;
        limit.water_loss_max50 = NaN;
        limit.water_loss_max95 = NaN;

        move.v_walk_in = NaN;
        move.v_air_rel = NaN;
        move.walk_dir = NaN;
        move.walk_dir_in = NaN;
        move.v_walk = NaN;

        sim_mod = NaN;
        sim_time = NaN;

        skin.Pw_sk = NaN;
        skin.w_max = NaN;
        skin.w_req = NaN;
        skin.w_pre = NaN;
        skin.Tsk_0 = NaN;
        skin.Tsk = NaN;
        skin.ConstTsk = NaN;

        sweat.Emax = NaN;
        sweat.Epre = NaN;
        sweat.Ereq = NaN;
        sweat.SWmax = NaN;
        sweat.SWpre = NaN;
        sweat.SWreq = NaN;
        sweat.SW = NaN;
        sweat.SWg = NaN;
        sweat.SWtot = NaN;
        sweat.SWtotg = NaN;
        sweat.Eeff_req = NaN;
        sweat.ConstSW = NaN;
        sweat.fSWmax_accl = NaN;
    }

    var flag = 0;

    function calc_sim_const(){
        if ( sim_mod === 0 ) { sim_mod = 1; }
        body.Adu = 0.202 *Math.pow( body.weight, 0.425 ) *
           Math.pow( body.height, 0.725);
        body.spHeat = 57.83 * body.weight / body.Adu;
        if ( body.drink === 1 ){
            limit.sweat_max50 = 0.075 * body.weight * 1000;
            limit.sweat_max95 = 0.05 * body.weight * 1000;
        }
        else {
            limit.sweat_max50 = 0.03 * body.weight * 1000;
            limit.sweat_max95 = 0.03 * body.weight * 1000;
        }
        if ( body.accl < 50 ) { skin.w_max = 0.85; }
        else { skin.w_max = 1; }
        core.Tcreq_mr_ConstTeq =Math.exp( -1 / 10 );

        skin.ConstTsk =Math.exp( -1 / 3 );
        sweat.ConstSW =Math.exp( -1 / 10 );
        calc_step_const();
    }

    function calc_step_const(){
        var posture = body.posture;
        if ( posture == 1  ) { body.fAdu_rad = 0.7; }
        else if ( posture == 2  ) { body.fAdu_rad = 0.77; }
        else if ( posture == 3  ) { body.fAdu_rad = 0.67; }
        else { body.fAdu_rad = 0.7; }
        body.fAdu_rad_aux = 5.67E-08 * body.fAdu_rad;
        if ( sim_mod === 1 || sim_mod === 3 ) { // iso7933 ver. 1
            sweat.SWmax = (body.M - 32) * body.Adu;
            if ( sweat.SWmax > 400 ) { sweat.SWmax = 400; }
            if ( sweat.SWmax < 250 ) { sweat.SWmax = 250; }
        }
        else if ( sim_mod === 2 || sim_mod === 4 ) { // iso7933 modified
            sweat.SWmax = 400;
        }
        else { alert( 'ERROR in calc_step_const ' + sim_mod ); }
        if ( body.accl >= 50 ) { sweat.SWmax = sweat.SWmax * 1.25; }
        core.Tcreq_rm_ss = 0.0036 * body.M + 36.6;
        cloth.Icl_st = cloth.Icl * 0.155;
        cloth.fAcl = 1 + 0.3 * cloth.Icl;
        cloth.Ia_st = 0.111;
        cloth.Itot_st = cloth.Icl_st + cloth.Ia_st / cloth.fAcl;
        if ( ! isNaN( move.v_walk_in ) ) {
            move.v_walk = move.v_walk_in;
            if (  ! isNaN( move.walk_dir_in ) ){
                move.v_air_rel =Math.abs( air.v_air - move.v_walk *
                                          Math.cos(3.14159 * move.walk_dir_in / 180));
            }
            else {
                if ( air.v_air < move.v_walk ) {
                    move.v_air_rel = move.v_walk; }
                else { move.v_air_rel = air.v_air; }
            }
        }
        else {
            move.v_walk = 0.0052 * (body.M - 58);
            if ( move.v_walk > 0.7) { move.v_walk = 0.7; }
            move.v_air_rel = air.v_air;
        }
        heatex.Tresp =
            28.56 + 0.115 * air.Tair + 0.641 * air.Pw_air;
        heatex.Cresp =
            0.001516 * body.M * (heatex.Tresp - air.Tair);
        heatex.Eresp = 0.00127 * body.M *
            (59.34 + 0.53 * air.Tair - 11.63 * air.Pw_air);
        if ( move.v_air_rel > 1 ) {
            heatex.Z = 8.7 *Math.pow( move.v_air_rel, 0.6 ); }
        else {heatex.Z = 3.5 + 5.2 * move.v_air_rel; }
    }

    function reset(){
        var_reset();
    }

    function sim_init(){
		limit.rec_temp = NaN;
        limit.water_loss_max50 = NaN;
        limit.water_loss_max95 = NaN;
        sweat.SWpre = 0;
        sweat.SWtot = 0;
        sweat.SWtotg = 0;
        core.Trec = 36.8;
        core.Tcr = 36.8;
        skin.Tsk = 34.1;
        //body.Tbm = 36.394922930774554;
        //body.Tbm = 36.4;
        body.Tbm = 36.39488;
        core.Tcreq_mr = 36.8;
        core.sk_cr_rel =  0.3;
        cloth.Tcl = NaN;
        sweat.Epre = NaN;
        sweat.SW = NaN;
        sweat.SWg = NaN;
        sweat.SWmax = NaN;
        sweat.SWreq = NaN;
        sim_time = 0;

        calc_sim_const();
        calc_step_const();
    }

    function step_core_temp_equi_mr(){
        var Tcreqm = core.Tcreq_rm_ss;
        var ConstTeq = core.Tcreq_mr_ConstTeq;
        var val_0 = core.Tcreq_mr_0;
        core.Tcreq_mr = val_0 * ConstTeq + Tcreqm * ( 1 - ConstTeq);
        core.dStoreq = body.spHeat * (core.Tcreq_mr - val_0) * (1 - core.sk_cr_rel_0);
    }

    function skin_temp_equilibrium(){
        var Tskeq_cl = 12.165 + 0.02017 * air.Tair + 0.04361 * air.Trad + 0.19354 * air.Pw_air -
            0.25315 * air.v_air + 0.005346 * body.M + 0.51274 * core.Trec;
        var Tskeq_nu = 7.191 + 0.064 * air.Tair + 0.061 * air.Trad + 0.198 * air.Pw_air -
            0.348 * air.v_air + 0.616 * core.Trec;
        var I_cl = cloth.Icl;
        if ( I_cl <= 0.2 ) { return Tskeq_nu; }
        if ( I_cl >= 0.6 )  { return Tskeq_cl; }
        var Tskeq = Tskeq_nu + 2.5 * ( Tskeq_cl - Tskeq_nu ) * (I_cl - 0.2);
        return Tskeq;
    }

    function step_skin_temp(){
        var Tskeq = skin_temp_equilibrium();
        var ConstTsk = skin.ConstTsk;
        skin.Tsk = skin.Tsk_0 * ConstTsk + Tskeq * ( 1 - ConstTsk);
        skin.Pw_sk = 0.6105 *Math.exp( 17.27 * skin.Tsk / (skin.Tsk + 237.3));
    }

    function calc_dynamic_insulation(){
        var Vaux = move.v_air_rel;
        if ( move.v_air_rel > 3) { Vaux = 3; }
        var Waux = move.v_walk;
        if ( move.v_walk > 1.5 ) { Waux = 1.5; }
        cloth.CORcl =
            1.044 *Math.exp(( 0.066 * Vaux - 0.398 ) * Vaux + ( 0.094 * Waux - 0.378 ) * Waux);
        if ( cloth.CORcl > 1 ) { cloth.CORcl = 1; }
        cloth.CORia =
           Math.exp(( 0.047 * move.v_air_rel - 0.472) * move.v_air_rel +
                     ( 0.117 * Waux - 0.342) * Waux);
        if ( cloth.CORia > 1 ) { cloth.CORia = 1; }
        cloth.CORtot = cloth.CORcl;
        if ( cloth.Icl <= 0.6 ) {
            cloth.CORtot = (( 0.6 - cloth.Icl) * cloth.CORia +
                            cloth.Icl * cloth.CORcl) / 0.6;
        }
        cloth.Itot_dyn =
            cloth.Itot_st * cloth.CORtot;
        var IAdyn = cloth.CORia * cloth.Ia_st;
        cloth.Icl_dyn = cloth.Itot_dyn - IAdyn / cloth.fAcl;

        cloth.CORe  =
            (2.6 * cloth.CORtot - 6.5) * cloth.CORtot + 4.9;
        cloth.im_dyn =
            cloth.im_st * cloth.CORe;
        if ( cloth.im_dyn > 0.9 ) { cloth.im_dyn = 0.9; }
        cloth.Rtdyn =
            cloth.Itot_dyn / cloth.im_dyn / 16.7;
    }

    function dynamic_convection_coefficient(){
        heatex.Hcdyn =
            2.38 *Math.pow(Math.abs( skin.Tsk - air.Tair ), 0.25);
        if ( heatex.Z > heatex.Hcdyn ) { heatex.Hcdyn = heatex.Z; }
        cloth.fAcl_rad = (1 - cloth.fAref) * 0.97 +
            cloth.fAref * cloth.Fr;
    }

    function clothing_temp(){
        var Hcdyn = heatex.Hcdyn;
        var Trad_K_pow4 = air.Trad + 273;
        Trad_K_pow4 = Trad_K_pow4 * Trad_K_pow4;
        Trad_K_pow4 = Trad_K_pow4 * Trad_K_pow4;
        var Tcl1;
        var loop = 20;

        cloth.Tcl = air.Trad + 0.1;
        while ( loop > 0 ) {
            loop--;
            var Tcl_K_pow4 = cloth.Tcl + 273;
            Tcl_K_pow4 = Tcl_K_pow4 * Tcl_K_pow4;
            Tcl_K_pow4 = Tcl_K_pow4 * Tcl_K_pow4;
            heatex.Hr = cloth.fAcl_rad * body.fAdu_rad_aux *
                ( Tcl_K_pow4 - Trad_K_pow4 ) / (cloth.Tcl - air.Trad);
            Tcl1 =
                ((cloth.fAcl * (Hcdyn * air.Tair + heatex.Hr * air.Trad) +
                  skin.Tsk / cloth.Icl_dyn)) /
                (cloth.fAcl *(Hcdyn + heatex.Hr) + 1 / cloth.Icl_dyn);
            if (Math.abs(cloth.Tcl - Tcl1) > 0.001 ) {
                cloth.Tcl = (cloth.Tcl + Tcl1) / 2;
            }
            else { return; }
        }
        alert( 'clothing_temp overun');
    }

    function calc_heat_exchange(){
        heatex.Conv = cloth.fAcl * heatex.Hcdyn * (cloth.Tcl - air.Tair);
        heatex.Rad = cloth.fAcl * heatex.Hr * (cloth.Tcl - air.Trad);
        sweat.Ereq = body.M - core.dStoreq - body.work - heatex.Cresp -
            heatex.Eresp - heatex.Conv - heatex.Rad;
    }

    function sweat_rate(){
        sweat.Emax = (skin.Pw_sk - air.Pw_air) / cloth.Rtdyn;    
        if ( sweat.Ereq <= 0 ) {
            sweat.Ereq = 0;
            sweat.SWreq = 0;
            //trace branch( 'sr1');
        }
        else if ( sweat.Emax <= 0 ) {
            sweat.Emax = 0;
            sweat.SWreq = sweat.SWmax;
            //trace branch( 'sr2');
        }
        else{
            skin.w_req = sweat.Ereq / sweat.Emax;
            if ( skin.w_req >= 1.7 ) {
                skin.w_req = 1.7;
                sweat.SWreq = sweat.SWmax;
                //trace branch( 'sr3.1');
            }
            else
            {
                if ( skin.w_req > 1 ) {
                    sweat.Eeff_req = ( 2 - skin.w_req ) * ( 2 - skin.w_req ) / 2;
                    //trace branch( 'sr3.2.1');
                }
                else
                {
                    sweat.Eeff_req = 1 - ( skin.w_req * skin.w_req / 2 );
                    //trace branch( 'sr3.2.2');
                }
                sweat.SWreq = sweat.Ereq / sweat.Eeff_req;
                if ( sweat.SWreq > sweat.SWmax ) {
                    sweat.SWreq = sweat.SWmax;
                    //trace branch( 'sr3.2.3');
                }
            }
        }
        sweat.SWpre = sweat.SWpre * sweat.ConstSW + sweat.SWreq * (1 - sweat.ConstSW);
        if ( sweat.SWpre <= 0 ) {
            sweat.Epre  = 0;
            sweat.SWpre = 0;
            //trace branch( 'sp1');
        }
        else {
            var k = sweat.Emax / sweat.SWpre;
            skin.w_pre = 1;
            if ( k >= 0.5 ) {
                skin.w_pre= -k +Math.sqrt( k * k + 2 );
                //trace branch( 'sp2.1');
            }
            if ( skin.w_pre > skin.w_max ) {
                skin.w_pre = skin.w_max;
                //trace branch( 'sp2.2')
            }
            sweat.Epre = skin.w_pre * sweat.Emax;
        }
        //trace if ( sim_time <=5 || (sim_time % 40) === 0 ){
        //trace     console.log( JSON.stringify(
        //trace         {time: sim_time, Ereq: sweat.Ereq, Eeff_req: sweat.Eeff_req,
        //trace          SWreq: sweat.SWreq, SWpre: sweat.SWpre, Epre: sweat.Epre }
        //trace     ) + branch_reset() )
        //trace }
    }

    function core_temp_pred_std(){
        var dStorage = sweat.Ereq - sweat.Epre + core.dStoreq;
        core.Tcr_1 = core.Tcr_0;

        var loop = 25;
        while (  loop > 0 ) {
            loop--;
            core.sk_cr_rel = 0.3 - 0.09 * (core.Tcr_1 - 36.8);
            if ( core.sk_cr_rel > 0.3 ) {  core.sk_cr_rel = 0.3; }
            if ( core.sk_cr_rel < 0.1 ) {  core.sk_cr_rel = 0.1; }
            core.Tcr = dStorage / body.spHeat + skin.Tsk_0 * core.sk_cr_rel_0 / 2 -
                skin.Tsk * core.sk_cr_rel / 2;
            core.Tcr = (core.Tcr + core.Tcr_0 * (1 - core.sk_cr_rel_0 / 2)) /
                (1 - core.sk_cr_rel / 2);
            if (Math.abs(core.Tcr - core.Tcr_1 ) > 0.001 ) { 
                core.Tcr_1 = (core.Tcr_1 + core.Tcr) / 2;
            }
            else{
                return;
            }
        }
        alert( 'core_temp_pred_std overun');
    }

    // part of body having Tcr as mean temperature
    function core_temp_pred_sk_cr_rel( Tcr ){
        if ( Tcr < 36.8 ) { return 0.3; }
        else if (Tcr > 39.0) { return 0.1; }
        else { return 0.3 - 0.091 * (Tcr - 36.8); }
    }

    function core_temp_pred_Tcr ( Tbm, Tcr_0, Tsk ){
        var Tcr = Tbm;
        var loop = 25;
        while (  loop > 0 ) {
            loop--;
            var sk_cr_rel_0_5 = core_temp_pred_sk_cr_rel( Tcr ) * 0.5;
            //Tbm_1 = Tcr * ( 1 - sk_cr_rel ) + (Tsk + Tcr)* 0.5 * sk_cr_rel;
            //Tbm_1 = Tcr  - Tcr * sk_cr_rel + Tsk * sk_cr_rel * 0.5 + Tcr * sk_cr_rel * 0.5;
            //Tbm_1 = Tcr( 1  - sk_cr_rel + sk_cr_rel * 0.5 ) + Tsk * sk_cr_rel * 0.5;
            //Tbm_1 = Tcr( 1 - sk_cr_rel * 0.5 ) + Tsk * sk_cr_rel * 0.5;
            Tbm_1 = Tcr * ( 1 - sk_cr_rel_0_5 ) + Tsk * sk_cr_rel_0_5;
            var diff = Tbm_1 - Tbm;
            if (Math.abs( diff ) > 0.001 ) {
                Tcr = Tcr - diff * 0.5;
            }
            else {
                return Tcr;
            }
        }
        //console.error( 'core_temp_pred overun' + sim_time + Tcr );
        return Tcr;
    }

    function core_temp_pred(){
        var dStorage = sweat.Ereq - sweat.Epre + core.dStoreq;
        var dTempStorage = dStorage / body.spHeat;
        body.Tbm = body.Tbm_0 + dTempStorage;
        var rv = core_temp_pred_Tcr ( body.Tbm, core.Tcr_0, skin.Tsk );
        core.Tcr = rv;
    }

    function rect_temp_pred(){
        var Tre0 = core.Trec_0;
        core.Trec = Tre0 + (2 * core.Tcr - 1.962 * Tre0 - 1.31) / 9;
        if ( ! limit.rec_temp && core.Trec >= 38 ) {
            limit.rec_temp = sim_time; }
    }

    function water_loss(){
        sweat.SW = sweat.SWpre + heatex.Eresp;
        sweat.SWtot = sweat.SWtot + sweat.SW;
        var k_to_g = 2.67 * body.Adu / 1.8 / 60;
        sweat.SWg = sweat.SW * k_to_g;
        sweat.SWtotg = sweat.SWtot * k_to_g;
        if (! limit.water_loss_max50 && sweat.SWtotg >= limit.sweat_max50 ) {
            limit.water_loss_max50 = sim_time;
        }
        if ( ! limit.water_loss_max95 && sweat.SWtotg >= limit.sweat_max95 ) {
            limit.water_loss_max95 = sim_time;
        }
    }

    function state(){
        return {
            time : sim_time,
            Tcreq : core.Tcreq_mr,
            Tsk : skin.Tsk,
            SWg : sweat.SWg,
            SWtotg : sweat.SWtotg,
            Tcr : core.Tcr,
            Tre : core.Trec,
            Tcl : cloth.Tcl,
            SW : sweat.SW,
            Epre : sweat.Epre,
            SWreq : sweat.SWreq,
            SWmax : sweat.SWmax
        };
    }

    function time_step(){
       
        sim_time++;
        body.Tbm_0 = body.Tbm;
        core.Trec_0 = core.Trec;
        core.Tcr_0 = core.Tcr;
        core.Tcreq_mr_0 = core.Tcreq_mr;
        core.sk_cr_rel_0 = core.sk_cr_rel;
        skin.Tsk_0 = skin.Tsk;

        step_core_temp_equi_mr();
        step_skin_temp();
        calc_dynamic_insulation();
        dynamic_convection_coefficient();
        clothing_temp();
        calc_heat_exchange();
        sweat_rate();
        if ( sim_mod === 1 || sim_mod === 2  ){ //  std core_temp_pred
            core_temp_pred_std();
        }
        else { //  modified core_temp_pred
            core_temp_pred();
        }
        rect_temp_pred();
        water_loss();

        return state();
    }

    function current_result(){
        return {
            time : sim_time,
            Tre : core.Trec,
            SWtotg : sweat.SWtotg,
            D_Tre : limit.rec_temp,
            Dwl50 : limit.water_loss_max50,
            Dwl95 : limit.water_loss_max95
        };
    }

    function sample_get(){
        var phs_data = {
            air : air,
            body : body,
            cloth : cloth,
            core : core,
            heatex : heatex,
            limit : limit,
            move : move,
            skin : skin,
            sweat : sweat
        };
        var vid = [
            'core:Tcreq_rm_ss', 'core:Tcreq_mr', 'core:dStoreq', 
            'skin:Tsk', 'skin:Pw_sk', 'move:v_air_rel',
            'cloth:CORcl', 'cloth:CORia', 'cloth:CORtot', 'cloth:Itot_dyn',
            'cloth:Icl_dyn', 'cloth:CORe', 'cloth:Rtdyn',
            'heatex:Hcdyn', 'cloth:fAcl_rad', 'cloth:Tcl', 'heatex:Hr',
            'heatex:Conv', 'heatex:Rad', 'sweat:Ereq', 'sweat:Emax',
            'skin:w_req', 'sweat:SWpre', 'skin:w_pre', 'sweat:Epre',
            'core:sk_cr_rel', 'core:Tcr', 'core:Trec',
            'sweat:SWtot', 'sweat:SWtotg'
            ];

        var res = {
            sim_time : sim_time,
            sim_mod : sim_mod
        };
        var idp;
        var tag;
        var val;

        vid.map( function(ai) {
            idp = ai.split( ':' );
            tag = idp.join( '_' );
            var val = phs_data;
            idp.map( function(id){val = val [ id ]; });
            res[ tag ] = val;
        } );

        return res;
    }

    // Reveal public pointers to 
    // private functions and properties
    return{
        reset : reset,
        sim_init : sim_init,
        state : state,
        time_step : time_step,
        current_result : current_result,
        sample_get : sample_get
    };
})();
