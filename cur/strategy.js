import {SPECS} from 'battlecode'; 
import * as params from 'params.js';
        

export class Strategy {
    constructor(){
        this.unitCounts = [];
    }

    updateUnitCounts(uc){
        this.unitCounts=uc;
    }
}

export class DefendPilgrims extends Strategy {
    
    //['GATHER_KARB','GATHER_FUEL','DEFEND_PILGRIM','ATTACK_ENEMY','DEFEND_CASTLE']
    objWeights(round){
        return [1,0,1,1,0];
    }

    getUnitNeeded(objType,round){
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
            return SPECS['PREACHER'];
        }
    }

}

export class DefendCastles extends Strategy {

    //['GATHER_KARB','GATHER_FUEL','DEFEND_PILGRIM','ATTACK_ENEMY','DEFEND_CASTLE']
    objWeights(round){
        if(round>params.DEFENDERS_ATTACK_ROUND)
            return [0,0,0,1,0];
        else if(round>5)
            return [1,1,0,0,1];
        return [1,0,0,0,1];
    }

    getUnitNeeded(objType,round){
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
            return SPECS['PREACHER'];
        }
    }

}
