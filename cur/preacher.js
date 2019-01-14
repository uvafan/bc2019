import {SPECS} from 'battlecode'; 
import {CombatUnit} from 'combatunit.js';
import * as params from 'params.js';

export class Preacher extends CombatUnit{
    constructor(rc){
        super(rc);
        this.attackOffsets = this.getDxDyWithin(SPECS.UNITS[this.me.unit]['ATTACK_RADIUS'][0],SPECS.UNITS[this.me.unit]['ATTACK_RADIUS'][1]);
        this.splash = this.getDxDyWithin(0,2);
    }

    doMicro(){
        var attack = this.attackEnemy();
        if(attack)
            return attack;
        return null;
    }

    attackEnemy(){
        if(this.rc.fuel < this.attackCost)
            return null;
        var ret = null;
        var bestScore = 0;
        for(var i=0;i<this.attackOffsets.length;i++){
            var off = this.attackOffsets[i];
            var score = this.scoreTile(off);
            if(score>bestScore){
                bestScore = score;
                ret = this.rc.attack(off[0],off[1]);
            }
        }
        return ret;
    }

    scoreTile(off){
        var tile = [this.me.x+off[0],this.me.y+off[1]];
        if(this.offMap(tile[0],tile[1])){
            return Number.MIN_SAFE_INTERGER;
        }
        //this.log(tile);
        var dist = off[0]*off[0]+off[1]*off[1];
        var enemiesHit=0;
        var friendliesHit=0;
        for(var i=0;i<this.splash.length;i++){
            var off = this.splash[i];
            var splashTile = [tile[0]+off[0],tile[1]+off[1]];
            if(this.offMap(splashTile[0],splashTile[1])){
                continue;
            }
            //this.log('s '+splashTile);
            var rid = this.visRobotMap[splashTile[1]][splashTile[0]];
            if(rid>0){
                var r = this.rc.getRobot(rid);
                if(r.team!=this.me.team){
                    enemiesHit++;
                }
                else{
                    friendliesHit++;
                }
            }
        }
        //this.log('eh '+enemiesHit+' fh '+friendliesHit);
        if(enemiesHit<=friendliesHit)
            return 0;
        return enemiesHit*100-friendliesHit*100+dist;
    }

}
