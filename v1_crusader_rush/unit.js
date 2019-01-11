import * as params from 'params.js';
import {SPECS} from 'battlecode'; 
export class Unit{
    constructor(rc){
        this.step= -1;
        this.mapSize= rc.map.length;
        this.rc= rc;
        this.me= rc.me;
        this.adjMoves = [[-1,0],[1,0],[0,-1],[0,1]];
        this.adjDiagMoves = [[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[-1,1],[1,-1],[1,1]];
    }

    updateInfo(rc){
        this.step++;
        this.rc = rc;
        this.me = rc.me;
        this.visRobotMap = this.rc.getVisibleRobotMap();
    }

    turn(rc){
        this.updateInfo(rc);
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
        return this.isPassable(x,y) && this.visRobotMap[y][x]<=0;
    }

    distBtwn(r0,r1){
        return (r0.x-r1.x)*(r0.x-r1.x)+(r0.y-r1.y)*(r0.y-r1.y);
    }

}
