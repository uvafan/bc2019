import {SPECS} from 'battlecode';
import * as strategies from 'strategy.js'; import * as params from 'params.js';

export class Objective {
    constructor(r,tar,th){
        this.round=r-1;
        this.target=tar;
        this.th = th;
        this.assignees=[];
        this.assigneesToTarg={};
        this.assigneesToUnit={};
        this.targNum=0;
        this.isCastle = th.me.unit==SPECS['CASTLE'];
    }

    log(s){
        this.th.log(s);
    }

    objInfo(){
        return String(this.typeStr)+' t: '+String(this.target);
    }

    getPriority(strat,karb,fuel){
        return this.getPriorityStratAgnostic(karb,fuel)*strat.objWeights(this.round)[this.type];
    }

    updateAssignees(idsAlive){
        var newAssignees=[];
        this.unitCounts = [0,0,0,0,0,0];
        for(var i=0;i<this.assignees.length;i++){
            var a = this.assignees[i];
            if(idsAlive.includes(a)){
                newAssignees.push(a);
                this.unitCounts[this.assigneesToUnit[a]]++;
            }
        }
        this.assignees = newAssignees;
    }

    assign(id,unit){
        this.assignees.push(id);
        this.assigneesToTarg[id]=this.targNum;
        this.assigneesToUnit[id]=unit;
    }

    unitNeeded(strat){
        return strat.getUnitNeeded(this,this.round);
    }

}

export class gatherKarb extends Objective {
    constructor(r,tar,th,dfm){
        super(r,tar,th);
        this.distFromMe = dfm;
        this.typeStr = 'GATHER_KARBONITE';
        this.type=0;
    }

    getPriorityStratAgnostic(karb,fuel){
        if(this.assignees.length)
            return 0;
        var karbNeeded = (karb*10>fuel?0:1);
        var distScore = Math.max(100-this.distFromMe,.5);
        return distScore/(karbNeeded?1:2);
    }
}

export class gatherFuel extends Objective {
    constructor(r,tar,th,dfm){
        super(r,tar,th);
        this.distFromMe = dfm;
        this.typeStr = 'GATHER_FUEL';
        this.type=1;
    }

    getPriorityStratAgnostic(karb,fuel){
        if(this.assignees.length)
            return 0;
        var karbNeeded = (karb*10>fuel?0:1);
        var distScore = Math.max(100-this.distFromMe,.5);
        return distScore/(karbNeeded?2:1);
    }
}

export class defendPilgrim extends Objective {
    constructor(r,tar,th){
        super(r,tar,th);
        this.typeStr = 'DEFEND_PILGRIM';
        this.type=2;
    }

    getPriorityStratAgnostic(karb,fuel){
        return this.assignees.length?1:20;
    }
}

export class attackEnemy extends Objective {
    constructor(r,tar,th,dfm){
        super(r,tar,th);
        this.distFromMe=dfm;
        this.typeStr = 'ATTACK_ENEMY';
        this.type=3;
    }

    getPriorityStratAgnostic(karb,fuel){
        var distScore = Math.max(30-this.distFromMe,1); //this.log('al '+this.assignees.length);
        return this.assignees.length*10+distScore;
    }

    processFoundDead(id,ecl){
        if(!this.assignees.includes(id))
            return false;
        this.assigneesToTarg[id]++;
        if(this.assigneesToTarg[id]>this.targNum){
            this.targNum++;
            this.log('tn '+this.targNum);
            this.log('ecl '+ecl);
            this.target = ecl[1];
            this.distFromMe = this.th.manhattan(ecl[1][0],ecl[1][1],this.th.me.x,this.th.me.y);
            return true;
        }
        return false;
    }
}

export class defendCastle extends Objective {
    constructor(r,tar,th,dfe){
        super(r,tar,th);
        this.defenseLoc = this.target;
        this.manDistFromEnemy = dfe;
        this.typeStr = 'DEFEND_CASTLE';
        this.type=4;
        this.initializeDefenseSpots();
        this.assigneeToIdx={};
        this.eLoc = this.th.reflect(this.th.me.x,this.th.me.y);
    }

    getPriorityStratAgnostic(karb,fuel){
        //return Math.max(230-this.distFromEnemy-numDefenders*15,1);
        var numDefenders = this.assignees.length;
        var enemiesInSight = this.th.getEnemiesInSight();
        var dangerScore = (enemiesInSight.length-numDefenders)*100;
        if(this.round<50&&this.isCastle){
            //return Math.max(40-this.manDistFromEnemy/2-numDefenders*10,Math.max(dangerScore,(this.isCastle?4:1)));
            return Math.max(dangerScore,10-numDefenders);
        }
        else{
            return Math.max(40-this.manDistFromEnemy/5-numDefenders*2,Math.max(dangerScore,(this.isCastle?4:1)));
        }
    }

    initializeDefenseSpots(){
        var dist = [];
        for(var x=0;x<this.th.mapSize;x++){
            dist.push([]);
            for(var y=0;y<this.th.mapSize;y++){
                dist[x].push(Number.MIN_SAFE_INTEGER);
            }
        }
        var q = [[this.defenseLoc[0],this.defenseLoc[1]]];
        dist[this.defenseLoc[0]][this.defenseLoc[1]]=0;
        var moves = [[1,1],[1,-1],[-1,1],[-1,-1]];
        this.defenseSpots = [];
        this.spotTaken=[];
        var evenMoves = [[0,1],[0,-1],[1,0],[-1,0]];
        var firstTurn = 1;
        while(q.length>0){
            var u = q.shift();
            var x=u[0];
            var y=u[1];
            if(firstTurn == 1){
                if((this.defenseLoc[0] + this.defenseLoc[1])%2 == 0){
                    for(var i=0;i<evenMoves.length;i++){
                        var nx=x+evenMoves[i][0];
                        var ny=y+evenMoves[i][1];
                        if(this.th.offMap(nx,ny)||dist[nx][ny]>-1||(!this.isCastle&&this.th.distBtwnP(this.defenseLoc[0],this.defenseLoc[1],nx,ny)>100)||(!params.USE_LATTICE && (this.defenseLoc[0] == nx || this.defenseLoc[1] == ny)) )
                            continue;
                        dist[nx][ny]=dist[x][y]+1;
                        if(!this.th.rc.karbonite_map[ny][nx]&&!this.th.rc.fuel_map[ny][nx]&&this.th.isPassable(nx,ny)){
                            this.defenseSpots.push([nx,ny]);
                            this.spotTaken.push(false);
                        }
                        q.push([nx,ny]);
                    }
                    firstTurn = 0;
                    continue;
                }
                firstTurn = 0;

            }
            for(var i=0;i<moves.length;i++){
                var nx=x+moves[i][0];
                var ny=y+moves[i][1];
                if(this.th.offMap(nx,ny)||dist[nx][ny]>-1||(!this.isCastle&&this.th.distBtwnP(this.defenseLoc[0],this.defenseLoc[1],nx,ny)>100)||(!params.USE_LATTICE && (this.defenseLoc[0] == nx || this.defenseLoc[1] == ny)) )
                    continue;
                dist[nx][ny]=dist[x][y]+1;
                if(!this.th.rc.karbonite_map[ny][nx]&&!this.th.rc.fuel_map[ny][nx]&&this.th.isPassable(nx,ny)){
                    this.defenseSpots.push([nx,ny]);
                    this.spotTaken.push(false);
                }
                q.push([nx,ny]);
            }

        }

    }

    updateTarget(){
        var candidates = 0;
        var bestScore = Number.MIN_SAFE_INTEGER;
        var enemyLoc = this.eLoc;
        var enemiesInSight = this.th.getEnemiesInSight();
        if(enemiesInSight.length>0){
            var minDist = Number.MAX_SAFE_INTEGER;
            for(var i=0;i<enemiesInSight.length;i++){
                var d = this.th.distBtwnP(enemiesInSight[i].x,enemiesInSight[i].y,this.defenseLoc[0],this.defenseLoc[1]);
                if(d<minDist){
                    enemyLoc = [enemiesInSight[i].x,enemiesInSight[i].y];
                    minDist=d;
                }
            }
        }
        this.targetIdx = 20;
        var dte = this.th.distBtwnP(enemyLoc[0],enemyLoc[1],this.defenseLoc[0],this.defenseLoc[1]);
        for(var i=0;i<this.spotTaken.length;i++){
            if(this.spotTaken[i])
                continue;
            var loc = this.defenseSpots[i];
            var d = this.th.distBtwnP(enemyLoc[0],enemyLoc[1],loc[0],loc[1]);
            //this.log('loc ' + loc +' eloc '+enemyLoc+ ' d '+d);
            if(this.unitNeeded(this.th.strat)==SPECS['PROPHET']&&d<SPECS.UNITS[SPECS['PROPHET']]['ATTACK_RADIUS'][0]&&enemiesInSight.length>0){
                continue;
            }
            candidates++;
            var differential = dte-d;
            var dfm = this.th.distBtwnP(this.defenseLoc[0],this.defenseLoc[1],loc[0],loc[1]);
            var score = ((differential>=0?1000:0)-dfm);
            if(score>bestScore){
                bestScore=score;
                this.targetIdx=i;
            }
            if(candidates==params.LATTICE_CANDIDATES)
                break;
        }
        this.target = this.defenseSpots[this.targetIdx];
    }

    assign(id,unit){
        super.assign(id,unit);
        this.assigneeToIdx[id] = this.targetIdx;
        this.spotTaken[this.targetIdx]=true;
    }

    /*takeInventory(){
        for(var i=0;i<this.spotTaken.length;i++){
            this.spotTaken[i]=(this.th.visRobotMap[this.defenseSpots[i][1]][this.defenseSpots[i][0]]>0);
        }
    }*/

    updateAssignees(idsAlive){
        super.updateAssignees(idsAlive);
        for(var i=0;i<this.spotTaken.length;i++){
            this.spotTaken[i]=false;
        }
        for(var i=0;i<this.assignees.length;i++){
            this.spotTaken[this.assigneeToIdx[this.assignees[i]]]=true;
        }
    }

}

export class harassPilgrim extends Objective {
    constructor(r,tar,th,dfe,dfm){
        super(r,tar,th);
        this.distFromEnemy=dfe;
        this.distFromMe=dfm;
        this.type=5;
        this.typeStr = 'HARASS_PILGRIM';
    }

    getPriorityStratAgnostic(karb,fuel){
        //this.log('dfm '+this.distFromEnemy);
        if(this.distFromEnemy<20)
            return 0;
        var p = Math.max(3-this.assignees.length-this.distFromMe/100,1)
        //this.log('p '+p);
        return p;
    }
}

export class buildChurch extends Objective {
    constructor(r,tar,th,dfe,dfm){
        super(r,tar,th);
        this.distFromEnemy=dfe;
        this.distFromMe=dfm;
        this.typeStr = 'BUILD_CHURCH';
        this.type=6;
    }

    getPriorityStratAgnostic(karb,fuel){
        var differential = Math.sqrt(this.distFromEnemy)-Math.sqrt(this.distFromMe);
        if(this.assignees.length||differential<-10)
            return 0;
        return Math.max((differential>0?50-differential:0),20);
    }
}


