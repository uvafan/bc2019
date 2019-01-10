import {SPECS} from 'battlecode'; 
import {CombatUnit} from 'combatunit.js';
import * as params from 'params.js';

export class Crusader extends CombatUnit{
    turn(rc){
        super.turn(rc);
        var attack = this.attackEnemy();
        if(attack)
            return attack;
        return this.navTo(this.target,params.OFF_CRUSADER_NAV_WEIGHTS,true);
    }
}
