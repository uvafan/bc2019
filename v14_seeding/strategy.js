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

    //['GATHER_KARB','GATHER_FUEL','DEFEND_PILGRIM','ATTACK_ENEMY','DEFEND_CASTLE',HARASS_PILGRIM,BUILD_CHURCH]
    objWeights(round){
        return [1,0,1,1,0,0,0];
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
        else if(obj.type==5){
            return SPECS['PREACHER'];
        }
    }

}

export class DefendCastles extends Strategy {
    //['GATHER_KARB','GATHER_FUEL','DEFEND_PILGRIM','ATTACK_ENEMY','DEFEND_CASTLE',HARASS_PILGRIM,BUILD_CHURCH]
    objWeights(round){
        if(round>=params.DEFENDERS_ATTACK_ROUND)
            return [0,0,0,10,0,0,0];
        else if(round<10)
            return [1,0,0,0,1,0,0];
        return [1,1,0,0,1,0,0];
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
        else if(obj.type==5){
            return SPECS['PROPHET'];
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

export class DefendCastlesOnePreacher extends DefendCastles {
    getUnitNeeded(obj,round){
        if(obj.type!=4)
            return super.getUnitNeeded(obj,round);
        else if(obj.type==4){
            if(obj.unitCounts[SPECS['PREACHER']]==0)
                return SPECS['PREACHER'];
            else
                return SPECS['PROPHET'];
        }
    }
}

export class DefendAndHarassOnePreacher extends DefendCastlesOnePreacher {
    //[GATHER_KARB,GATHER_FUEL,DEFEND_PILGRIM,ATTACK_ENEMY,DEFEND_CASTLE,HARASS_PILGRIM,BUILD_CHURCH]
    objWeights(round){
        if(round>=params.DEFENDERS_ATTACK_ROUND)
            return [0,0,0,10,0,0,0];
        else if(round<10)
            return [1,0,0,0,1,0,0];
        return [1,1,0,0,1,1,0];
    }
}

export class EcoDefense extends Strategy {
    //[GATHER_KARB,GATHER_FUEL,DEFEND_PILGRIM,ATTACK_ENEMY,DEFEND_CASTLE,HARASS_PILGRIM,BUILD_CHURCH]
    objWeights(round){
        var w = [1,1,0,0,1,0,1];
        if(this.th.me.unit==SPECS['CHURCH']||round<3){
            w[6]=0;
        }
        if(round<7&&this.th.me.unit==SPECS['CASTLE'])
            w[1]=0.3;
        return w;
    }

    getUnitNeeded(obj,round){
        if(obj.type<2||obj.type==6){
            return SPECS['PILGRIM'];
        }
        else{
            var enemiesInSight = this.th.getEnemiesInSight();
            var enemyUnit = -1;
            if(enemiesInSight.length>0){
                var minDist = Number.MAX_SAFE_INTEGER;
                for(var i=0;i<enemiesInSight.length;i++){
                    var d = this.th.distBtwnP(enemiesInSight[i].x,enemiesInSight[i].y,this.th.me.x,this.th.me.y);
                    if(d<minDist){
                        enemyUnit = enemiesInSight[i].unit;
                        minDist=d;
                    }
                }
            } 
            return (enemyUnit==SPECS['CRUSADER']?SPECS['PREACHER']:SPECS['PROPHET']);
        }
    }
}

export class Rush extends Strategy {
    objWeights(round){
        return [0,0,0,1,0,0];
    }
}

export class prophetRush extends Rush {
    unitNeeded(obj,round){
        return SPECS['PROPHET'];
    }
}

export class crusaderRush extends Rush {
    unitNeeded(obj,round){
        return SPECS['CRUSADER'];
    }
}

export class preacherRush extends Rush {
    unitNeeded(obj,round){
        return SPECS['PREACHER'];
    }
}