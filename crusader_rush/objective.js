import {SPECS} from 'battlecode'; 
import * as strategies from 'strategy.js';
import * as params from 'params.js';


export class Objective {
    constructor(r,tar,th){
        this.round=r;
        this.target=tar;
        this.th = th;
        this.assignees=[];
        this.assigneesToTarg={};
        this.assigneesToUnit={};
        this.targNum=0;
    }

    log(s){
        this.th.log(s);
    }

    objInfo(){
        return String(this.typeStr)+' t: '+String(this.target);
    }

    getPriority(strat,karb,fuel){
        return this.getPriorityStratAgnostic(karb,fuel)*strat.objWeights(this.round)[this.type];
    }

    updateAssignees(idsAlive){
        var newAssignees=[];
        this.unitCounts = [0,0,0,0,0,0];
        for(var i=0;i<this.assignees.length;i++){
            var a = this.assignees[i];
            if(idsAlive.includes(a)){
                newAssignees.push(a);
                this.unitCounts[this.assigneesToUnit[a]]++;
            }
        }
        this.assignees = newAssignees;
    }

    assign(id,unit){
        this.assignees.push(id);
        this.assigneesToTarg[id]=this.targNum;
        this.assigneesToUnit[id]=unit;
    }

    unitNeeded(strat){
        return strat.getUnitNeeded(this,this.round);
    }

}

export class gatherKarb extends Objective {
    constructor(r,tar,th,dfm){
        super(r,tar,th);
        this.distFromMe = dfm;
        this.typeStr = 'GATHER_KARBONITE';
        this.type=0;
    }

    getPriorityStratAgnostic(karb,fuel){
        if(this.assignees.length)
            return 0;
        var karbNeeded = (karb*5>fuel?0:1);
        var distScore = Math.max(200-this.distFromMe*this.distFromMe,1);
        return distScore/(karbNeeded?1:2);
    }
}

export class gatherFuel extends Objective {
    constructor(r,tar,th,dfm){
        super(r,tar,th);
        this.distFromMe = dfm;
        this.typeStr = 'GATHER_FUEL';
        this.type=1;
    }

    getPriorityStratAgnostic(karb,fuel){
        if(this.assignees.length)
            return 0;
        var karbNeeded = (karb*7>fuel?0:1);
        var distScore = Math.max(200-this.distFromMe*this.distFromMe*2,1);
        return distScore/(karbNeeded?2:1);
    }
}

export class defendPilgrim extends Objective {
    constructor(r,tar,th){
        super(r,tar,th);
        this.typeStr = 'DEFEND_PILGRIM';
        this.type=2;
    }

    getPriorityStratAgnostic(karb,fuel){
        return this.assignees.length?1:20;
    }
}

export class attackEnemy extends Objective {
    constructor(r,tar,th,dfm){
        super(r,tar,th);
        this.distFromMe=dfm;
        this.typeStr = 'ATTACK_ENEMY';
        this.type=3;
    }

    getPriorityStratAgnostic(karb,fuel){
        var distScore = Math.max(30-this.distFromMe,1);
        //this.log('al '+this.assignees.length);
        return this.assignees.length*10+distScore;
    }

    processFoundDead(id,ecl){
        if(!this.assignees.includes(id))
            return false;
        this.assigneesToTarg[id]++;
        if(this.assigneesToTarg[id]>this.targNum){
            this.targNum++;
            this.log('tn '+this.targNum);
            this.log('ecl '+ecl);
            this.target = ecl[1];
            this.distFromMe = this.th.manhattan(ecl[1][0],ecl[1][1],this.th.me.x,this.th.me.y);
            return true;
        }
        return false;
    }
}

export class defendCastle extends Objective {
    constructor(r,tar,th,dfe){
        super(r,tar,th);
        this.distFromEnemy = dfe;
        this.typeStr = 'DEFEND_CASTLE';
        this.type=4;
    }

    getPriorityStratAgnostic(karb,fuel){
        var numDefenders = this.assignees.length;
        return Math.max(200-this.distFromEnemy*2-numDefenders*10,1);
    }
}



