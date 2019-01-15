import {Unit} from 'unit.js';
import {SPECS} from 'battlecode'; 
import * as params from 'params.js';
export class Structure extends Unit{

    buildUnit(unit,target,broadcast){
        var ret=null;
        if (this.rc.karbonite>=SPECS.UNITS[unit].CONSTRUCTION_KARBONITE && 
            this.rc.fuel>SPECS.UNITS[unit].CONSTRUCTION_FUEL+1) {
            var th=this;
            var bestScore = Number.MIN_SAFE_INTEGER;
            var bestMove = null;
            this.adjDiagMoves.forEach(function(move){
                var nx = th.me.x+move[0];
                var ny = th.me.y+move[1];
                if(th.isWalkable(nx,ny)){
                    var d = th.distBtwnP(nx,ny,target[0],target[1]);
                    var score = -d-(move[0]*move[0]+move[1]*move[1])*3;
                    if(score>bestScore){
                        bestScore=score;
                        bestMove=move;
                    }
                }
            });
            if(bestMove){
                this.rc.signal(broadcast,bestMove[0]*bestMove[0]+bestMove[1]*bestMove[1]);
                //this.log('signaling '+broadcast);
                ret = this.rc.buildUnit(unit,bestMove[0],bestMove[1]);
            }
        } 
        return ret; 

    }

}
