import {Unit} from 'unit.js';
import {SPECS} from 'battlecode'; 
import * as params from 'params.js';
import * as objectives from 'objective.js';
import * as strategies from 'strategy.js';

export class Structure extends Unit{

    constructor(rc){
        super(rc);
        this.makeStuff=false;
        this.lastObjIdx = -1;
        this.objectives = [];
        this.lastIds = [];
        this.enemyCastleLocs = [];
        if(this.me.unit==SPECS['CASTLE']){
            this.enemyCastleLocs.push(this.reflect(this.me.x,this.me.y));
            this.initializeAttackObjectives();
        }
        else if(this.me.unit==SPECS['CHURCH']){
            this.processBroadcast();
        }
        this.initializeDefenseObjectives();
        this.initializeMiningObjectives();
        this.getInitialStrategy();
    }

    turn(rc){
        super.turn(rc);
        this.updateObjectives();
    }
    
    buildIfShould(obj){
        var build = null;
        var priority = obj.getPriority(this.strat,this.rc.karbonite,this.rc.fuel); 
        var info = this.getUnitTargetAndBroadcast(obj);
        if(this.shouldBuild(priority,info[0])){
            if(obj.typeStr=='BUILD_CHURCH'){
                this.buildChurchObjStuff(obj);
                if(!this.hasChurchRights(obj.target[0],obj.target[1])){
                    var newObjs=[];
                    for(var i=0;i<this.objectives.length;i++){
                        if(this.objectives[i].type==obj.type&&this.objectives[i].target[0]==obj.target[0]&&this.objectives[i].target[1]==obj.target[1])
                            continue;
                        newObjs.push(this.objectives[i]);
                    }
                    this.objectives=newObjs;
                    return null;
                }
                var info = this.getUnitTargetAndBroadcast(obj);
            }
            build = this.buildUnit(info[0],info[1],info[2]);
            /*if(build&&info[0]==SPECS['PILGRIM']){
                var newObj = new objectives.defendPilgrim(this.me.turn,obj.target,this);
                this.objectives.push(newObj);
            }*/
        }
        return build;
    }

    shouldBuild(priority,unit){
        var maxFuelSave,maxKarbSave;
        var karbLeft = this.rc.karbonite-SPECS.UNITS[unit].CONSTRUCTION_KARBONITE;
        var fuelLeft = this.rc.fuel-SPECS.UNITS[unit].CONSTRUCTION_FUEL;
        if(this.me.unit==SPECS['CASTLE']){
            var maxFuelSave = params.MIN_FUEL_SAVE+this.me.turn*params.FUEL_SAVE_ROUND_MULTIPLIER;
            var maxKarbSave = params.MIN_KARB_SAVE+this.me.turn*params.KARB_SAVE_ROUND_MULTIPLIER;
        }
        else{
            var maxFuelSave = params.MIN_FUEL_SAVE+(this.me.turn+50)*params.FUEL_SAVE_ROUND_MULTIPLIER;
            var maxKarbSave = params.MIN_KARB_SAVE+(this.me.turn+50)*params.KARB_SAVE_ROUND_MULTIPLIER;
        }
        var fuelSave = maxFuelSave*(101-priority)/100;
        var karbSave = maxKarbSave*(101-priority)/100;
        if(this.makeStuff){
            fuelSave=params.MIN_FUEL_SAVE;
            karbSave=0;
        }
        return fuelSave<fuelLeft && karbSave<karbLeft;
    }

    hasChurchRights(x,y){
        var minDist = Number.MAX_SAFE_INTEGER;
        var myDist = this.distBtwnP(x,y,this.me.x,this.me.y);
        var idx=0;
        for(var i=0;i<this.otherCastleLocs.length;i++){
            var dist = this.distBtwnP(x,y,this.otherCastleLocs[i][0],this.otherCastleLocs[i][1]);
            if(dist<minDist){
                minDist=dist;
                idx=i;
            }
        }
        //this.log('myDist = '+myDist+' minDist = '+minDist+' ocl '+this.otherCastleLocs+ 'x '+x+' y '+y);
        return myDist<minDist || (myDist==minDist&&(this.myCastleNum==0||(this.myCastleNum==1&&idx==1)));
    }

    getUnitTargetAndBroadcast(obj){
        if(obj.typeStr=='DEFEND_CASTLE'){
            obj.updateTarget();
        }
        var unit = obj.unitNeeded(this.strat);
        var target = obj.target;
        var broadcast = this.getBroadcast(obj);
        return [unit,target,broadcast];
    }

    getBroadcast(obj){
        var offset = (this.me.turn%2)<<15;
        if(obj.type<2||obj.type==6){
            return this.getBroadcastFromLoc(obj.target)+offset+(1<<12);
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
            return this.getBroadcastFromLoc(obj.target)+(1<<12)+(1<<13)+offset;
        }
        else if(obj.type==5){
            return this.getBroadcastFromLoc(obj.target)+offset+(1<<14);
        }
    }

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

    getInitialStrategy(){
        this.strat = new strategies.EcoDefense(this);
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
        var churchClusters = [];
        var firstLoc=true;
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
                    if(firstLoc&&this.me.unit==SPECS['CHURCH']){
                        //this.log('c '+nx+' '+ny);
                        firstLoc=false;
                        var type = this.rc.karbonite_map[ny][nx]?0:1;
                        if(type==0)
                            var obj = new objectives.gatherKarb(this.me.turn,[nx,ny],this,myDist);
                        else
                            var obj = new objectives.gatherFuel(this.me.turn,[nx,ny],this,myDist);
                        obj.assign(0);
                        this.objectives.push(obj);
                    }
                    else{
                        var myDist = this.distBtwnP(nx,ny,this.me.x,this.me.y);
                        if(myDist<=params.MINING_DISTANCE){
                            var type = this.rc.karbonite_map[ny][nx]?0:1;
                            if(type==0)
                                var obj = new objectives.gatherKarb(this.me.turn,[nx,ny],this,myDist);
                            else
                                var obj = new objectives.gatherFuel(this.me.turn,[nx,ny],this,myDist);
                            this.objectives.push(obj);
                        }
                        else if(this.me.unit==SPECS['CASTLE']){
                            var dfe = this.distBtwnP(nx,ny,this.enemyCastleLocs[0][0],this.enemyCastleLocs[0][1]);
                            var obj = new objectives.buildChurch(this.me.turn,[nx,ny],this,dfe,myDist);
                            this.objectives.push(obj);
                        }
                    }
                }
                dist[nx][ny]=dist[x][y]+1;
                q.push([nx,ny]);
            }
        }
        /*
        if(this.me.unit==SPECS['CHURCH'])
            return;
        for(var i=0;i<churchClusters.length;i++){
            var c = this.centroid(churchClusters[i]);
            if(this.rc.karbonite_map[c[1]][c[0]]||this.rc.fuel_map[c[1]][c[0]]){
                for(var i=0;i<this.adjDiagMoves.length;i++){
                    var nc = [c[0]+this.adjDiagMoves[i][0],c[1]+this.adjDiagMoves[i][1]];
                    if(!this.rc.karbonite_map[nc[1]][nc[0]]&&!this.rc.fuel_map[nc[1]][nc[0]]){
                        c=nc;
                        break;
                    }
                }
            }
            var myDist = this.distBtwnP(c[0],c[1],this.me.x,this.me.y);
            var eDist = this.distBtwnP(c[0],c[1],this.enemyCastleLocs[0][0],this.enemyCastleLocs[0][1]);
            var obj = new objectives.buildChurch(this.me.turn,c,this,eDist,myDist);
            this.objectives.push(obj);
        }*/
    }

    getChurchLoc(cluster){
        var c = this.centroid(cluster);
        if(this.rc.karbonite_map[c[1]][c[0]]||this.rc.fuel_map[c[1]][c[0]]){
            for(var i=0;i<this.adjDiagMoves.length;i++){
                var nc = [c[0]+this.adjDiagMoves[i][0],c[1]+this.adjDiagMoves[i][1]];
                if(this.isPassable(nc[0],nc[1])&&!this.rc.karbonite_map[nc[1]][nc[0]]&&!this.rc.fuel_map[nc[1]][nc[0]]){
                    c=nc;
                    break;
                }
            }
        }
        return c;
    }

    buildChurchObjStuff(obj){
        var cluster=[];
        var newObjs=[];
        var idx=-1;
        for(var i=0;i<this.objectives.length;i++){
            var o=this.objectives[i];
            if(o.type==6){
                var d = this.distBtwnP(obj.target[0],obj.target[1],o.target[0],o.target[1]);
                if(d==0){
                    idx = newObjs.length;
                    newObjs.push(o);
                    cluster.push([o.target[0],o.target[1]])
                }
                else if(d<=params.MINING_DISTANCE*3/4){
                    cluster.push([o.target[0],o.target[1]]);
                }
                else{
                    newObjs.push(o);
                }
                continue;
            }
            newObjs.push(o);
        }
        this.objectives = newObjs;
        this.objectives[idx].target = this.getChurchLoc(cluster);
        this.lastObjIdx=idx;
    }

    addLoc(clusters,nx,ny){
        var added=false;
        for(var i=0;i<clusters.length;i++){
            /*var add=true;
            for(var j=0;j<clusters[i].length;j++){
                var d = this.distBtwnP(clusters[i][j][0],clusters[i][j][1],nx,ny);
                if(d>100){
                    add=false;
                    break;
                }
            }*/
            var d = this.distBtwnP(clusters[i][0],clusters[i][1],nx,ny);
            if(d<=100){
                //clusters[i].push([nx,ny]);
                added=true;
                break;
            }
        }
        if(!added&&clusters.length<5){
            clusters.push([[nx,ny]])
        }
        this.log(clusters);
        return clusters;
    }

    updateObjectives(){
        for(var i=0;i<this.objectives.length;i++){
            this.objectives[i].round++;
        }
    }

}
