import sys
import argparse
from multiprocessing import Pool,cpu_count
import subprocess
from itertools import product

#x failed to initalize
#game over, x won

def run_game(t0,t1,n):
    red = t1 if n%2 else t0
    blue = t0 if n%2 else t1
    result = subprocess.run(['bc19run','-r',red,'-b',blue],stdout=subprocess.PIPE)
    winner = -1
    splitl = result.stdout.splitlines()
    resline = splitl[-1]
    splitres = resline.split()
    l1 = splitres[0].decode('utf-8')
    w2 = splitres[2].decode('utf-8')
    if l1=='Red' or w2=='blue':
        winner = 1
    elif l1=='Blue' or w2=='red':
        winner = 0
    if n%2:
        winner=1-winner
    print(winner)
    return winner

def main():
    parser = argparse.ArgumentParser(description='yay archon testing')
    parser.add_argument('t0')
    parser.add_argument('t1')
    parser.add_argument('-n',help='num games played',type=int,dest='num_games',default=10)
    parser.add_argument('-w',help='num workers',type=int,dest='num_workers',default=3)
    args = parser.parse_args()
    pool = Pool(processes=args.num_workers)
    t0wins=0
    t1wins=0
    for result in pool.starmap(run_game,product([args.t0],[args.t1],range(args.num_games))):
        if result == 1:
            t1wins+=1
        elif result == 0:
            t0wins+=1
    print('RESULT: t0 {} t1 {}'.format(t0wins,t1wins))
    pool.close()
    pool.join()

main()
