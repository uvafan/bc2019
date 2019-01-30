import {SPECS} from 'battlecode'; 
import {CombatUnit} from 'combatunit.js';
import * as params from 'params.js';

export class Crusader extends CombatUnit{
    doMicro(){
        var attack = this.attackEnemy();
        if(attack)
            return attack;
        var enemiesInSight = this.getEnemiesInSight();
        if(this.protectingChurch&&enemiesInSight.length>0)
            return this.runTowardEnemy(enemiesInSight);
        return null;
    }

    runTowardEnemy(enemiesInSight){
        var minDist = Number.MAX_SAFE_INTEGER;
        var enemyLoc = [-1,-1];
        var enemyUnit = -1;
        if(enemiesInSight.length>0){
            for(var i=0;i<enemiesInSight.length;i++){
                var d = this.distBtwnP(enemiesInSight[i].x,enemiesInSight[i].y,this.me.x,this.me.y);
                if(d<minDist){
                    enemyUnit = enemiesInSight[i].unit;
                    enemyLoc = [enemiesInSight[i].x,enemiesInSight[i].y];
                    minDist=d;
                }
            }
        }
        var ret = null;
        if(enemyUnit==SPECS['PROPHET']||enemyUnit==SPECS['PILGRIM']||enemyUnit==SPECS['CHURCH']){
            var bestScore = Number.MIN_SAFE_INTEGER;
            for(var i=0;i<this.possibleMoves.length;i++){
                var move = this.possibleMoves[i];
                var nextLoc = [this.me.x+move[0],this.me.y+move[1]];
                var dist = this.distBtwnP(nextLoc[0],nextLoc[1],enemyLoc[0],enemyLoc[1]);
                var safe = this.isSafe(nextLoc[0],nextLoc[1]);
                var score = (safe?1000:0)-dist;
                if(this.isWalkable(nextLoc[0],nextLoc[1])&&score>bestScore){
                    bestScore=score;
                    ret = move;
                }
            }
        }
        if(!ret)
            return ret;
        return this.rc.move(ret[0],ret[1]); 
    }

}
