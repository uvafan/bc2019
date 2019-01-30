import {Unit} from 'unit.js';
import {SPECS} from 'battlecode';
import * as params from 'params.js';
export class Robot extends Unit{

    constructor(rc){
        super(rc);
        this.possibleMoves = this.getDxDyWithin(0,SPECS.UNITS[this.me.unit]['SPEED']);
        this.fuelPerMove = SPECS.UNITS[this.me.unit]['FUEL_PER_MOVE'];
        this.buildingChurch=false;
        this.splash = this.getDxDyWithin(0,2);
    }

    turn(rc){
        super.turn(rc);
        if((this.me.turn >= this.ranBFS + this.turnsBeforeBFS) && this.target){
            this.updateTarget(this.target);
        }
    }

    updateTarget(target){
        this.target=target;
        this.targetDists = this.runBFS(target,this.buildingChurch);
    }
    getUnsafeLocs(){
        var set1 = new Set();
        var enemies = this.rc.getVisibleRobots();
        for(var i =0; i < enemies.length;i++){
            var r = enemies[i];
            if(r.x == null || r.team==this.me.team || r.unit==null)
                continue;
            var attack_rad = SPECS.UNITS[r.unit]['ATTACK_RADIUS'];
            if(attack_rad == null)
                continue;
            var badSpots = this.getDxDyWithin(attack_rad[0], attack_rad[1]);
            for(var j = 0; j < badSpots.length; j++){
                var target = [r.x+badSpots[j][0],r.y+badSpots[j][1]];
                set1.add(this.getBroadcastFromLoc(target));

            }
        }
        return set1;

    }
    runBFS(start,oneAway){
        this.ranBFS = this.me.turn;
        var dist = [];
        var unsafeLocs = this.getUnsafeLocs();
        for(var x=0;x<this.mapSize;x++){
            dist.push([]);
            for(var y=0;y<this.mapSize;y++){
                dist[x].push(Number.MAX_SAFE_INTEGER);
            }
        }
        var q = [];
        //x,y,turns,fuel
        if(oneAway){
            for(var i=0;i<this.adjDiagMoves.length;i++){
                var x=start[0]+this.adjDiagMoves[i][0];
                var y=start[1]+this.adjDiagMoves[i][1];
                if(this.isWalkable(x,y) && !unsafeLocs.has(this.getBroadcastFromLoc([x,y]))){
                    q.push([x,y]);
                }
            }
        }
        else{
            q.push([start[0],start[1]]);
        }
        for(var i=0;i<q.length;i++){
            dist[q[i][0]][q[i][1]]=0;
        }
        var count=0;
        while(q.length>0){
            /*count++;
            if(count==1000)
                break;*/
            var u = q.shift();
            var x = u[0];
            var y = u[1];
            if(x==this.me.x&&y==this.me.y)
                break;
            //this.log('x '+x+' y '+y + ' d0 ' + dist[x][y]);
            var stop=false;
            for(var i=0;i<this.possibleMoves.length;i++){
                var move = this.possibleMoves[i];
                var nx = x+move[0];
                var ny = y+move[1];
                if(nx==this.me.x&&ny==this.me.y){
                    dist[nx][ny]=dist[x][y]+1;
                    this.turnsBeforeBFS = Math.min(Math.max(10,dist[nx][ny]),50);
                    stop=true;
                    break;
                }
                if(!this.isWalkable(nx,ny)|| unsafeLocs.has(this.getBroadcastFromLoc([x,y])) ||dist[nx][ny]<=dist[x][y]+1)
                    continue;
                dist[nx][ny]=dist[x][y]+1;
                q.push([nx,ny]);
            }
            if(stop)
                break;
        }
        return dist;
    }



    //weights: [movement,fuel efficiency,splash resistance]
    navTo(dists,dest,weights,safe,standOn){
        var bestMove = null;
        var bestScore = Number.MIN_SAFE_INTEGER;
        for(var i=0;i<this.possibleMoves.length;i++){
            var move = this.possibleMoves[i];
            var nx = this.me.x+move[0];
            var ny = this.me.y+move[1];
            if(!this.isWalkable(nx,ny)||(safe&&!this.isSafe(nx,ny)))
                continue;
            var fuelUsed = (move[0]*move[0]+move[1]*move[1])*this.fuelPerMove
            if(fuelUsed>this.rc.fuel)
                continue;
            var turnsSaved = dists[this.me.x][this.me.y]-dists[nx][ny];
            var distRem = this.manhattan(nx,ny,dest[0],dest[1]);
            if(distRem==0&&!standOn)
                continue;
            var movementScore = turnsSaved*10-distRem;
            var splashBadness = this.getSplashBadness(nx,ny);
            var score = movementScore*weights[0]-fuelUsed*weights[1]-splashBadness*weights[2];
            if(move[0]==0&&move[1]==0)
                score-=params.STOP_PENALTY;
            if(score>bestScore){
                bestScore=score;
                bestMove=move;
            }
        }
        //this.log(weights);
        //this.log(this.me.x+' '+this.me.y);
        //this.log(bestMove);
        if(bestMove && (bestMove[0]!=0 || bestMove[1]!=0))
            return this.rc.move(...bestMove);
        return null;
    }

    getSplashBadness(x,y){
        var badness=0;
        for(var i=0;i<this.splash.length;i++){
            var off = this.splash[i];
            var nx=x+off[0];
            var ny=y+off[1];
            if(this.offMap(nx,ny))
                continue;
            var rid = this.visRobotMap[ny][nx];
            if(rid>0&&rid!=this.me.id){
                var r = this.rc.getRobot(rid);
                if(r.team==this.me.team)
                    badness++;
            }
        }
        return badness;
    }

    giveBack(toward){
        var visRobots = this.rc.getVisibleRobots();
        var minDist = Number.MAX_SAFE_INTEGER;
        var dx=0;
        var dy=0;
        for(var i=0;i<visRobots.length;i++){
            var r=visRobots[i];
            if(r.team==this.me.team&&(r.x!=null)&&r.unit!=SPECS['PILGRIM']){
                var d = this.distBtwnP(r.x,r.y,this.me.x,this.me.y);
                var d2 = this.distBtwnP(toward[0],toward[1],r.x,r.y);
                if(d<=2&&(d2==0||this.me.unit!=SPECS['PILGRIM']||this.hasChain(r.x,r.y,toward[0],toward[1]))){
                    if(d2<minDist){
                        minDist=d2;
                        dx=r.x-this.me.x;
                        dy=r.y-this.me.y;
                    }
                }
            }
        }
        if(dy||dx)
            return this.rc.give(dx,dy,this.me.karbonite,this.me.fuel);
        //this.log('cant give');
        return null;
    }

    hasChain(x0,y0,x1,y1){
        var dist = [];
        for(var x=0;x<this.mapSize;x++){
            dist.push([]);
            for(var y=0;y<this.mapSize;y++){
                dist[x].push(Number.MAX_SAFE_INTEGER);
            }
        }
        var q = [];
        q.push([x0,y0]);
        for(var i=0;i<q.length;i++){
            dist[q[i][0]][q[i][1]]=0;
        }
        var count=0;
        while(q.length>0){
            /*count++;
            if(count==1000)
                break;*/
            var u = q.shift();
            var x = u[0];
            var y = u[1];
            //this.log('x '+x+' y '+y + ' d0 ' + dist[x][y]);
            for(var i=0;i<this.adjDiagMoves.length;i++){
                var move = this.adjDiagMoves[i];
                var nx = x+move[0];
                var ny = y+move[1];
                if(nx==x1&&ny==y1)
                    return true;
                if(!this.isPassable(nx,ny)||dist[nx][ny]<=dist[x][y]+1)
                    continue;
                if(this.visRobotMap[ny][nx]<1)
                    continue;
                var r = this.rc.getRobot(this.visRobotMap[ny][nx]);
                if(r.team!=this.me.team||r.unit==SPECS['PILGRIM'])
                    continue;
                dist[nx][ny]=dist[x][y]+1;
                q.push([nx,ny]);
            }
        }
        return false;
    }

}
