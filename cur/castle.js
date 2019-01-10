import {SPECS} from 'battlecode'; 
import {Structure} from 'structure.js';
import * as params from 'params.js';

export class Castle extends Structure{
    constructor(rc){
        super(rc);
        this.otherCastleLocsInitial = {};
        this.enemyCastleLocs = [];
        this.enemyCastleLocs.push(this.reflect(this.me.x,this.me.y));
        this.desiredUnitComp = params.BALANCED_UNIT_COMP;
        this.initializeMiningClaims();
    }

    turn(rc){
        super.turn(rc);
        this.processCastleTalk();
        var unit = this.determineUnitNeeded();
        var info = this.getTargetAndBroadcast(unit);
        var build = this.buildUnit(unit,info[0],info[1]);
        if(build){
            this.miningClaims[info[0][0]][info[0][1]]=1;
        }
        return build;
    }

    initializeMiningClaims(){
        this.miningClaims = [];
        for(var x=0;x<this.mapSize;x++){
            this.miningClaims.push([]);
            for(var y=0;y<this.mapSize;y++){
                this.miningClaims[x].push(0);
            }
        }
    }

    getNextMiningLoc(){
        var vis = [];
        for(var x=0;x<this.mapSize;x++){
            vis.push([]);
            for(var y=0;y<this.mapSize;y++){
                vis[x].push(0);
            }
        }
        var q = [[this.me.x,this.me.y]];
        while(q.length>0){
            var u = q.shift();
            var x = u[0];
            var y = u[1];
            for(var i=0;i<4;i++){
                var move = this.adjMoves[i];
                var nx=x+move[0];
                var ny=y+move[1];
                if(!this.isPassable(nx,ny)||vis[nx][ny])
                    continue;
                //this.log(nx+' '+ny);
                if(this.rc.karbonite_map[ny][nx]&&!this.miningClaims[nx][ny]){
                    return [nx,ny];
                }
                vis[nx][ny]=1;
                q.push([nx,ny]);
            }
        }
    }

    getTargetAndBroadcast(unit){
        if(unit==SPECS['PILGRIM']){
            var target = this.getNextMiningLoc();
            //this.log('t '+target);
            return [target,this.getBroadcastFromLoc(target)];
        }
        return [this.enemyCastleLocs[0],this.getBroadcastFromLoc(this.enemyCastleLocs[0])];
    }

    determineUnitNeeded(){
        if(this.me.turn==1)
            return SPECS['PILGRIM'];
        else if(this.me.turn<4)
            return SPECS['CRUSADER'];
        else{
            //this.log(this.unitCounts);
            //this.log(this.desiredUnitComp);
            var bestUnit = -1;
            var bestRatio = Number.MAX_SAFE_INTEGER;
            for(var i=0;i<6;i++){
                if(this.desiredUnitComp[i]==0)
                    continue;
                var ratio = this.unitCounts[i]/this.desiredUnitComp[i];
                //this.log('i '+i+' ratio '+ratio);
                if(ratio<bestRatio){
                    bestRatio=ratio;
                    bestUnit=i;
                }
            }
           // this.log('bestUnit '+bestUnit);
            return bestUnit;
        }
    }

    processCastleTalk(){
        if(this.me.turn<4){
            this.castleTalkFirst3();
            return;
        }
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

    castleTalkFirst3(){
        if(this.me.turn==1)
            this.rc.castleTalk(this.me.x+1);
        if(this.me.turn==2)
            this.rc.castleTalk(this.me.y+1);
        var visRobots = this.rc.getVisibleRobots();
        var th=this;
        visRobots.forEach(function(r){
            if(r.castle_talk != null && r.castle_talk>0 && (r.team==null || r.team==th.me.team) && r.id!=th.me.id){
                if(!(r.id in th.otherCastleLocsInitial)){
                    th.otherCastleLocsInitial[r.id] = [r.castle_talk-1,-1];
                }
                else{
                    th.otherCastleLocsInitial[r.id][1] = r.castle_talk-1;
                }
            }
        });
        if(this.me.turn==3){
            this.otherCastleLocs = [];
            for(var key in this.otherCastleLocsInitial){
                var loc = this.otherCastleLocsInitial[key];
                this.otherCastleLocs.push(loc);
                this.enemyCastleLocs.push(this.reflect(loc[0],loc[1]));
            }
        }
    }

}
