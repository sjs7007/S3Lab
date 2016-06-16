# user input : size of image ( width, height) , number of classification categories (nClass) , number of training steps = nTrain
# learning rate : alpha, zipFileName : 


import tensorflow.examples.tutorials.mnist.input_data
import input_data
import zipfile
import sys, json
import os

print(os.getcwd())
#change directory to that of script
abspath = os.path.abspath(__file__)
dname = os.path.dirname(abspath)
os.chdir(dname)
print(os.getcwd())
