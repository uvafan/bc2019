import {SPECS} from 'battlecode'; 
import {Strategy} from 'strategy.js';
import * as params from 'params.js';


export class Objective {
    constructor(t,r,tar,dfm,dfe,th){
        this.type=t;
        this.round=r;
        this.target=tar;
        this.distFromMe=dfm;
        this.distFromEnemy=dfe;
        this.assignees=[];
        this.objectiveStrs = ['GATHER_KARB','GATHER_FUEL','DEFEND_PILGRIM','ATTACK_ENEMY'];
        this.th = th;
    }

    log(s){
        this.th.log(s);
    }

    objInfo(){
        return String(this.objectiveStrs[this.type])+' t: '+String(this.target);
    }

    getPriority(strat,karb,fuel){
        var ret;
        //this.log(this.type);
        switch(this.type){
            case 0: ret = this.gatherKarbPriority(karb,fuel); break;
            case 1: ret = this.gatherFuelPriority(karb,fuel); break;
            case 2: ret = this.defendPilgPriority(); break;
            case 3: ret = this.attackEnemyPriority();
        }
        //this.log(ret);
        return ret*strat.objWeights(this.round)[this.type];
    }

    updateAssignees(idsAlive){
        var newAssignees=[];
        for(var i=0;i<this.assignees.length;i++){
            var a = this.assignees[i];
            if(idsAlive.includes(a)){
                newAssignees.push(a);
            }
        }
        this.assignees = newAssignees;
    }

    assign(id){
        this.assignees.push(id);
    }

    unitNeeded(strat){
        return strat.getUnitNeeded(this.type,this.round);
    }

    //info: distance from me, distance from enemy, cur amount of fuel, cur amount of karb
    gatherKarbPriority(karb,fuel){
        if(this.assignees.length)
            return -1;
        var karbNeeded = (karb*5>fuel?0:1);
        var distScore = Math.max(100-this.distFromMe*this.distFromMe,1);
        return distScore/(karbNeeded?2:1);
    }

    //info: distance from me, distance from enemy, cur amount of fuel, cur amount of karb
    gatherFuelPriority(karb,fuel){
        if(this.assignees.length)
            return -1;
        var karbNeeded = (karb*5>fuel?0:1);
        var distScore = Math.max(200-this.distFromMe*this.distFromMe,1);
        return distScore/(karbNeeded?1:2);
    }

    //info: distance from me, distance from enemy, amount currently defending    
    defendPilgPriority(){
        return 0;
    }

    //info: rush distance, amount currently attacking
    attackEnemyPriority(){
        var distScore = Math.max(30-this.distFromMe,1);
        this.log('al '+this.assignees.length);
        return this.assignees.length*10+distScore;
    }

}
