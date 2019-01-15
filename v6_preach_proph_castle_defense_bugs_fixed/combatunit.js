import {Robot} from 'myrobot.js'; 
import {SPECS} from 'battlecode'; 
import * as params from 'params.js';
export class CombatUnit extends Robot{
    constructor(rc){
        super(rc);
        this.createdBy=[];
        this.switchTurn=params.DEFENDERS_ATTACK_ROUND;
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
                this.createdBy = [r.x,r.y];
                if(locb&(1<<12)){
                    this.attacking = false;
                    var target;
                    if(locb&(1<<13)){
                        target = [r.x,r.y];
                        var currentRound = locb^((1<<12)+(1<<13));
                        this.switchTurn = params.DEFENDERS_ATTACK_ROUND-currentRound;
                    }
                    else{
                        target = this.getLocFromBroadcast(locb^(1<<12));
                    }
                    var defensiveDistance = (this.me.unit==SPECS['PROPHET']?params.DEFENSIVE_PROPHET_DISTANCE:params.DEFENSIVE_PREACHER_DISTANCE);
                    this.updateTarget(this.stepTowards(target,this.reflect(r.x,r.y),defensiveDistance));
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
                    this.updateTarget(oppCastleAlive?this.reflect(r.x,r.y):bloc);
                    this.secondaryTarget = bloc;
                    //this.log('ST '+this.secondaryTarget);
                }
            }
        }
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
                //this.log('nx '+nx+' ny '+ny+' dist '+d);
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

    turn(rc){
        super.turn(rc);
        if(this.enemyInSight()){
            var micro = this.doMicro();
            if(micro)
                return micro;
        }
        if(!this.attacking && this.switchTurn<=this.me.turn){
            this.attacking = true;
            this.updateTarget(this.reflect(this.createdBy[0],this.createdBy[1]));
            //this.log('T '+this.target);
            this.secondaryTarget = this.target;
        }
        if(this.attacking&&!this.stopChecks)
            this.moveOnToSecondaryIfNeeded();
        var nav_weights = (this.attacking?params.ATT_NAV_WEIGHTS:params.DEF_NAV_WEIGHTS);
        //if(this.manhattan(this.target[0],this.target[1],this.me.x,this.me.y)>1)
        return this.navTo(this.targetDists,this.target,nav_weights,true);
        //return null;
    }

    moveOnToSecondaryIfNeeded(){
        if(this.targetDead()){
            this.log('hi');
            if(this.target==this.secondaryTarget){
                this.stopChecks=true;
            }
            this.updateTarget(this.secondaryTarget);
            this.castleDead=true;
        }
    }

    targetDead(){
        var id = this.visRobotMap[this.target[1]][this.target[0]];
        if(id==0)
            return true;
        return id>0 && this.rc.getRobot(id).team==this.me.team;
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

    enemyInSight(){
        var visRobots = this.rc.getVisibleRobots();
        for(var i=0;i<visRobots.length;i++){
            var r = visRobots[i];
            if(r.team != null && r.x!= null && r.team != this.me.team){
                return true;
            }
        }
        return false;
    }

}
