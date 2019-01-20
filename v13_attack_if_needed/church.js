import {SPECS} from 'battlecode'; 
import {Structure} from 'structure.js';
import * as params from 'params.js';

export class Church extends Structure{
    turn(rc){
        super.turn(rc);
        this.processVision();
        var obj = this.getHighestPriorityObjective();
        var build = this.buildIfShould(obj);
        return build;
    }

    processBroadcast(){
        var visRobots = this.rc.getVisibleRobots();
        for(var i=0;i<visRobots.length;i++){
            var r = visRobots[i];
            if(r.team==this.me.team&&this.distBtwnP(r.x,r.y,this.me.x,this.me.y)<=2&&(r.unit==SPECS['CASTLE']||r.unit==SPECS['CHURCH'])){
                this.offset = r.signal>>14;
                var locb = r.signal&((1<<14)-1);
                this.enemyCastleLocs.push(this.getLocFromBroadcast(locb));
            }
        }
    }

    processVision(){
        var visRobots = this.rc.getVisibleRobots();
        var ids = [];
        for(var i=0;i<visRobots.length;i++){
            var r = visRobots[i];
            if(r.unit != null && r.team==this.me.team){
                ids.push(r.id);
                if(r.x != null && r.unit != SPECS['CHURCH']){
                    if(!this.lastIds.includes(r.id) && this.distBtwnP(r.x,r.y,this.me.x,this.me.y)<=16 && this.lastObjIdx>-1){ 
                        this.objectives[this.lastObjIdx].assign(r.id,r.unit);
                    }
                }
            }
        }
        this.lastIds = ids;
        for(var i=0;i<this.objectives.length;i++){
            this.objectives[i].updateAssignees(ids);
        }
    }
}
