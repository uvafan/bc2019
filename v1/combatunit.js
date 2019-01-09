import {Robot} from 'myrobot.js';
import {SPECS} from 'battlecode'; 
import * as params from 'params.js';
export class CombatUnit extends Robot{
    constructor(rc){
        super(rc);
        this.determineFirstTarget();
        this.attackRadius = SPECS.UNITS[this.me.unit]['ATTACK_RADIUS'];
        this.attackCost = SPECS.UNITS[this.me.unit]['ATTACK_FUEL_COST'];
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

    attackEnemy(){
        if(this.rc.fuel < this.attackCost)
            return null;
        var visRobots = this.rc.getVisibleRobots();
        var th = this;
        var ret = null;
        var bestScore = Number.MIN_SAFE_INTEGER;
        visRobots.forEach(function(r){
            if(r.team==null || r.team==th.me.team)
                return;
            var distToR = th.distBtwn(th.me,r);
            if(th.attackRadius[0]>distToR||th.attackRadius[1]<distToR)
                return;
            var score = -r.unit*100-distToR;
            if(score>bestScore){
                bestScore = score;
                ret = th.rc.attack(r.x-th.me.x,r.y-th.me.y);
            }
        });
        return ret;
    }

}
