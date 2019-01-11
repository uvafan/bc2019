import {Robot} from 'myrobot.js';
import {SPECS} from 'battlecode'; 
import * as params from 'params.js';
export class CombatUnit extends Robot{
    constructor(rc){
        super(rc);
        this.getFirstTarget();
        this.attackRadius = SPECS.UNITS[this.me.unit]['ATTACK_RADIUS'];
        this.attackCost = SPECS.UNITS[this.me.unit]['ATTACK_FUEL_COST'];
    }

    getFirstTarget(){
        var visRobots = this.rc.getVisibleRobots();
        for(var i=0;i<visRobots.length;i++){
            var r = visRobots[i];
            if(r.team==this.me.team&&this.distBtwnP(r.x,r.y,this.me.x,this.me.y)<=2&&(r.unit==SPECS['CASTLE']||r.unit==SPECS['CHURCH'])){
                if(r.signal&(1<<12)){
                    this.attacking = false;
                    this.target = this.getLocFromBroadcast(r.signal^(1<<12));
                    this.target = this.stepTowards(this.target,this.reflect(r.x,r.y),3);
                    this.log('T '+this.target);
                }
                else{
                    this.attacking = true;
                    this.target = this.reflect(r.x,r.y);
                    this.secondaryTarget = this.getLocFromBroadcast(r.signal);
                }
            }
        }
        //this.log('T '+this.target);
    }

    stepTowards(loc,to,steps){
        var dist = [];
        for(var x=0;x<this.mapSize;x++){
            dist.push([]);
            for(var y=0;y<this.mapSize;y++){
                dist[x].push(-1);
            }
        }
        var best = loc;
        var bestDist = this.manhattan(loc[0],loc[1],to[0],to[1]);
        var q = [[loc[0],loc[1]]];
        while(q.length>0){
            var u = q.shift();
            var x = u[0];
            var y = u[1];
            for(var i=0;i<4;i++){
                var move = this.adjMoves[i];
                var nx=x+move[0];
                var ny=y+move[1];
                if(!this.isPassable(nx,ny)||dist[nx][ny]>-1)
                    continue;
                var d = this.manhattan(nx,ny,to[0],to[1]);
                if(d<bestDist){
                    bestDist=d;
                    best=[nx,ny];
                }
                dist[nx][ny]=dist[x][y]+1;
                if(dist[nx][ny]<steps)
                    q.push([nx,ny]);
            }
        }
        return best;
    }

    updateTarget(){
    }

    turn(rc){
        super.turn(rc);
        this.updateTarget();
        var attack = this.attackEnemy();
        if(attack)
            return attack;
        var nav_weights = (this.attacking?params.ATT_NAV_WEIGHTS:params.DEF_NAV_WEIGHTS);
        if(this.manhattan(this.target[0],this.target[1],this.me.x,this.me.y)>1)
            return this.navTo(this.target,nav_weights,true);
        return null;
    }

    attackEnemy(){
        if(this.rc.fuel < this.attackCost)
            return null;
        var visRobots = this.rc.getVisibleRobots();
        var th = this;
        var ret = null;
        var bestScore = Number.MIN_SAFE_INTEGER;
        visRobots.forEach(function(r){
            if(r.x == null || r.team==null || r.team==th.me.team)
                return;
            var distToR = th.distBtwn(th.me,r);
            if(th.attackRadius[0]>distToR||th.attackRadius[1]<distToR)
                return;
            var score = r.unit*100-distToR;
            if(score>bestScore){
                bestScore = score;
                ret = th.rc.attack(r.x-th.me.x,r.y-th.me.y);
            }
        });
        return ret;
    }

}
