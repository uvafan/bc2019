import {Robot} from 'myrobot.js';
import {SPECS} from 'battlecode';
import * as params from 'params.js';
export class CombatUnit extends Robot{
	constructor(rc){
		super(rc);
		this.createdBy=[];
		this.switchTurn=params.DEFENDERS_ATTACK_ROUND-150;
		this.castleDead = false;
		this.stopChecks = false;
		this.harassing = false;
		this.everDefended = false;
		this.getFirstTarget();
		this.prelimTrusted=[];
		this.trusted=[];
		this.exploreDir = -1;
	}

	getFirstTarget(){
		var visRobots = this.rc.getVisibleRobots();
		for(var i=0;i<visRobots.length;i++){
			var r = visRobots[i];
			if(r.team==this.me.team&&this.distBtwnP(r.x,r.y,this.me.x,this.me.y)<=2&&(r.unit==SPECS['CASTLE']||r.unit==SPECS['CHURCH'])){
				this.offset = r.signal>>15;
				var locb = r.signal&((1<<15)-1);
				this.createdBy = [r.x,r.y];
				if(locb&(1<<12)){
					this.attacking = false;
					var target;
					if(locb&(1<<13)){
						//var currentRound = locb^((1<<12)+(1<<13));
						//this.switchTurn = params.DEFENDERS_ATTACK_ROUND-currentRound;
						target = this.getLocFromBroadcast(locb^((1<<12)+(1<<13)));
						this.switchTurn=1001;
					}
					else{
						target = this.getLocFromBroadcast(locb^(1<<12));
					}
					//var defensiveDistance = (this.me.unit==SPECS['PROPHET']?params.DEFENSIVE_PROPHET_DISTANCE:params.DEFENSIVE_PREACHER_DISTANCE);
					this.everDefended=true;
					this.updateTarget(target);
					//this.updateTarget(this.stepTowards(target,this.reflect(r.x,r.y),defensiveDistance));
					//this.log('T '+this.target);
				}
				else if(locb&(1<<14)){
					this.attacking=true;
					this.harassing=true;
					var bloc = this.getLocFromBroadcast(locb^(1<<14));
					this.updateTarget(bloc);
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
		if((!this.attacking||this.harassing) && this.switchTurn<=this.me.turn){
			this.attacking = true;
			this.harassing = false;
			this.updateTarget(this.reflect(this.createdBy[0],this.createdBy[1]));
			//this.log('T '+this.target);
			this.secondaryTarget = this.target;
		}
		if(this.me.turn>1){
			this.processSignals();
		}
		if(this.attacking&&!this.harassing&&!this.stopChecks)
			this.moveOnToSecondaryIfNeeded();
		var nav_weights = (this.attacking?params.ATT_NAV_WEIGHTS:params.DEF_NAV_WEIGHTS);
		//if(this.manhattan(this.target[0],this.target[1],this.me.x,this.me.y)>1)
		if(!this.attacking && !this.isWalkable(this.target[0],this.target[1])){
			this.pickBetterTarget();
		}
		var move = this.navTo(this.targetDists,this.target,nav_weights,true,true);
		if(move)
			return move;
		return this.giveBack(this.createdBy);
		//return null;
	}
	pickBetterTarget(){
		var dist = this.getDxDyWithin(0,SPECS.UNITS[this.me.unit]['VISION_RADIUS'])
        var moves = [[1,1],[1,-1],[-1,1],[-1,-1]];
		for(var i = 0; i < dist.length; i++){
			var nx = this.target[0]+dist[i][0];
			var ny = this.target[1]+dist[i][1];
			if(!this.offMap(nx,ny) && !this.rc.karbonite_map[ny][nx] && !this.rc.fuel_map[ny][nx] && this.isWalkable(nx,ny)){
                if((dx+dy)%2 == 0){
				var newTarget = [nx,ny];
				this.log("Switching from old target:")
				this.log(this.target);
				this.log("to new target");
				this.log(newTarget);
				this.updateTarget(newTarget);
				return;
                }
                if(nx%2 == 0 && ny %2 == 0){
                    var score = 0;
                    for(var j = 0; j < moves.length; j++){
                        var nnx = nx + moves[j][0];
                        var nny = ny + moves[j][1];
                        if(this.th.rc.karbonite_Map[nny][nnx] || this.th.rc.fuel_map[nny][nnx] || !this.th.isPassable(nnx,nny))
                            score++;

                    }
                    if(score <= 1){
				var newTarget = [nx,ny];
				this.log("Switching from old target:")
				this.log(this.target);
				this.log("to new SCARY target");
				this.log(newTarget);
				this.updateTarget(newTarget);
				return;

                    }
                }

			}
		}
		if(this.exploreDir == -1){
			this.exploreDir = Math.floor(Math.random()*4);
		}
		var moves = [[1,1],[1,-1],[-1,1],[-1,-1]];
		var nx = this.target[0] + moves[this.exploreDir][0];
		var ny = this.target[1] + moves[this.exploreDir][1];
		var sad = 0;
		while(this.offMap(nx,ny) || !this.isPassable(nx,ny)){
			sad++;
			if(sad == 10){
				this.log("Couldn't find a good target :( ");
				return this.target;

			}
			this.exploreDir = Math.floor(Math.random()*4);
			nx = this.target[0] + moves[this.exploreDir][0];
			ny = this.target[1] + moves[this.exploreDir][1];
		}
		var newTarget = [nx,ny];
		this.log("Switching from old target:")
		this.log(this.target);
		this.log("to new BAD target");
		this.log(newTarget);

		this.updateTarget(newTarget);
	}

	processSignals(){
		var visRobots = this.rc.getVisibleRobots();
		//this.log('x '+this.me.x+' y '+this.me.y+' processing');
		for(var i=0;i<visRobots.length;i++){
			var r = visRobots[i];
			if(r.signal==params.RANDOM_ONE){
				this.prelimTrusted.push(r.id);
			}
			if(r.signal==params.RANDOM_TWO&&this.prelimTrusted.includes(r.id)){
				this.trusted.push(r.id);
			}
			if(r.signal>0&&this.trusted.includes(r.id)){
				//this.log('hi '+r.signal+ ' id '+r.id);
				if(r.signal==params.MAKE_STUFF_SIGNAL)
					continue;
				var loc = this.getLocFromBroadcast(r.signal);
				//this.log('sup '+' l0 '+loc[0]+' l1 '+loc[1]);
				if(this.offMap(loc[0],loc[1]))
					continue;
				//this.log('sup '+' l0 '+loc[0]+' l1 '+loc[1]);
				if(!this.attacking){
					this.attacking=true;
					this.target=loc;
				}
				else{
					var distToLoc = this.distBtwnP(loc[0],loc[1],this.me.x,this.me.y);
					var distToTarget = this.distBtwnP(this.target[0],this.target[1],this.me.x,this.me.y);
					if(distToLoc<distToTarget){
						this.secondaryTarget=this.target;
						this.target=loc;
					}
					else if(this.target[0]!=loc[0]||this.target[1]!=loc[1]){
						this.secondaryTarget=loc;
					}
				}
			}
		}
	}

	moveOnToSecondaryIfNeeded(){
		if(this.targetDead()){
			//this.log('td '+this.target);
			if(this.target[0]==this.secondaryTarget[0]&&this.target[1]==this.secondaryTarget[1]){
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
