import {SPECS} from 'battlecode'; 

export var DEBUG=true;

//desired unit comps: [castle,church,pilgrim,crusader,prophet,preacher]
export var BALANCED_UNIT_COMP=[0,0,2,5,0,0];

//nav weights; movement vs. fuel efficiency vs. splash resistance
export var DEF_NAV_WEIGHTS=[3,2,20];
export var ATT_NAV_WEIGHTS=[10,1,20];
export var PILGRIM_NAV_WEIGHTS=[10,1,0];
