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

    //urgency = 1 if urgent (prioritize movement), 0 if not (priotize fuel efficiency)
    navTo(target,urgency){
        var best = [];
        for(var x=0;x<this.mapSize;x++){
            best.push([]);
            for(var y=0;y<this.mapSize;y++){
                best[x].push([Number.MAX_SAFE_INTEGER,Number.MAX_SAFE_INTEGER]);
            }
        }
        var q = [];
        //x,y,turns,fuel
        q.push([target[0],target[1],0,0]);
        var th = this;
        //var count=0;
        while(q.length>0){
            //count++;
            //if(count==1000)
            //    break;
            var u = q.shift();
            var x = u[0];
            var y = u[1];
            if(urgency==1&&u[2]>=best[x][y][0] || urgency==0&&u[3]>=best[x][y][1]){
                continue;
            }
            //this.log('x '+x+' y '+y + ' t '+ u[2] + ' f ' + u[3] + ' b0 ' + best[x][y][0] + ' b1 '+best[x][y][1] + ' urgency '+urgency);
            best[x][y] = [u[2],u[3]];
            this.possibleMoves.forEach(function(move){
                var nx = x+move[0];
                var ny = y+move[1];
                if(th.offMap(nx,ny) || !th.rc.map[ny][nx])
                    return;
                var fuelUsed = (move[0]*move[0]+move[1]*move[1])*th.fuelPerMove;
                q.push([nx,ny,u[2]+1,u[3]+fuelUsed]);
            });
        }
        var bestMove = null;
        var bestScore = Number.MIN_SAFE_INTEGER;
        this.possibleMoves.forEach(function(move){
            var nx = th.me.x+move[0];
            var ny = th.me.y+move[1];
            if(th.offMap(nx,ny)||!th.rc.map[ny][nx])
                return;
            var score;
            var fuelUsed = (move[0]*move[0]+move[1]*move[1])*th.fuelPerMove
            if(fuelUsed>th.rc.fuel)
                return;
            switch(urgency){
                case 1: score=-best[nx][ny][0]; break;
                case 0: score=-best[nx][ny][1]-fuelUsed;
            }
            if(score>bestScore){
                bestScore=score;
                bestMove=move;
            }
        });
        if(bestMove)
            return this.rc.move(...bestMove);
        return null;
    }

}
