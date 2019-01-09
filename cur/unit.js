import * as params from 'params.js';
import {SPECS} from 'battlecode'; 
export class Unit{
    constructor(rc){
        this.mapSize= rc.map.length;
        this.rc= rc;
        this.me= rc.me;
        this.adjMoves = [[-1,0],[1,0],[0,-1],[0,1]];
        this.adjDiagMoves = [[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[-1,1],[1,-1],[1,1]];
    }

    updateInfo(rc){
        this.rc = rc;
        this.me = rc.me;
        this.visRobotMap = this.rc.getVisibleRobotMap();
    }

    sendCastleTalk(){
        this.rc.castleTalk(this.me.unit+1);
    }

    turn(rc){
        this.updateInfo(rc);
        this.sendCastleTalk();
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
            if(r.x==null || r.team==this.me.team)
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

}
