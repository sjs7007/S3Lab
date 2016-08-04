import time 
import sys
import signal
import os

def stopHandler(x,y): 
	print "SIGSTP received."
	sys.stdout.flush()
	os.kill(os.getpid(), signal.SIGSTOP)

def contHandler(x,y):
	print "SIGCONT received. Starting process again."
	sys.stdout.flush()

signal.signal(signal.SIGTSTP,stopHandler)
signal.signal(signal.SIGCONT,contHandler)

for i in range(1,105):
    time.sleep(1)
    print i
    sys.stdout.flush()
