import numpy as np
import scipy
import scipy.ndimage 
import tensorflow as tf 
import sys


impath = sys.stdin.readlines()
print impath[1,len(impath-1)]
img = scipy.ndimage.imread(impath)

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

saver.restore(sess, "mnist.ckpt") 


print sess.run(tf.argmax(y,1), feed_dict={x: np.reshape(  img , (1,size) )  })[0]
