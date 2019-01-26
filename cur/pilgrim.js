import {SPECS} from 'battlecode'; 
import {Robot} from 'myrobot.js';
import * as params from 'params.js';

export class Pilgrim extends Robot{
    constructor(rc){
        super(rc);
        this.buildingChurch=false;
        this.getFirstTarget();
        this.structDists = this.runBFS(this.structLoc,true);
    }

    turn(rc){
        super.turn(rc);
        if(this.me.turn%10==0)
            this.structDists = this.runBFS(this.structLoc,true);
        if(this.buildingChurch){
            //this.log('trying to bc at '+this.target[0]+' '+this.target[1]);
            if(this.distBtwnP(this.target[0],this.target[1],this.me.x,this.me.y)<=2){
                if(this.rc.karbonite>=SPECS.UNITS[SPECS['CHURCH']].CONSTRUCTION_KARBONITE&&this.rc.fuel>SPECS.UNITS[SPECS['CHURCH']].CONSTRUCTION_FUEL+1){
                    //this.log('x '+this.me.x+' y '+this.me.y+' t '+this.target);
                    this.buildingChurch=false;
                    var build = this.buildChurch();
                    var locToMine = this.getFirstMiningLoc();
                    this.updateTarget(locToMine);
                    if(build)
                        this.churchBuilt=true;
                    return build;
                }
            }
            else{
                return this.navTo(this.targetDists,this.target,params.PILGRIM_NAV_WEIGHTS,true,false);
            }
        }
        else if(this.isFull()){
            if(this.distBtwnP(this.structLoc[0],this.structLoc[1],this.me.x,this.me.y)<=2){
                //this.log('x '+this.me.x+' y '+this.me.y+' t '+this.target);
                return this.rc.give(this.structLoc[0]-this.me.x,this.structLoc[1]-this.me.y,this.me.karbonite,this.me.fuel);
            }
            else{
                var giveToDefenseUnit = this.giveBack(this.structLoc);
                if(giveToDefenseUnit)
                    return giveToDefenseUnit;
                return this.navTo(this.structDists,this.structLoc,params.PILGRIM_NAV_WEIGHTS,true,true);
            }
        }
        else if(this.me.x==this.target[0]&&this.me.y==this.target[1]&&this.rc.fuel>0){
            return this.rc.mine();
        }
        else{
            return this.navTo(this.targetDists,this.target,params.PILGRIM_NAV_WEIGHTS,true,true);
        }
    }

    buildChurch(){
        var minDist = Number.MAX_SAFE_INTEGER;
        var theirOffset = (this.me.turn%2==0?1-this.offset:this.offset);
        var dial = this.getClosestDial(this.me.turn+this.createdTurn);
        var cast = this.getBroadcastFromLoc(this.structLoc)+(theirOffset<<15)+(dial<<12);
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
                if(this.rc.karbonite_map[ny][nx]||this.rc.fuel_map[ny][nx]){
                    //this.log(nx+' '+ny);
                    return [nx,ny];
                }
                dist[nx][ny]=dist[x][y]+1;
                q.push([nx,ny]);
            }
        }
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

}
