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
export var FUEL_KARB_RATIO=10;

//new defense stuff
export var LATTICE_CANDIDATES=10;
export var ATTACK_NOW=700;
export var MAKE_STUFF=950;
export var USE_LATTICE=1;

//signaling stuff
export var RANDOM_ONE=22636;
export var RANDOM_TWO=55580;
export var MAKE_STUFF_SIGNAL=35782;

//turn precision
export var PILGRIM_TURN_ARRAY = [0,25,50,80,150,250,400,700];

//attacking priorities: [CASTLE,CHURCH,PILGRIM,CRUSADER,PROPHET,PREACHER]
export var ATTACK_PRIORITIES = [1,1,1.5,3,3,5];
