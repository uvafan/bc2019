import {SPECS} from 'battlecode'; 
import {Structure} from 'structure.js';
import * as params from 'params.js';

export class Castle extends Structure{
    takeTurn(rc){
        this.rc = rc;
        this.r = rc.me;
        if (this.rc.karbonite>SPECS.UNITS[SPECS.CRUSADER].CONSTRUCTION_KARBONITE && 
            this.rc.fuel>SPECS.UNITS[SPECS.CRUSADER].CONSTRUCTION_FUEL) {
            this.rc.log("Building a crusader at " + (this.r.x+1) + ", " + (this.r.y+1));
            return this.rc.buildUnit(SPECS.CRUSADER, 1, 1);
        } 
        else {
            return;
        }
    }
}
