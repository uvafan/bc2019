import {SPECS} from 'battlecode'; 
import {CombatUnit} from 'combatunit.js';
import * as params from 'params.js';

export class Preacher extends CombatUnit{
    takeTurn(rc){
        this.rc = rc;
        this.r = rc.me;
        const choices = [[0,-1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1]];
        const choice = choices[Math.floor(Math.random()*choices.length)];
        return this.rc.move(...choice);
    }
}
