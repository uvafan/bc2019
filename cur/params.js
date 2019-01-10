import {SPECS} from 'battlecode'; 

export var DEBUG=true;

//desired unit comps: [castle,church,pilgrim,crusader,prophet,preacher]
export var BALANCED_UNIT_COMP=[0,0,2,5,0,0];

//nav weights; movement vs. fuel efficiency
export var DEF_CRUSADER_NAV_WEIGHTS=[2,3];
export var OFF_CRUSADER_NAV_WEIGHTS=[10,1];
export var PILGRIM_NAV_WEIGHTS=[10,1];
