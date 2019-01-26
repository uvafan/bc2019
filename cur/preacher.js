import {SPECS} from 'battlecode'; 
import {CombatUnit} from 'combatunit.js';
import * as params from 'params.js';

export class Preacher extends CombatUnit{
    constructor(rc){
        super(rc);
        this.attackOffsets = this.getDxDyWithin(SPECS.UNITS[this.me.unit]['ATTACK_RADIUS'][0],SPECS.UNITS[this.me.unit]['ATTACK_RADIUS'][1]);
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
        var bestScore = 0;
        var bestOff = null;
        for(var i=0;i<this.attackOffsets.length;i++){
            var off = this.attackOffsets[i];
            var tile = [this.me.x+off[0],this.me.y+off[1]];
            //if(!this.isPassable(tile[0],tile[1]))
            //    continue;
            var score = this.scoreTile(off);
            if(score>bestScore){
                bestScore = score;
                bestOff=off;
            }
        }
        if(!bestOff)
            return null;
        //this.log('attacking '+bestOff[0]+ ' '+bestOff[1]);
        return this.rc.attack(bestOff[0],bestOff[1]);
    }

    scoreTile(off){
        var tile = [this.me.x+off[0],this.me.y+off[1]];
        if(this.offMap(tile[0],tile[1])){
            return Number.MIN_SAFE_INTERGER;
        }
        //this.log(tile);
        var dist = off[0]*off[0]+off[1]*off[1];
        var hitScore=0;
        for(var i=0;i<this.splash.length;i++){
            var off = this.splash[i];
            var splashTile = [tile[0]+off[0],tile[1]+off[1]];
            if(!this.isPassable(splashTile[0],splashTile[1])){
                continue;
            }
            //this.log('s '+splashTile);
            var rid = this.visRobotMap[splashTile[1]][splashTile[0]];
            if(rid>0){
                var r = this.rc.getRobot(rid);
                if(r.team!=this.me.team){
                    hitScore+=params.ATTACK_PRIORITIES[r.unit];
                }
                else{
                    hitScore-=params.ATTACK_PRIORITIES[r.unit];
                }
            }
        }
        //this.log('eh '+enemiesHit+' fh '+friendliesHit);
        //if(enemiesHit<=friendliesHit)
        //    return 0;
        return hitScore*100+dist;
    }

}
