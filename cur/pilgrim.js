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
                    var theirOffset = (this.rc.trun%2==0?this.offset:1-this.offset);
                    var cast = this.getBroadcastFromLoc(this.target)+theirOffset;
                    var dx = this.target[0]-this.me.x;
                    var dy = this.target[1]-this.me.y;
                    this.rc.signal(cast,dx*dx+dy*dy);
                    var locToMine = this.getFirstMiningLoc();
                    this.structLoc = this.target;
                    this.structDists = this.runBFS(this.structLoc,true);
                    this.updateTarget(locToMine);
                    return this.rc.buildUnit(SPECS['CHURCH'],dx,dy);
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

    getFirstMiningLoc(){
        var dist = [];
        for(var x=0;x<this.mapSize;x++){
            dist.push([]);
            for(var y=0;y<this.mapSize;y++){
                dist[x].push(-1);
            }
        }
        var q = [[this.target[0],this.target[1]]];
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
                var locb = (r.signal&((1<<15)-1))-(1<<12);
                //this.log(locb);
                this.structLoc = [r.x,r.y];
                this.eloc = this.reflect(r.x,r.y);
                this.updateTarget(this.getLocFromBroadcast(locb));                
                if(this.distBtwnP(this.structLoc[0],this.structLoc[1],this.target[0],this.target[1])>params.MINING_DISTANCE){
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
