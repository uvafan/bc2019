from battlecode import BCAbstractRobot, SPECS
import battlecode as bc
import random

__pragma__('iconv')
__pragma__('tconv')
#__pragma__('opov')

# don't try to use global variables!!
class MyRobot(BCAbstractRobot):
    def __init__(self):
        super().__init__()
        if self.me['unit'] == SPECS['CASTLE']:
            self.me_irl = Castle()
        self.step = -1

    def turn(self):
        self.step += 1
        self.log("START TURN " + self.step)
        if self.me['unit'] == SPECS['CRUSADER']:
            self.log("Crusader health: " + str(self.me['health']))
            # The directions: North, NorthEast, East, SouthEast, South, SouthWest, West, NorthWest
            choices = [(0,-1), (1, -1), (1, 0), (1, 1), (0, 1), (-1, 1), (-1, 0), (-1, -1)]
            choice = random.choice(choices)
            self.log('TRYING TO MOVE IN DIRECTION ' + str(choice))
            return self.move(*choice)

        elif self.me['unit'] == SPECS['CASTLE']:
            act = self.me_irl.takeTurn()
            if act:
                return act
            '''
            if self.step < 10:
                self.log("Building a crusader at " + str(self.me['x']+1) + ", " + str(self.me['y']+1))
                return self.build_unit(SPECS['CRUSADER'], 1, 1)
            else:
                self.log("Castle health: " + self.me['health'])
                '''

robot = MyRobot()

class Castle(MyRobot):
    def takeTurn(self):
        if self.step < 10:
            self.log("Building a crusader at " + str(self.me['x']+1) + ", " + str(self.me['y']+1))
            return self.build_unit(SPECS['CRUSADER'], 1, 1)
        else:
            self.log("Castle health: " + self.me['health'])



'''
class Castle:
    @staticmethod
    def takeTurn(robot):
        r = robot.me
        if robot.step < 10:
            robot.log("Building a crusader at " + str(r['x']+1) + ", " + str(r['y']+1))
            return robot.build_unit(SPECS['CRUSADER'], 1, 1)
        else:
            robot.log("Castle health: " + r['health'])
'''
