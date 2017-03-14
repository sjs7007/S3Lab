import scipy
import scipy.ndimage 
import sys



impath = sys.argv[1]
print impath

img = scipy.ndimage.imread(impath)
print img.shape

