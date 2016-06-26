**1. MNIST Trainer**
----
Allows user to upload the [MNIST dataset](https://drive.google.com/open?id=0B-HwpreJA3WzbnZodkJZVWNfUTg) and get a trained model based on the parameters specified. Description about the dataset can be found [here](http://yann.lecun.com/exdb/mnist/). 

* **URL**

 /uploadCompleteScript

* **Method:**
  
   `POST` 
  
*  **URL Params**

   **Required:**
 
   `width=[integer]` : width of images used    
   `height=[integer]` : height of images used    
   `nClass=[integer]` : number of classes    
   `alpha=[float]` : learning rate   

* **Data Params**

  `upload=[zip-file]` : MNIST dataset linked above. 

* **Success Response:**

  * **Code:** 200 <br />
    **Content:** `{"Accuracy":"[{\"Epoch\": 0.0, \"Accuracy\": \"0.4075\"}, {\"Epoch\": 10.0, \"Accuracy\": \"0.894\"}, {\"Epoch\": 20.0, \"Accuracy\": \"0.8989\"}, {\"Epoch\": 30.0, \"Accuracy\": \"0.9012\"}, {\"Epoch\": 40.0, \"Accuracy\": \"0.904\"}, {\"Epoch\": 50.0, \"Accuracy\": \"0.9105\"}, {\"Epoch\": 60.0, \"Accuracy\": \"0.9012\"}, {\"Epoch\": 70.0, \"Accuracy\": \"0.9113\"}, {\"Epoch\": 80.0, \"Accuracy\": \"0.9156\"}, {\"Epoch\": 90.0, \"Accuracy\": \"0.9146\"}, {\"Epoch\": 100.0, \"Accuracy\": \"0.9143\"}]","trainedModel":"/S3LabUploads/MNIST_data_8.ckpt"}`

    Result returned is a json object containing array of epoch accuracy pairs and a relative path to the trained model. 

* **Sample Call:**

  `curl -F width=28 -F height=28 -F nClass=10 -F alpha=0.01 -F upload="@MNIST_data.zip" deepc02.acis.ufl.edu:8888/uploadCompleteScript`

* **Notes:**

  You should have "MNIST_data.zip" in the directory from which you are making the above sample CURL call.

**2. MNIST Prediction using user models**
----

### 2.1 : Model Selection 

Allows user to upload their own trained [MNIST model](https://drive.google.com/file/d/0B-HwpreJA3WzRVh5eDNGVFZGSVk/view?usp=sharing) and later perform predictions using different API(2.2).

* **URL**

 /generalPredictorModelUpload

* **Method:**
  
   `POST` 
  
*  **URL Params**

   None

* **Data Params**

  `upload=[.ckpt]` : A tensorflow [checkpoint](https://www.tensorflow.org/versions/r0.9/how_tos/variables/index.html) file. 

* **Success Response:**

  * **Code:** 200 <br />
    **Content:** `Received model : mnist.ckpt`

* **Sample Call:**

  `curl -F upload="@mnist.ckpt" deepc02.acis.ufl.edu:8888/generalPredictorModelUpload`

* **Notes:**

  You should have "mnist.ckpt" in the directory from which you are making the above sample CURL call.

### 2.2 Image Selection 

Allows user to perform predictions using the model selected in model section API(2.1). 

* **URL**

 /generalPredictorImageUpload

* **Method:**
  
   `POST` 
  
*  **URL Params**

   None

* **Data Params**

  `upload=[Image-File]` : The image file can be of jpeg or png type. 

* **Success Response:**

  * **Code:** 200 <br />
    **Content:** `{"Prediction":"4"}`

     Result returned is a json object containing prediction made. 

* **Sample Call:**

  `curl -F upload="@img.png" deepc02.acis.ufl.edu:8888/generalPredictorImageUpload`

* **Notes:**

  You should have "img.png" in the directory from which you are making the above sample CURL call.

**3. MNIST Prediction on a pretrained model**
----
Allows user to upload MNIST images and get predictions on a pretrained model. 

* **URL**

 /MNISTPredictor

* **Method:**
  
   `POST` 
  
*  **URL Params**

  None

* **Data Params**

  `upload=[Image-File]` : The image file should be of 28*28 dimensions. You can find some sample images [here](). 

* **Success Response:**

  * **Code:** 200 <br />
    **Content:** ``

    Result returned is a json object containing prediction made. 

* **Sample Call:**

  `curl -F upload="@img.png" deepc02.acis.ufl.edu:8888/MNISTPredictor`

* **Notes:**

  You should have "img.png" in the directory from which you are making the above sample CURL call.