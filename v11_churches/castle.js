import {SPECS} from 'battlecode'; 
import {Structure} from 'structure.js';
import * as objectives from 'objective.js';
import * as strategies from 'strategy.js';
import * as params from 'params.js';

export class Castle extends Structure{
    constructor(rc){
        super(rc);
        this.otherCastleLocsInitial = {};
        this.otherCastleLocs = []; 
        this.lastIds = [];
    }

    turn(rc){
        super.turn(rc);
        this.processCastleTalk();
        var obj = this.getHighestPriorityObjective();
        var build = this.buildIfShould(obj);
        if(build)
            return build;
        var attack = this.attackEnemy();
        return attack;
    }

    initializeAttackObjectives(){
        var ecl = this.enemyCastleLocs[0];
        var obj = new objectives.attackEnemy(this.me.turn,ecl,this,this.manhattan(this.me.x,this.me.y,ecl[0],ecl[1]));
        this.objectives.push(obj);
    }

    getDistToOtherCastle(x,y){
        var minDist = Number.MAX_SAFE_INTEGER;
        for(var i=0;i<this.enemyCastleLocs.length;i++){
            var dist = this.distBtwnP(x,y,this.enemyCastleLocs[i][0],this.enemyCastleLocs[i][1]);
            if(dist<minDist)
                minDist=dist;
        }
        for(var i=0;i<this.otherCastleLocs.length;i++){
            var dist = this.distBtwnP(x,y,this.otherCastleLocs[i][0],this.otherCastleLocs[i][1]);
            if(dist<minDist)
                minDist=dist;
        }
        return minDist;
    }

    //called only on turn 3
    updateMiningObjectives(){
        var newObjs=[];
        //this.log('hi2 '+this.objectives[0].objInfo());
        for(var i=0;i<this.objectives.length;i++){
            var obj = this.objectives[i];
            if(obj.type>1&&obj.type<6){
                newObjs.push(obj);
            }
            else{
                var d = this.getDistToOtherCastle(obj.target[0],obj.target[1]);
                //this.log('d '+d+' dfm '+obj.distFromMe);
                if(d>obj.distFromMe){
                    newObjs.push(obj);
                }
                else if(d==this.distBtwnP(obj.target[0],obj.target[1],this.enemyCastleLocs[0][0],this.enemyCastleLocs[0][1])){
                    var newObj = new objectives.harassPilgrim(this.me.turn,obj.target,this,d,obj.distFromMe);
                    //newObjs.push(newObj);
                }
            }
        }
        //this.log('hi2 '+newObjs[0].objInfo());
        this.objectives=newObjs;
    }

    processCastleTalk(){
        if(this.me.turn%2==0){
            this.unitCounts = [0,0,0,0,0,0];
        }
        var visRobots = this.rc.getVisibleRobots();
        var ids = [];
        for(var i=0;i<visRobots.length;i++){
            var r = visRobots[i];
            if(r.castle_talk != null && (r.team==null || r.team==this.me.team) && r.castle_talk<10){
                if(this.me.turn%2==0){
                    this.unitCounts[r.castle_talk-1]++;
                }
                else if(this.me.turn%2==1&&r.castle_talk>0){
                    //this.log('hi '+ this.objectives[0].objInfo());
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
        if(this.me.turn%2==0){
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
        if(this.me.turn==1)
            this.myCastleNum=0;
        for(var i=0;i<visRobots.length;i++){
            var r=visRobots[i];
            if(r.castle_talk != null && r.castle_talk>0 && (r.team==null || r.team==this.me.team) && r.id!=this.me.id && r.castle_talk>9){
                if(!(r.id in this.otherCastleLocsInitial)){
                    this.otherCastleLocsInitial[r.id] = [r.castle_talk-10,-1];
                    if(this.me.turn==1)
                        this.myCastleNum++;
                }
                else{
                    this.otherCastleLocsInitial[r.id][1] = r.castle_talk-10;
                }
            }
        }
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
