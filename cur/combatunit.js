import {Robot} from 'myrobot.js';
import {SPECS} from 'battlecode'; 
import * as params from 'params.js';
export class CombatUnit extends Robot{
    constructor(rc){
        super(rc);
        this.determineFirstTarget();
    }

    determineFirstTarget(){
        this.target = this.reflect(this.me.x,this.me.y);
    }

    updateTarget(){
    }

    turn(rc){
        super.turn(rc);
        this.updateTarget();
    }
}
