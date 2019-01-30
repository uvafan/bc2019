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
        if(round<4&&this.th.me.unit==SPECS['CASTLE'])
            w[1]=0.3;
        if(round<3&&this.th.me.unit==SPECS['CASTLE'])
            w[4]=0;
        return w;
    }

    getUnitNeeded(obj,round){
        if(obj.type<2||obj.type==6){
            return SPECS['PILGRIM'];
        }
        else{
            var enemiesInSight = this.th.getEnemiesInSight();
            var enemyUnit = -1;
            var minDist = Number.MAX_SAFE_INTEGER;
            if(enemiesInSight.length>0){
                for(var i=0;i<enemiesInSight.length;i++){
                    var d = this.th.distBtwnP(enemiesInSight[i].x,enemiesInSight[i].y,this.th.me.x,this.th.me.y);
                    if(d<minDist){
                        enemyUnit = enemiesInSight[i].unit;
                        minDist=d;
                    }
                }
                //if(minDist<26&&this.th.rc.karbonite<30)
                    //return SPECS['CRUSADER'];
                if(minDist<26||(minDist<50&&(enemyUnit==SPECS['PREACHER']||enemyUnit==SPECS['CRUSADER']))){
                    return SPECS['PREACHER'];
                }
                if((enemyUnit==SPECS['PREACHER']||enemyUnit==SPECS['CRUSADER'])&&obj.unitCounts[SPECS['PREACHER']]==0){
                    return SPECS['PREACHER'];
                }
            }
            if(this.th.makeStuff){
                return SPECS['CRUSADER'];
            }
            return SPECS['PROPHET'];
        }
    }
}

export class EcoDefenseEarlyClaim extends EcoDefense {

    getUnitNeeded(obj,round){
        if(obj.type!=6)
            return super.getUnitNeeded(obj,round);
        var pilgRounds = obj.distFromMe/2;
        var cruRounds = obj.distFromEnemy/3;
        this.log('p '+pilgRounds+' c '+cruRounds);
        var claimUnit = params.CLAIM_UNIT;
        if(this.th.rc.karbonite>=25/*&&this.th.miningSpots<=30*/&&(cruRounds-1)<=pilgRounds&&this.th.me.turn<7&&obj.unitCounts[claimUnit]==0)
            return claimUnit;
        return SPECS['PILGRIM'];
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
