import {SPECS} from 'battlecode'; 
import {Structure} from 'structure.js';
import * as params from 'params.js';

export class Church extends Structure{
    turn(rc){
        super.turn(rc);
        var obj = this.getHighestPriorityObjective();
        var build = this.buildIfShould(obj);
        if(build){
            obj.assign(0);
        }
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
}
