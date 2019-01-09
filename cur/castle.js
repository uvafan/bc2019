import {SPECS} from 'battlecode'; 
import {Structure} from 'structure.js';
import * as params from 'params.js';

export class Castle extends Structure{
    turn(rc){
        super.turn(rc);
        this.processCastleTalk();
        var ret=null;
        if (this.rc.karbonite>=SPECS.UNITS[SPECS.CRUSADER].CONSTRUCTION_KARBONITE && 
            this.rc.fuel>=SPECS.UNITS[SPECS.CRUSADER].CONSTRUCTION_FUEL) {
            var th=this;
            this.adjDiagMoves.forEach(function(move){
                var nx = th.me.x+move[0];
                var ny = th.me.y+move[1];
                if(th.isWalkable(nx,ny)){
                    ret=th.rc.buildUnit(SPECS.CRUSADER, move[0], move[1]);
                }
            });
        } 
        return ret;
    }

    processCastleTalk(){
        this.unitCounts = [0,0,0,0,0,0];
        var visRobots = this.rc.getVisibleRobots();
        var th=this;
        visRobots.forEach(function(r){
            if(r.castle_talk != null && r.castle_talk>0 && (r.team==null || r.team==th.me.team)){
                //th.log(r.id+' '+r.castle_talk);
                th.unitCounts[r.castle_talk-1]++;
            }
        });
        //this.log(this.me.turn+' '+this.unitCounts);
    }
}
