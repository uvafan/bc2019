import {SPECS} from 'battlecode'; 

export var DEBUG=true;

//old defense stuff
export var DEFENDERS_ATTACK_ROUND=10000;
export var DEFENSIVE_PROPHET_DISTANCE=5;
export var DEFENSIVE_PREACHER_DISTANCE=5;

//desired unit comps: [castle,church,pilgrim,crusader,prophet,preacher]
//export var BALANCED_UNIT_COMP=[0,0,2,5,0,0];

//nav weights; movement vs. fuel efficiency vs. splash resistance
export var DEF_NAV_WEIGHTS=[2,1,0];
export var ATT_NAV_WEIGHTS=[10,1,0];
export var PILGRIM_NAV_WEIGHTS=[10,1,0];

export var STOP_PENALTY=3;

export var MINING_DISTANCE=50;

//fuel/karb management
export var MIN_FUEL_SAVE=200;
export var MIN_KARB_SAVE=50;
export var FUEL_SAVE_ROUND_MULTIPLIER=7;
export var KARB_SAVE_ROUND_MULTIPLIER=0.5;

//new defense stuff
export var LATTICE_CANDIDATES=5;
export var ATTACK_NOW=800;

export var RANDOM_ONE=22636;
export var RANDOM_TWO=55580;

