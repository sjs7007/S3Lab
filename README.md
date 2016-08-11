

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
    **Content:** `{"Prediction":"4"}`

    Result returned is a json object containing prediction made. 

* **Sample Call:**

  `curl -F upload="@img.png" deepc02.acis.ufl.edu:8888/MNISTPredictor`

* **Notes:**

  You should have "img.png" in the directory from which you are making the above sample CURL call.


**4. Dashbord Information**
----
Allows user to get information about jobs submitted to the system and their status. 

* **URL**

 /getDashboard

* **Method:**
  
   `GET` 

* **Success Response:**

  * **Code:** 200 <br />
    **Content:** `{"info":{"queriedHost":"127.0.0.1:9042","triedHosts":{},"achievedConsistency":10},"rows":[{"jobstatus":"crashed","jobtype":"training","model":null,"prediction":null,"user_id":"sjs7007testing"},{"jobstatus":"finished","jobtype":"training","model":"/S3LabUploads/MNIST_data_f7cf086e-e63e-44ec-b4af-6caa0764e376.ckpt","prediction":null,"user_id":"sjs7007testing"},{"jobstatus":"finished","jobtype":"training","model":"/S3LabUploads/MNIST_data_8f7b6c4e-c35f-40b8-b89b-c635eadba773.ckpt","prediction":null,"user_id":"sjs7007testing"},{"jobstatus":"finished","jobtype":"training","model":"/S3LabUploads/MNIST_data_cdb8a38d-911c-4d78-8f95-6946f4c0c9fa.ckpt","prediction":null,"user_id":"sjs7007testing"},{"jobstatus":"crashed","jobtype":"training","model":null,"prediction":null,"user_id":"sjs7007testing"},{"jobstatus":"crashed","jobtype":"training","model":null,"prediction":null,"user_id":"sjs7007testing"},{"jobstatus":"finished","jobtype":"training","model":"/S3LabUploads/MNIST_data_8ea199e2-955d-42ee-b60e-4a56b11f297f.ckpt","prediction":null,"user_id":"sjs7007testing"}],"rowLength":7,"columns":[{"name":"jobstatus","type":{"code":13,"type":null}},{"name":"jobtype","type":{"code":13,"type":null}},{"name":"model","type":{"code":13,"type":null}},{"name":"prediction","type":{"code":13,"type":null}},{"name":"user_id","type":{"code":13,"type":null}}],"pageState":null}`

    Result returned contains an array of json consisting of following information :   

    Job status : finished/crashed    
    Job type : training/testing    
    Prediction : in case of a testing job, else null   
    User_id : user who submitted the job    
    job_id : unique job id
    pid : process id assigned to job 

* **Sample Call:**

  `curl deepc02.acis.ufl.edu:8888/getDashboard`

**5. Dashbord Information : Specific**
----
Allows user to get information about jobs submitted by specific user to the system and their status. 

* **URL**

 /getDashboardSelective

* **Method:**
  
   `GET` 

*  **URL Params**

   user_id : user_id whose jobs you want to manage. 

* **Success Response:**

  * **Code:** 200 <br />
    **Content:** `{"info":{"queriedHost":"127.0.0.1:9042","triedHosts":{},"achievedConsistency":10},"rows":[],"rowLength":0,"columns":[{"name":"pid","type":{"code":13,"type":null}},{"name":"job_id","type":{"code":12,"type":null}},{"name":"jobstatus","type":{"code":13,"type":null}},{"name":"jobtype","type":{"code":13,"type":null}},{"name":"model","type":{"code":13,"type":null}},{"name":"prediction","type":{"code":13,"type":null}},{"name":"user_id","type":{"code":13,"type":null}}],"pageState":null}`

    Result returned contains an array of json consisting of following information :   

    Job status : finished/crashed    
    Job type : training/testing    
    Prediction : in case of a testing job, else null   
    User_id : user who submitted the job    
    job_id : unique job id
    pid : process id assigned to job 

* **Sample Call:**

  `curl deepc02.acis.ufl.edu:8888/getDashboardSelective?user_id=sjs7007`



**6. Kill Jobs**
----
Allows user to kill training jobs with specific job_id. 

* **URL**

 /killProcess


* **Method:**
  
   `POST` 
  
*  **URL Params**

   **Required:**
   
   `job_id=[UUID]` : job_id of job.    
   `pid=[integer]` : process id of the child process spawned to perform training/testing.     

* **Success Response:**

  * **Code:** 200 <br />
    **Content:** `Killing process with PID : 12291`

* **Failure Response:**

  * **Code:** 400 <br />
    **Content:** `Process killing failed : not a child process`


* **Sample Call:**

  `curl -F job_id=c8c2e97c-c8b1-4c6c-ae0f-8d7c6d0ceee6 -F pid=12291  deepc02.acis.ufl.edu:8888/killProcess`

* **Notes:**

  You can only kill processes which are generated by this application. 


**7. Suspend Jobs**
----
Allows user to suspend training jobs with specific job_id. 

* **URL**

 /suspendProcess


* **Method:**
  
   `POST` 
  
*  **URL Params**

   **Required:**
    
   `job_id=[UUID]` : job_id of job.    
   `pid=[integer]` : process id of the child process spawned to perform training/testing.     

* **Success Response:**

  * **Code:** 200 <br />
    **Content:** `Suspended process with PID : 12291`

* **Failure Response:**

  * **Code:** 400 <br />
    **Content:** `Process suspension failed : not a child process`


* **Sample Call:**

  `curl -F job_id=c8c2e97c-c8b1-4c6c-ae0f-8d7c6d0ceee6  -F pid=12291  deepc02.acis.ufl.edu:8888/suspendProcess`

* **Notes:**

  You can only suspend processes which are generated by this application. 

**8. Resume Jobs**
----
Allows user to resume training jobs with specific job_id and pid. 

* **URL**

 /resumeProcess


* **Method:**
  
   `POST` 
  
*  **URL Params**

   **Required:**

   `job_id=[UUID]` : job_id of job.    
   `pid=[integer]` : process id of the child process spawned to perform training/testing.     

* **Success Response:**

  * **Code:** 200 <br />
    **Content:** `Killing process with PID : 12291`

* **Failure Response:**

  * **Code:** 400 <br />
    **Content:** `Process killing failed : not a child process`


* **Sample Call:**

  `curl -F job_id=c8c2e97c-c8b1-4c6c-ae0f-8d7c6d0ceee6 -F pid=12291  deepc02.acis.ufl.edu:8888/resumeProcess`

* **Notes:**

  You can only  resume processes which are generated by this application. 

**9. Test on trained model**
----
Allows user select an already trained model based on job_id and perform testing using that model. 

* **URL**

 /testTrainedOnline

* **Method:**
  
   `POST` 
  
*  **URL Params**

   **Required:**
 
   `job_id=[string]` : job_id of model to be used. 

* **Data Params**

  None.

* **Success Response:**

  * **Code:** 200 <br />
    **Content:** `{"Prediction":"3\n"}`

    Result returned is a json object prediction value. 

* **Sample Call:**

  `curl -F job_id=dc725ed7-dc51-4c9a-9057-f1539a958681 localhost:8888/testTrainedOnline -F upload=@generalPredictor/93.png`

