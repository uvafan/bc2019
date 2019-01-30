import {SPECS} from 'battlecode';
import {Structure} from 'structure.js';
import * as params from 'params.js';

export class Church extends Structure{
    constructor(rc){
        super(rc);
        this.trusted=[];
        this.prelimTrusted=[];
    }

    turn(rc){
        super.turn(rc);
        this.processVision();
        this.processSignals();
        var obj = this.getHighestPriorityObjective();
        var build = this.buildIfShould(obj);
        return build;
    }

    processBroadcast(){
        var visRobots = this.rc.getVisibleRobots();
        for(var i=0;i<visRobots.length;i++){
            var r = visRobots[i];
            if(r.team==this.me.team&&this.distBtwnP(r.x,r.y,this.me.x,this.me.y)<=2&&(r.unit==SPECS['PILGRIM'])&&r.signal>0){
                this.karbFirst = r.signal>>15;
                //this.log('k '+this.karbFirst);
                var now = (r.signal&((1<<15)-1));
                var turnDial = now>>12;
                this.createdTurn = params.PILGRIM_TURN_ARRAY[turnDial];
                var locb = (now&((1<<12)-1));
                var loc = this.getLocFromBroadcast(locb)
                var eloc = this.reflect(loc[0],loc[1]);
                this.enemyCastleLocs.push([eloc[0],eloc[1]]);
                this.creatorID = r.id;
            }
        }
    }

    processVision(){
        var visRobots = this.rc.getVisibleRobots();
        var ids = new Set();
        for(var i=0;i<visRobots.length;i++){
            var r = visRobots[i];
            if(r.unit != null && r.team==this.me.team){
                ids.add(r.id);
                if(r.x != null && r.unit != SPECS['CHURCH']){
                    if(!this.lastIds.has(r.id) && !this.lastlastIds.has(r.id) && this.distBtwnP(r.x,r.y,this.me.x,this.me.y)<=16 && this.lastObjIdx>-1){
                        this.objectives[this.lastObjIdx].assign(r.id,r.unit);
                    }
                }
            }
        }
        this.lastlastIds = this.lastIds;
        this.lastIds = ids;
        for(var i=0;i<this.objectives.length;i++){
            this.objectives[i].updateAssignees(ids);
        }
    }

    processSignals(){
        var visRobots = this.rc.getVisibleRobots();
        //this.log('x '+this.me.x+' y '+this.me.y+' processing');
        for(var i=0;i<visRobots.length;i++){
            var r = visRobots[i];
            //this.log('here '+r.signal+' id '+r.id+' t '+this.trusted);
            if(r.signal==params.RANDOM_ONE){
                this.prelimTrusted.push(r.id);
                //this.log('pt '+r.id)
            }
            if(r.signal==params.RANDOM_TWO&&this.prelimTrusted.includes(r.id)){
                this.trusted.push(r.id);
                //this.log('t '+r.id)
            }
            if(r.signal>0&&this.trusted.includes(r.id)){
                //this.log('here '+r.signal);
                if(r.signal==params.MAKE_STUFF_SIGNAL){
                    this.MSTurn = this.me.turn;
                    this.makeStuff=true;
                }
           }
        }
    }

}
