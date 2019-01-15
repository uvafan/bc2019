import {SPECS} from 'battlecode'; 
import {CombatUnit} from 'combatunit.js';
import * as params from 'params.js';

export class Crusader extends CombatUnit{
    doMicro(){
        var attack = this.attackEnemy();
        if(attack)
            return attack;
        return null;
    }
}
