import {BCAbstractRobot, SPECS} from 'battlecode'; 
import {Castle} from 'castle.js';
import {Church} from 'church.js';
import {Prophet} from 'prophet.js';
import {Preacher} from 'preacher.js';
import {Crusader} from 'crusader.js';
import {Pilgrim} from 'pilgrim.js';
import * as params from 'params.js';

class MyRobot extends BCAbstractRobot {

    constructor(){
        super();
        this.step = -1;
    }

    turn() {
        this.step++;

        if(this.unit==null){
            switch(this.me.unit){
                case SPECS.CASTLE: this.unit = new Castle();break;
                case SPECS.CHURCH: this.unit = new Church();break;
                case SPECS.PROPHET: this.unit = new Prophet();break;
                case SPECS.PREACHER: this.unit = new Preacher();break;
                case SPECS.CRUSADER: this.unit = new Crusader();break;
                case SPECS.PILGRIM: this.unit = new Pilgrim();break;
                default: this.log('this should not be happening.');
            }
        }

        return this.unit.takeTurn(this);
    }
}

var robot = new MyRobot();

