import {SPECS} from 'battlecode'; 
import * as params from 'params.js';


export class Strategy {
    constructor(th){
        this.overallUnitCounts = [];
        this.th = th;
    }

    updateUnitCounts(uc){
        this.overallUnitCounts=uc;
    }

    log(s){
        this.th.log(s);
    }

    determineUnitNeeded(unitCounts,desiredComp){
        var bestUnit = -1;
        var bestRatio = Number.MAX_SAFE_INTEGER;
        var highestNum = -1;
        for(var i=0;i<6;i++){
            if(desiredComp[i]==0)
                continue;
            var ratio = unitCounts[i]/desiredComp[i];
            if(ratio<bestRatio||(ratio==bestRatio&&desiredComp[i]>highestNum)){
                bestRatio=ratio;
                bestUnit=i;
                highestNum=desiredComp[i];
            }
        }
        return bestUnit;
    }

}

export class DefendPilgrims extends Strategy {

    //['GATHER_KARB','GATHER_FUEL','DEFEND_PILGRIM','ATTACK_ENEMY','DEFEND_CASTLE']
    objWeights(round){
        return [1,0,1,1,0];
    }

    getUnitNeeded(obj,round){
        if(obj.type==0){
            return SPECS['PILGRIM'];
        }
        else if(obj.type==1){
            return SPECS['PILGRIM'];
        }
        else if(obj.type==2){
            return SPECS['PREACHER'];
        }
        else if(obj.type==3){
            return SPECS['PREACHER'];
        }
        else if(obj.type==4){
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

    getUnitNeeded(obj,round){
        if(obj.type==0){
            return SPECS['PILGRIM'];
        }
        else if(obj.type==1){
            return SPECS['PILGRIM'];
        }
        else if(obj.type==2){
            return SPECS['PREACHER'];
        }
        else if(obj.type==3){
            return SPECS['PROPHET'];
        }
        else if(obj.type==4){
            return this.determineUnitNeeded(obj.unitCounts,this.defenseComp);
        }
    }
}

export class DefendCastlesProphet extends DefendCastles {
    constructor(){
        super();
        this.defenseComp = [0,0,0,0,1,0];
    }
}

export class DefendCastlesPreacher extends DefendCastles {
    constructor(){
        super();
        this.defenseComp = [0,0,0,0,0,1];
    }
}

export class DefendCastlesProphetPreacher extends DefendCastles {
    constructor(){
        super();
        this.defenseComp = [0,0,0,0,2,3];
    }
}
