import numpy as np
import scipy
import scipy.ndimage 
import tensorflow as tf 
import sys
import os
import json

#print(os.getcwd())
#change directory to that of script
abspath = os.path.abspath(__file__)
dname = os.path.dirname(abspath)
os.chdir(dname)
#print(os.getcwd())


ip = sys.stdin.readlines()[0]
jsonIn = json.loads(ip)
imPath = jsonIn["imPath"]
modelPath = jsonIn["modelPath"]
modelDir = os.path.dirname(__file__)
modelPath = os.path.join(modelDir,".."+modelPath)
print (imPath,modelPath)

img = scipy.ndimage.imread(imPath)

size = np.shape(img)[0] * np.shape(img)[1]

x = tf.placeholder(tf.float32, [None, size])
W = tf.Variable(tf.zeros([size, 10]))
b = tf.Variable(tf.zeros([10]))
y = tf.nn.softmax(tf.matmul(x, W) + b)
y_ = tf.placeholder(tf.float32, [None, 10])
cross_entropy = -tf.reduce_sum(y_*tf.log(y))
train_step = tf.train.GradientDescentOptimizer(0.01).minimize(cross_entropy)
init = tf.initialize_all_variables()

saver = tf.train.Saver()

sess = tf.Session()
sess.run(init)

saver.restore(sess, modelPath) 


print sess.run(tf.argmax(y,1), feed_dict={x: np.reshape(  img , (1,size) )  })[0]
