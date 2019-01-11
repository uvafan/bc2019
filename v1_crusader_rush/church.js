import {SPECS} from 'battlecode'; 
import {Structure} from 'structure.js';
import * as params from 'params.js';

export class Church extends Structure{
    turn(rc){
        super.turn(rc);
        if (this.rc.step % 10 === 0) {
            this.rc.log("Building a crusader at " + (this.me.x+1) + ", " + (this.me.y+1));
            return this.rc.buildUnit(SPECS.CRUSADER, 1, 1);
        } else {
            return;
        }
    }
}
