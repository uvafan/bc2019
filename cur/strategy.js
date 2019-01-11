import {SPECS} from 'battlecode'; 
import * as params from 'params.js';
        

export class Strategy {
    constructor(t){
        this.type=t;
        this.strategyStrs = ['BALANCED_BUILDUP'];
        this.unitCounts = [];
    }

    updateUnitCounts(uc){
        this.unitCounts=uc;
    }

    stratInfo(){
        return this.strategyStrs[this.type];
    }

    objWeights(round){
        switch(this.type){
            case 0: return this.getBalancedWeights(round);
        }
    }

    getUnitNeeded(objType,round){
        switch(this.type){
            case 0: return this.getBalancedUnit(objType,round);
        }
    }

    //Balanced Buildup strat

    //['GATHER_KARB','GATHER_FUEL','DEFEND_PILGRIM','ATTACK_ENEMY','DEFEND_CASTLE']
    getBalancedWeights(round){
        return [1,0,1,1,0];
    }

    getBalancedUnit(objType,round){
        if(objType==0){
            return SPECS['PILGRIM'];
        }
        else if(objType==1){
            return SPECS['PILGRIM'];
        }
        else if(objType==2){
            return SPECS['PREACHER'];
        }
        else if(objType==3){
            return SPECS['PREACHER'];
        }
        else if(objType==4){
            return SPECS['CRUSADER'];
        }
    }

}
