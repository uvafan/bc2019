import {SPECS} from 'battlecode';
import {Robot} from 'myrobot.js';
import * as params from 'params.js';

export class Pilgrim extends Robot{
    constructor(rc){
        super(rc);
        this.buildingChurch=false;
        this.getFirstTarget();
        //this.structDists = this.runBFS(this.structLoc,true);
        this.locToMine = null;
    }

    turn(rc){
        super.turn(rc);
        this.karbNeeded = (this.rc.karbonite*params.FUEL_KARB_RATIO<this.rc.fuel?1:0);
        if(this.me.turn%10==5)
            this.structDists = this.runBFS(this.structLoc,true);
        if(this.buildingChurch){
            this.log('trying to bc at '+this.target);
            var distToT = this.distBtwnP(this.target[0],this.target[1],this.me.x,this.me.y);
            if(distToT<=2){
                if(this.shouldBuildChurch()){
                    var build = this.buildChurch();
                    var locToMine = this.getFirstMiningLoc();
                    this.updateTarget(locToMine);
                    if(build){
                        //this.log('gonna mine '+locToMine);
                        this.churchBuilt=true;
                        this.buildingChurch=false;
                    }
                    return build;
                }
                else{
                    if(!this.locToMine||this.isPartiallyFull()){
                        this.locToMine = this.getWaitingMiningLoc();
                        if(this.locToMine)
                            this.mineDists = this.runBFS(this.locToMine,false);
                    }
                    if(this.locToMine&&this.rc.fuel>0&&this.locsEqual(this.locToMine,[this.me.x,this.me.y])&&!this.isFullyFull()){
                        return this.rc.mine();
                    }
                    else if(this.locToMine){
                        return this.navTo(this.mineDists,this.locToMine,params.PILGRIM_NAV_WEIGHTS,true,true);
                    }
                }
            }
            else{
                return this.navTo(this.targetDists,this.target,params.PILGRIM_NAV_WEIGHTS,true,false);
            }
        }
        else if(this.isFull()){
            var giveToDefenseUnit = this.giveBack(this.structLoc);
            if(giveToDefenseUnit)
                return giveToDefenseUnit;
            return this.navTo(this.structDists,this.structLoc,params.PILGRIM_NAV_WEIGHTS,true,true);
        }
        else if(this.me.x==this.target[0]&&this.me.y==this.target[1]&&this.rc.fuel>0){
            return this.rc.mine();
        }
        else{
            return this.navTo(this.targetDists,this.target,params.PILGRIM_NAV_WEIGHTS,true,true);
        }
        return null;
    }

    shouldBuildChurch(){
        var karbSave = params.MIN_KARB_SAVE;
        var fuelSave = params.MIN_FUEL_SAVE;
        var karbLeft = this.rc.karbonite-SPECS.UNITS[SPECS['CHURCH']].CONSTRUCTION_KARBONITE;
        var fuelLeft = this.rc.fuel-SPECS.UNITS[SPECS['CHURCH']].CONSTRUCTION_FUEL;
        var enemiesInSight = this.getEnemiesInSight();
        if(enemiesInSight.length>0){
            karbSave=0;
            fuelSave=2;
        }
        return karbLeft>=karbSave && fuelLeft >= fuelSave;
    }

    buildChurch(){
        var minDist = Number.MAX_SAFE_INTEGER;
        var theirOffset = (this.me.turn%2==0?1-this.offset:this.offset);
        var dial = this.getClosestDial(this.me.turn+this.createdTurn);
        var cast = this.getBroadcastFromLoc(this.structLoc)+(this.karbNeeded<<15)+(dial<<12);
        for(var i=0;i<this.adjDiagMoves.length;i++){
            var nx=this.me.x+this.adjDiagMoves[i][0];
            var ny=this.me.y+this.adjDiagMoves[i][1];
            if(this.isWalkable(nx,ny)&&this.distBtwnP(nx,ny,this.target[0],this.target[1])<minDist&&!this.rc.karbonite_map[ny][nx]&&!this.rc.fuel_map[ny][nx]){
                this.structLoc = [nx,ny];
                minDist=this.distBtwnP(nx,ny,this.target[0],this.target[1]);
            }
        }
        var dx = this.structLoc[0]-this.me.x;
        var dy = this.structLoc[1]-this.me.y;
        this.rc.signal(cast,dx*dx+dy*dy);
        this.structDists = this.runBFS(this.structLoc,true);
        return this.rc.buildUnit(SPECS['CHURCH'],dx,dy);
    }

    getFirstMiningLoc(){
        var dist = [];
        for(var x=0;x<this.mapSize;x++){
            dist.push([]);
            for(var y=0;y<this.mapSize;y++){
                dist[x].push(-1);
            }
        }
        var q = [[this.structLoc[0],this.structLoc[1]]];
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
                if(this.karbNeeded?this.rc.karbonite_map[ny][nx]:this.rc.fuel_map[ny][nx]){
                    return [nx,ny];
                }
                dist[nx][ny]=dist[x][y]+1;
                q.push([nx,ny]);
            }
        }
    }

    getWaitingMiningLoc(){
        var karbPreferred = this.karbNeeded;
        var karbFull = this.isKarbFull();
        var fuelFull = this.isFuelFull();
        var ret = null;
        var bestScore = Number.MIN_SAFE_INTEGER;
        for(var i=0;i<8;i++){
            var offset = this.adjDiagMoves[i];
            var loc = [this.target[0]+offset[0],this.target[1]+offset[1]];
            if(this.isPassable(loc[0],loc[1])){
                var score = Number.MIN_SAFE_INTEGER;
                if(this.rc.karbonite_map[loc[1]][loc[0]]){
                    if(!karbFull){
                        score = (karbPreferred?100:0)-this.distBtwnP(this.me.x,this.me.y,loc[0],loc[1]);
                    }
                }
                else if(this.rc.fuel_map[loc[1]][loc[0]]){
                    if(!fuelFull){
                        score = (karbPreferred?0:100)-this.distBtwnP(this.me.x,this.me.y,loc[0],loc[1]);
                    }
                }
                if(score>bestScore){
                    bestScore=score;
                    ret=loc;
                }
            }
        }
        return ret;
    }

    getFirstTarget(){
        var visRobots = this.rc.getVisibleRobots();
        for(var i=0;i<visRobots.length;i++){
            var r = visRobots[i];
            if(r.team==this.me.team&&this.distBtwnP(r.x,r.y,this.me.x,this.me.y)<=2&&(r.unit==SPECS['CASTLE']||r.unit==SPECS['CHURCH'])){
                this.offset = r.signal>>15;
                var now = (r.signal&((1<<15)-1));
                var turnDial = now>>12;
                this.createdTurn = params.PILGRIM_TURN_ARRAY[turnDial];
                var locb = (now&((1<<12)-1));
                //this.log(locb);
                this.structLoc = [r.x,r.y];
                this.eloc = this.reflect(r.x,r.y);
                var target = this.getLocFromBroadcast(locb);
                this.log('my target is '+target+' from broadcast '+locb);
                this.updateTarget(this.getLocFromBroadcast(locb));
                if(!this.rc.karbonite_map[this.target[1]][this.target[0]]&&!this.rc.fuel_map[this.target[1]][this.target[0]]/*this.distBtwnP(this.structLoc[0],this.structLoc[1],this.target[0],this.target[1])>params.MINING_DISTANCE*/){
                    this.buildingChurch=true;
                }
            }
        }
        //this.log('T '+this.target);
        //this.log('SL '+this.structLoc);
    }

    isFull(){
        return this.me.fuel==SPECS.UNITS[this.me.unit]['FUEL_CAPACITY'] ||
               this.me.karbonite==SPECS.UNITS[this.me.unit]['KARBONITE_CAPACITY'];
    }

    isPartiallyFull(){
        return this.me.fuel==SPECS.UNITS[this.me.unit]['FUEL_CAPACITY'] &&
               this.me.karbonite<SPECS.UNITS[this.me.unit]['KARBONITE_CAPACITY'] ||
               this.me.fuel<SPECS.UNITS[this.me.unit]['FUEL_CAPACITY'] &&
               this.me.karbonite==SPECS.UNITS[this.me.unit]['KARBONITE_CAPACITY'];

    }

    isKarbFull(){
        return this.me.karbonite==SPECS.UNITS[this.me.unit]['KARBONITE_CAPACITY'];
    }

    isFuelFull(){
        return this.me.fuel==SPECS.UNITS[this.me.unit]['FUEL_CAPACITY'];
    }

    isFullyFull(){
        return this.me.fuel==SPECS.UNITS[this.me.unit]['FUEL_CAPACITY'] &&
               this.me.karbonite==SPECS.UNITS[this.me.unit]['KARBONITE_CAPACITY'];
    }

}
