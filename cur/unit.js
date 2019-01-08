import * as params from 'params.js';
import {SPECS} from 'battlecode'; 
export class Unit{
    constructor(rc){
        this.step= -1;
        this.mapSize= rc.map.length;
        this.rc= rc;
        this.r= rc.me;
    }

    updateInfo(rc){
        this.step++;
        this.rc = rc;
        this.r = rc.me;
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

    reflect(y,x){
        if(!this.symmetry)
            this.symmetry = this.determineSymmetry();
        this.log(String(this.symmetry));
        if(this.symmetry==1){
            return [y,this.mapSize-x-1];
        }
        else{
            return [this.mapSize-y-1,x];
        }
    }

}
