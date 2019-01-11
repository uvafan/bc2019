import {Unit} from 'unit.js';
import {SPECS} from 'battlecode'; 
import * as params from 'params.js';
export class Robot extends Unit{

    constructor(rc){
        super(rc);
        this.possibleMoves = this.getPossibleMoves();
        this.fuelPerMove = SPECS.UNITS[this.me.unit]['FUEL_PER_MOVE'];
    }
    
    getPossibleMoves(){
        var maxMove = SPECS.UNITS[this.me.unit]['SPEED'];
        var ret = [];
        for(var dx=0;dx*dx<=maxMove;dx++){
            for(var dy=0;dy*dy<=maxMove;dy++){
                if(dx==0&&dy==0)
                    continue;
                if(dx*dx+dy*dy<=maxMove){
                    ret.push([dx,dy]);
                    ret.push([-dx,-dy]);
                    if(dx!=0){
                        ret.push([-dx,dy]);
                    }
                    if(dy!=0){
                        ret.push([dx,-dy]);
                    }
                }
            }
        }
        return ret;
    }

    //weights: how much to weight turns saved vs. fuel efficiency
    navTo(target,weights,safe){
        var best = [];
        for(var x=0;x<this.mapSize;x++){
            best.push([]);
            for(var y=0;y<this.mapSize;y++){
                best[x].push(Number.MAX_SAFE_INTEGER);
            }
        }
        var q = [];
        //x,y,turns,fuel
        q.push([target[0],target[1]]);
        best[target[0]][target[1]]=0;
        var th = this;
        var count=0;
        while(q.length>0){
            /*count++;
            if(count==1000)
                break;*/
            var u = q.shift();
            var x = u[0];
            var y = u[1];
            //this.log('x '+x+' y '+y + ' b0 ' + best[x][y]);
            this.adjMoves.forEach(function(move){
                var nx = x+move[0];
                var ny = y+move[1];
                if(!th.isPassable(nx,ny)||best[nx][ny]<=best[x][y]+1)
                    return;
                best[nx][ny]=best[x][y]+1;
                q.push([nx,ny]);
            });
        }
        var bestMove = null;
        var bestScore = Number.MIN_SAFE_INTEGER;
        this.possibleMoves.forEach(function(move){
            var nx = th.me.x+move[0];
            var ny = th.me.y+move[1];
            if(!th.isWalkable(nx,ny)||!th.isSafe(nx,ny))
                return;
            var fuelUsed = (move[0]*move[0]+move[1]*move[1])*th.fuelPerMove
            if(fuelUsed>th.rc.fuel)
                return;
            var turnsSaved = best[th.me.x][th.me.y]-best[nx][ny];
            var score = turnsSaved*weights[0]-fuelUsed*weights[1];
            if(score>bestScore){
                bestScore=score;
                bestMove=move;
            }
        });
        //this.log(weights);
        //this.log(bestMove);
        if(bestMove && (bestMove[0]!=0 || bestMove[1]!=0))
            return this.rc.move(...bestMove);
        return null;
    }

}
