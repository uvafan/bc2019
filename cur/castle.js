import {SPECS} from 'battlecode'; 
import {Structure} from 'structure.js';
import * as params from 'params.js';

export class Castle extends Structure{
    turn(rc){
        super.turn(rc);
        if (this.rc.karbonite>SPECS.UNITS[SPECS.CRUSADER].CONSTRUCTION_KARBONITE && 
            this.rc.fuel>SPECS.UNITS[SPECS.CRUSADER].CONSTRUCTION_FUEL) {
            this.rc.log("Building a crusader at " + (this.me.x+1) + ", " + (this.me.y+1));
            return this.rc.buildUnit(SPECS.CRUSADER, 1, 1);
        } 
        else {
            return;
        }
    }
}
