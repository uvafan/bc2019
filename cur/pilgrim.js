import {SPECS} from 'battlecode'; 
import {CombatUnit} from 'combatunit.js';
import * as params from 'params.js';

export class Pilgrim extends CombatUnit{
    turn(rc){
        super.turn(rc);
        if(this.isFull()){
            if(this.distBtwnP(this.structLoc[0],this.structLoc[1],this.me.x,this.me.y)<=2){
                return this.rc.give(this.structLoc[0]-this.me.x,this.structLoc[1]-this.me.y,this.me.karbonite,this.me.fuel);
            }
            else{
                return this.navTo(this.structLoc,params.PILGRIM_NAV_WEIGHTS,true);
            }
        }
        else if(this.me.x==this.target[0]&&this.me.y==this.target[1]&&this.rc.fuel>0){
            return this.rc.mine();
        }
        else{
            return this.navTo(this.target,params.PILGRIM_NAV_WEIGHTS,true);
        }
    }

    isFull(){
        return this.me.fuel==SPECS.UNITS[this.me.unit]['FUEL_CAPACITY'] ||
               this.me.karbonite==SPECS.UNITS[this.me.unit]['KARBONITE_CAPACITY'];
    }

}
