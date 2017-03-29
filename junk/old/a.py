import zipfile 

zip_ref = zipfile.ZipFile("MNIST_data.zip", 'r')
zip_ref.extractall()
zip_ref.close()
