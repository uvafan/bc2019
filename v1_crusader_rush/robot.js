import {BCAbstractRobot, SPECS} from 'battlecode'; 
import {Castle} from 'castle.js';
import {Church} from 'church.js';
import {Prophet} from 'prophet.js';
import {Preacher} from 'preacher.js';
import {Crusader} from 'crusader.js';
import {Pilgrim} from 'pilgrim.js';
import * as params from 'params.js';

class MyRobot extends BCAbstractRobot {
    turn() {
        if(this.unit==null){
            switch(this.me.unit){
                case SPECS.CASTLE: this.unit = new Castle(this);break;
                case SPECS.CHURCH: this.unit = new Church(this);break;
                case SPECS.PROPHET: this.unit = new Prophet(this);break;
                case SPECS.PREACHER: this.unit = new Preacher(this);break;
                case SPECS.CRUSADER: this.unit = new Crusader(this);break;
                case SPECS.PILGRIM: this.unit = new Pilgrim(this);break;
                default: this.log('this should not be happening.');
            }
        }

        return this.unit.turn(this);
    }
}

var robot = new MyRobot();
