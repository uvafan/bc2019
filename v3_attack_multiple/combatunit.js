import {Robot} from 'myrobot.js';
import {SPECS} from 'battlecode'; 
import * as params from 'params.js';
export class CombatUnit extends Robot{
    constructor(rc){
        super(rc);
        this.getFirstTarget();
        this.attackRadius = SPECS.UNITS[this.me.unit]['ATTACK_RADIUS'];
        this.attackCost = SPECS.UNITS[this.me.unit]['ATTACK_FUEL_COST'];
        this.castleDead=false;
        this.stopChecks=false;
    }

    getFirstTarget(){
        var visRobots = this.rc.getVisibleRobots();
        for(var i=0;i<visRobots.length;i++){
            var r = visRobots[i];
            if(r.team==this.me.team&&this.distBtwnP(r.x,r.y,this.me.x,this.me.y)<=2&&(r.unit==SPECS['CASTLE']||r.unit==SPECS['CHURCH'])){
                this.offset = r.signal>>14;
                var locb = r.signal&((1<<14)-1);
                if(locb&(1<<12)){
                    this.attacking = false;
                    var protectLoc = this.getLocFromBroadcast(locb^(1<<12));
                    this.target = this.stepTowards(protectLoc,this.reflect(r.x,r.y),3);
                    //this.log('T '+this.target);
                }
                else{
                    var oppCastleAlive = true;
                    if(locb&(1<<13)){
                        oppCastleAlive=false;
                        locb = locb^(1<<13);
                    }
                    this.attacking = true;
                    var bloc = this.getLocFromBroadcast(locb);
                    this.target = oppCastleAlive?this.reflect(r.x,r.y):bloc;
                    this.secondaryTarget = bloc;
                    //this.log('T '+this.target);
                    //this.log('ST '+this.secondaryTarget);
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
        var bestDist = this.distBtwnP(loc[0],loc[1],to[0],to[1]);
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
                var d = this.distBtwnP(nx,ny,to[0],to[1]);
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
        if(this.attacking&&!this.stopChecks)
            this.moveOnToSecondaryIfNeeded();
        var nav_weights = (this.attacking?params.ATT_NAV_WEIGHTS:params.DEF_NAV_WEIGHTS);
        if(!this.reachedTarget())
            return this.navTo(this.target,nav_weights,true);
        return null;
    }

    reachedTarget(){
        var d = this.distBtwnP(this.target[0],this.target[1],this.me.x,this.me.y);
        return d==0 || (d<3&&this.visRobotMap[this.target[1]][this.target[0]]>0);
    }

    moveOnToSecondaryIfNeeded(){
        if(this.visRobotMap[this.target[1]][this.target[0]]==0){
            if(this.target==this.secondaryTarget){
                this.stopChecks=true;
            }
            this.target = this.secondaryTarget;
            this.castleDead=true;
        }
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
