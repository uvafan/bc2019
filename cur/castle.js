import {SPECS} from 'battlecode';
import {Structure} from 'structure.js';
import * as objectives from 'objective.js';
import * as strategies from 'strategy.js'; import * as params from 'params.js';
export class Castle extends Structure{
    constructor(rc){
        super(rc);
        this.otherCastleLocsInitial = {};
        this.offset=0;
        this.otherCastleLocs = [];
        this.unitCounts = [0,0,0,0,0,0];
        this.idToUnit = {};
        this.idToLoc = {};
        this.attacking=false;
        this.churchesStarted=0;
        this.firstOtherCastle=-1;
    }

    turn(rc){
        super.turn(rc);
        //this.log('uc '+this.unitCounts);
        this.processCastleTalk();
        //this.log('pct');
        var obj = this.getHighestPriorityObjective();
        //this.log('obj');
        if(params.ATTACK_NOW-this.me.turn>0&&params.ATTACK_NOW-this.me.turn<3){
            var signal=params.RANDOM_ONE;
            if(this.me.turn+1==params.ATTACK_NOW)
                signal=params.RANDOM_TWO;
            //this.log('sending '+signal);
            this.rc.signal(signal,85*85);
        }
        if(this.me.turn==params.MAKE_STUFF&&!this.attacking){
            //this.log('sending '+params.MAKE_STUFF_SIGNAL);
            var signal=params.MAKE_STUFF_SIGNAL;
            this.rc.signal(signal,85*85);
            this.makeStuff=true;
        }
        else if(this.unitCounts[SPECS['CASTLE']]<this.otherCastleLocs.length+1
            && this.me.turn>=params.ATTACK_NOW && this.me.turn-params.ATTACK_NOW<this.enemyCastleLocs.length){
            //this.log('sending');
            var roundsAfter = this.me.turn-params.ATTACK_NOW;
            signal=this.getBroadcastFromLoc(this.enemyCastleLocs[roundsAfter]);
            this.rc.signal(signal,85*85);
            this.attacking=true;
        }
        else{
            var build = this.buildIfShould(obj);
            //this.log('build');
            if(build){
                if(obj.typeStr=='BUILD_CHURCH')
                    this.churchesStarted++;
                return build;
            }
        }
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

    updateDFE(obj){
        var minDist = Number.MAX_SAFE_INTEGER;
        for(var i=0;i<this.enemyCastleLocs.length;i++){
            var d = this.distBtwnP(this.enemyCastleLocs[i][0],this.enemyCastleLocs[i][1],obj.target[0],obj.target[1]);
            if(d<minDist){
                minDist=d;
            }
        }
        return Math.sqrt(minDist);
    }

    //called only on turn 3
    updateMiningObjectives(){
        var newObjs=[];
        //this.log('hi2 '+this.objectives[0].objInfo());
        for(var i=0;i<this.objectives.length;i++){
            var obj = this.objectives[i];
            if(obj.type>1){
                if(obj.typeStr=='BUILD_CHURCH'){
                    obj.distFromEnemy = this.updateDFE(obj);
                }
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
        this.unitCounts = [0,0,0,0,0,0];
        var visRobots = this.rc.getVisibleRobots();
        var ids = new Set();
        for(var i=0;i<visRobots.length;i++){
            var r = visRobots[i];
            //this.log('hi1 '+r.id);
            if(r.castle_talk != null && (r.team==null || r.team==this.me.team) && !(r.castle_talk&(1<<7))){
                //this.log('hi '+r.id);
                ids.add(r.id);
                var msg = r.castle_talk;
                if(msg&(1<<6)){
                    msg-=(1<<6);
                    if(this.objectives[0].processFoundDead(r.id,this.enemyCastleLocs)){
                        this.enemyCastleLocs.shift();
                    }
                    for(var i=0;i<this.objectives.length;i++){
                        var obj = this.objectives[i];
                        if(obj.typeStr=='BUILD_CHURCH'&&obj.assignees.includes(r.id)){
                            obj.built=true;
                        }
                    }
                }
                if(!(r.id in this.idToUnit)){
                    this.idToUnit[r.id]=msg;
                    this.idToLoc[r.id]=[-1,-1];
                }
                else if(this.me.turn%2==0){
                    this.idToLoc[r.id][0]=msg;
                }
                else if(this.me.turn%2==1){
                    this.idToLoc[r.id][1]=msg;
                }
                this.unitCounts[this.idToUnit[r.id]]++;
                if(r.unit != null && r.unit != SPECS['CASTLE']){
                    if(!this.lastIds.has(r.id) && !this.lastlastIds.has(r.id) && this.distBtwnP(r.x,r.y,this.me.x,this.me.y)<=16){
                        //this.log('hi '+r.id);
                        this.objectives[this.lastObjIdx].assign(r.id,r.unit);
                    }
                }
            }
        }
        this.strat.updateUnitCounts(this.unitCounts);
        this.lastlastIds = this.lastIds;
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
            this.rc.castleTalk(this.me.x+10+(1<<7));
        if(this.me.turn==2)
            this.rc.castleTalk(this.me.y+10+(1<<7));
        var visRobots = this.rc.getVisibleRobots();
        if(this.me.turn==1)
            this.myCastleNum=0;
        for(var i=0;i<visRobots.length;i++){
            var r=visRobots[i];
            if(r.castle_talk != null && r.castle_talk>0 && (r.team==null || r.team==this.me.team) && r.id!=this.me.id && (r.castle_talk&(1<<7))){
                var msg = r.castle_talk-(1<<7);
                this.idToUnit[r.id]=0;
                this.idToLoc[r.id]=[-1,-1];
                if(this.firstOtherCastle==-1)
                    this.firstOtherCastle=r.id;
                if(!(r.id in this.otherCastleLocsInitial)){
                    this.otherCastleLocsInitial[r.id] = [msg-10,-1];
                    this.idToLoc[r.id][0]=msg-10;
                    if(this.me.turn==1)
                        this.myCastleNum++;
                }
                else{
                    this.otherCastleLocsInitial[r.id][1] = msg-10;
                    this.idToLoc[r.id][1]=msg-10;
                }
            }
        }
        if(this.me.turn==3){
            for(var key in this.otherCastleLocsInitial){
                var loc = this.otherCastleLocsInitial[key];
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
