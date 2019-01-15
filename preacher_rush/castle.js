import {SPECS} from 'battlecode'; 
import {Structure} from 'structure.js';
import * as objectives from 'objective.js';
import * as strategies from 'strategy.js';
import * as params from 'params.js';

export class Castle extends Structure{
    constructor(rc){
        super(rc);
        this.otherCastleLocsInitial = {};
        this.enemyCastleLocs = [];
        this.otherCastleLocs = [];
        this.enemyCastleLocs.push(this.reflect(this.me.x,this.me.y));
        this.objectives = [];
        this.lastObjIdx = -1;
        this.lastIds = [];
        this.initializeAttackObjectives();
        this.initializeDefenseObjectives();
        this.initializeMiningObjectives();
        this.getInitialStrategy();
    }

    turn(rc){
        super.turn(rc);
        this.processCastleTalk();
        this.updateObjectives();
        var obj = this.getHighestPriorityObjective();
        var info = this.getUnitTargetAndBroadcast(obj);
        var build = this.buildUnit(info[0],info[1],info[2]);
        if(build&&info[0]==SPECS['PILGRIM']){
            var newObj = new objectives.defendPilgrim(2,this.me.turn,this);
            this.objectives.push(newObj);
        }
        return build;
    }

    getUnitTargetAndBroadcast(obj){
        var unit = obj.unitNeeded(this.strat);
        var target = obj.target;
        var broadcast = this.getBroadcast(obj);
        return [unit,target,broadcast];
    }

    getBroadcast(obj){
        var offset = (this.me.turn%4)<<14;
        if(obj.type<2){
            return this.getBroadcastFromLoc(obj.target)+offset;
        }
        else if(obj.type==2){
            return this.getBroadcastFromLoc(obj.target)+(1<<12)+offset;
        }
        else if(obj.type==3){
            var oppCastleAlive = this.locsEqual(this.enemyCastleLocs[0],this.reflect(this.me.x,this.me.y));
            var oppAliveOffset = (oppCastleAlive?0:(1<<13));
            if(this.enemyCastleLocs.length>1)
                return this.getBroadcastFromLoc(this.enemyCastleLocs[1])+offset+oppAliveOffset;
            else
                return this.getBroadcastFromLoc(this.enemyCastleLocs[0])+offset+oppAliveOffset;
        }
        else if(obj.type==4){
            return this.me.turn+(1<<12)+(1<<13)+offset;
        }
    }

    updateObjectives(){
        for(var i=0;i<this.objectives.length;i++){
            this.objectives[i].round++;
        }
    }

    getHighestPriorityObjective(){
        var ret=null;
        var highestP = Number.MIN_SAFE_INTEGER;
        for(var i=0;i<this.objectives.length;i++){
            var obj=this.objectives[i];
            var p = obj.getPriority(this.strat,this.rc.karbonite,this.rc.fuel);
            //this.log(obj.objInfo()+' p: '+p);
            if(p>highestP){
                this.lastObjIdx = i;
                ret=obj;
                highestP=p;
            }
        }
        this.log(ret.objInfo()+' p:'+highestP);
        return ret;
    }

    getInitialStrategy(){
        this.strat = new strategies.preacherRush(this);
    }

    initializeAttackObjectives(){
        var ecl = this.enemyCastleLocs[0];
        var obj = new objectives.attackEnemy(this.me.turn,ecl,this,this.manhattan(this.me.x,this.me.y,ecl[0],ecl[1]));
        this.objectives.push(obj);
    }

    initializeDefenseObjectives(){
        var obj = new objectives.defendCastle(this.me.turn,[this.me.x,this.me.y],this,this.manhattan(this.me.x,this.me.y,this.enemyCastleLocs[0][0],this.enemyCastleLocs[0][1]));
        this.objectives.push(obj);
    }

    initializeMiningObjectives(){
        var dist = [];
        for(var x=0;x<this.mapSize;x++){
            dist.push([]);
            for(var y=0;y<this.mapSize;y++){
                dist[x].push(-1);
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
                if(!this.isPassable(nx,ny)||dist[nx][ny]>-1)
                    continue;
                //this.log(nx+' '+ny);
                if(this.rc.karbonite_map[ny][nx]||this.rc.fuel_map[ny][nx]){
                    var dfe = this.getDistToOtherCastle(nx,ny);
                    var myDist = this.manhattan(nx,ny,this.me.x,this.me.y);
                    var type = this.rc.karbonite_map[ny][nx]?0:1;
                    if(myDist<dfe){
                        if(type==0)
                            var obj = new objectives.gatherKarb(this.me.turn,[nx,ny],this,myDist);
                        else
                            var obj = new objectives.gatherFuel(this.me.turn,[nx,ny],this,myDist);
                        this.objectives.push(obj);
                    }
                }
                dist[nx][ny]=dist[x][y]+1;
                q.push([nx,ny]);
            }
        }
    }

    getDistToOtherCastle(x,y){
        var minDist = Number.MAX_SAFE_INTEGER;
        for(var i=0;i<this.enemyCastleLocs.length;i++){
            var dist = this.manhattan(x,y,this.enemyCastleLocs[i][0],this.enemyCastleLocs[i][1]);
            if(dist<minDist)
                minDist=dist;
        }
        for(var i=0;i<this.otherCastleLocs.length;i++){
            var dist = this.manhattan(x,y,this.otherCastleLocs[i][0],this.otherCastleLocs[i][1]);
            //this.log('td '+dist);
            if(dist<minDist)
                minDist=dist;
        }
        return minDist;
    }

    //called only on turn 3
    updateMiningObjectives(){
        var newObjs=[];
        for(var i=0;i<this.objectives.length;i++){
            var obj = this.objectives[i];
            if(obj.type>1){
                newObjs.push(obj);
            }
            else{
                var d = this.getDistToOtherCastle(obj.target[0],obj.target[1]);
                //this.log('d '+d+' dfm '+obj.distFromMe);
                if(d>obj.distFromMe){
                    newObjs.push(obj);
                }
            }
        }
        this.objectives=newObjs;
    }

    processCastleTalk(){
        if(this.me.turn%4==0){
            this.unitCounts = [0,0,0,0,0,0];
        }
        var visRobots = this.rc.getVisibleRobots();
        var ids = [];
        for(var i=0;i<visRobots.length;i++){
            var r = visRobots[i];
            if(r.castle_talk != null && (r.team==null || r.team==this.me.team) && r.castle_talk<10){
                if(this.me.turn%4==0){
                    this.unitCounts[r.castle_talk-1]++;
                }
                else if(this.me.turn%4==1&&r.castle_talk>0){
                    if(this.objectives[0].processFoundDead(r.id,this.enemyCastleLocs)){
                        this.enemyCastleLocs.shift();
                    }
                }
                ids.push(r.id);
                if(r.x != null && r.unit != SPECS['CASTLE']){
                    if(!this.lastIds.includes(r.id) && this.distBtwnP(r.x,r.y,this.me.x,this.me.y)<=16){ 
                        this.objectives[this.lastObjIdx].assign(r.id,r.unit);
                    }
                }
            }
        }
        if(this.me.turn%4==0){
            this.strat.updateUnitCounts(this.unitCounts);
        }
        this.lastIds = ids;
        for(var i=0;i<this.objectives.length;i++){
            this.objectives[i].updateAssignees(ids);
        }
        if(this.me.turn<4){
            this.castleTalkFirst3();
        }
    }

    castleTalkFirst3(){
        if(this.me.turn==1)
            this.rc.castleTalk(this.me.x+10);
        if(this.me.turn==2)
            this.rc.castleTalk(this.me.y+10);
        var visRobots = this.rc.getVisibleRobots();
        var th=this;
        visRobots.forEach(function(r){
            if(r.castle_talk != null && r.castle_talk>0 && (r.team==null || r.team==th.me.team) && r.id!=th.me.id && r.castle_talk>9){
                if(!(r.id in th.otherCastleLocsInitial)){
                    th.otherCastleLocsInitial[r.id] = [r.castle_talk-10,-1];
                }
                else{
                    th.otherCastleLocsInitial[r.id][1] = r.castle_talk-10;
                }
            }
        });
        if(this.me.turn==3){
            for(var key in this.otherCastleLocsInitial){
                var loc = this.otherCastleLocsInitial[key];
                //this.log('loc = '+loc);
                this.otherCastleLocs.push(loc);
                this.enemyCastleLocs.push(this.reflect(loc[0],loc[1]));
            }
            this.updateMiningObjectives();
        }
    }

    /*
    initializeMiningClaims(){
        this.miningClaims = [];
        for(var x=0;x<this.mapSize;x++){
            this.miningClaims.push([]);
            for(var y=0;y<this.mapSize;y++){
                this.miningClaims[x].push(0);
            }
        }
    }*/

}
