import {SPECS} from 'battlecode'; 
import {CombatUnit} from 'combatunit.js';
import * as params from 'params.js';

export class Crusader extends CombatUnit{
    turn(rc){
        super.turn(rc);
        return this.navTo(this.target,[10,1]);
    }
}
