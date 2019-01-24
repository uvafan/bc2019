import * as params from 'params.js';
import {SPECS} from 'battlecode';
export class Unit{
    constructor(rc){
        this.mapSize = rc.map.length;
        this.rc = rc;
        this.me = rc.me;
        this.adjMoves = [[-1,0],[1,0],[0,-1],[0,1]];
        this.adjDiagMoves = [[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[-1,1],[1,-1],[1,1]];
        this.visRobotMap = this.rc.getVisibleRobotMap();
        this.attackRadius = SPECS.UNITS[this.me.unit]['ATTACK_RADIUS'];
        this.attackCost = SPECS.UNITS[this.me.unit]['ATTACK_FUEL_COST'];
    }

    getDxDyWithin(min,max){
        var ret = [];
        for(var dx=0;dx*dx<=max;dx++){
            for(var dy=0;dy*dy<=max;dy++){
                if(dx*dx+dy*dy<=max&&dx*dx+dy*dy>=min){
                    ret.push([dx,dy]);
                    if(dx>0||dy>0)
                        ret.push([-dx,-dy]);
                    if(dx>0 && dy>0){
                        ret.push([-dx,dy]);
                        ret.push([dx,-dy]);
                    }
                }
            }
        }
        return ret;
    }
    getDxDyOddWithin(min,max){
        var ret = [];
        for(var dx=0;dx*dx<=max;dx++){
            for(var dy=0;dy*dy<=max;dy++){
                if(dx*dx+dy*dy<=max&&dx*dx+dy*dy>=min){
                    if((dx+dy)%2 == 0){
                        ret.push([dx,dy]);
                        if(dx>0||dy>0)
                            ret.push([-dx,-dy]);
                        if(dx>0 && dy>0){
                            ret.push([-dx,dy]);
                            ret.push([dx,-dy]);
                        }
                    }
                }
            }
        }
        ret.sort(function(a,b){return a[0]+a[1] - b[0] - b[1]});
        return ret;
    }

    turn(rc){
        this.updateInfo(rc);
        if(this.me.unit!=SPECS['Castle']||this.me.turn>2)
            this.sendCastleTalk();
    }

    updateInfo(rc){
        this.rc = rc;
        this.me = rc.me;
        this.visRobotMap = this.rc.getVisibleRobotMap();
    }

    sendCastleTalk(){
        var msg = 0;
        if(this.me.turn==1){
            msg=this.me.unit;
        }
        else if((this.me.turn+this.offset)%2==0){
            msg=this.me.x;
        }
        else if((this.me.turn+this.offset)%2==1){
            msg=this.me.y;
            this.rc.castleTalk(2);
            this.castleDead=false;
        }
        if(this.castleDead&&!this.everDefended){
            msg+=(1<<6);
            this.castleDead=false; 
        }
        this.rc.castleTalk(msg);
    }

    getBroadcastFromLoc(loc){
        return loc[0]*64+loc[1];
    }

    getLocFromBroadcast(b){
        return [Math.floor(b/64),b%64];
    }

    //0 is horiz, 1 is vert
    determineSymmetry(){
        for(var x=0;x<this.mapSize;x++){
            for(var y=0;y<=this.mapSize/2;y++){
                if(this.rc.map[y][x]!=this.rc.map[this.mapSize-y-1][x])
                    return 1;
            }
        }
        return 0;
    }

    log(s){
        if(!params.DEBUG)
            return;
        if(this.me.unit==SPECS['CASTLE'])
            this.rc.log('Round '+this.me.turn+': '+s);
        else
            this.rc.log(s);
    }

    reflect(x,y){
        if(!this.symmetry)
            this.symmetry = this.determineSymmetry();
        if(this.symmetry==1){
            return [this.mapSize-x-1,y];
        }
        else{
            return [x,this.mapSize-y-1];
        }
    }

    offMap(x,y){
        return x<0||x>=this.mapSize||y<0||y>=this.mapSize;
    }

    //on map and is passable
    isPassable(x,y){
        return !this.offMap(x,y) && this.rc.map[y][x];
    }

    //can walk there on this turn
    isWalkable(x,y){
        return this.isPassable(x,y) && (this.visRobotMap[y][x]<=0 || this.visRobotMap[y][x]==this.me.id);
    }

    isSafe(x,y){
        var visRobots = this.rc.getVisibleRobots();
        for(var i=0;i<visRobots.length;i++){
            var r=visRobots[i];
            if(r.x==null || r.team==this.me.team || r.unit==null)
                continue;
            var d = this.distBtwnP(x,y,r.x,r.y);
            var attack_rad = SPECS.UNITS[r.unit]['ATTACK_RADIUS'];
            if(!attack_rad||d<attack_rad[0]||d>attack_rad[1])
                continue;
            return false;
        }
        return true;
    }

    distBtwn(r0,r1){
        return this.distBtwnP(r0.x,r0.y,r1.x,r1.y);
    }

    distBtwnP(x0,y0,x1,y1){
        return (x0-x1)*(x0-x1)+(y0-y1)*(y0-y1);
    }

    manhattan(x0,y0,x1,y1){
        return Math.abs(x1-x0)+Math.abs(y1-y0);
    }

    locsEqual(l0,l1){
        return l0[0]==l1[0]&&l0[1]==l1[1];
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

    getEnemiesInSight(){
        var visRobots = this.rc.getVisibleRobots();
        var ret= [];
        for(var i=0;i<visRobots.length;i++){
            var r = visRobots[i];
            if(r.x!=null && r.unit != null && r.team!=this.me.team){
                ret.push(r);
            }
        }
        return ret;
    }


    centroid(locs){
        var xSum=0;
        var ySum=0;
        for(var i=0;i<locs.length;i++){
            xSum+=locs[i][0];
            ySum+=locs[i][1];
        }
        return [Math.round(xSum/locs.length),Math.round(ySum/locs.length)];
    }

}
