# user input : size of image ( width, height) , number of classification categories (nClass) , number of training steps = nTrain
# learning rate : alpha, zipFileName : 


import tensorflow.examples.tutorials.mnist.input_data
import input_data
import zipfile
import sys, json

#lines = sys.stdin.readlines()
#print lines[0]
lines = '{"width":"28","height":"28","nClass":"10","alpha":"0.01"}'


paramtersDict = json.loads(lines)
print paramtersDict

zip_ref = zipfile.ZipFile("MNIST_data.zip", 'r')
zip_ref.extractall()
zip_ref.close()


mnist = input_data.read_data_sets("MNIST_data", one_hot=True)

import tensorflow as tf

size = int(paramtersDict['width']) * int(paramtersDict['height'])
print "Input Vector Length : ",size

nClass = int(paramtersDict['nClass'])
print "Number of Classes : ", nClass

alpha = float(paramtersDict['alpha'])
print "Learning Rate : ", alpha

#nClass = 10
#alpha = 0.01


x = tf.placeholder(tf.float32, [None, size])
W = tf.Variable(tf.zeros([size, nClass]))
b = tf.Variable(tf.zeros([nClass]))
y = tf.nn.softmax(tf.matmul(x, W) + b)
y_ = tf.placeholder(tf.float32, [None, nClass])
cross_entropy = -tf.reduce_sum(y_*tf.log(y))
train_step = tf.train.GradientDescentOptimizer(alpha).minimize(cross_entropy)
init = tf.initialize_all_variables()

sess = tf.Session()
sess.run(init)

for i in range(1000):
  batch_xs, batch_ys = mnist.train.next_batch(100)
  sess.run(train_step, feed_dict={x: batch_xs, y_: batch_ys})

correct_prediction = tf.equal(tf.argmax(y,1), tf.argmax(y_,1))
accuracy = tf.reduce_mean(tf.cast(correct_prediction, "float"))
print "Accuracy", sess.run(accuracy, feed_dict={x: mnist.test.images, y_: mnist.test.labels})
