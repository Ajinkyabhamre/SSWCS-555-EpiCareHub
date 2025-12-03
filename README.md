<h3>Project Name: EpiCareHub</h3><br>

![CI](https://github.com/2024S-SSW-555-EpiCareHub/SSWCS-555-EpiCareHub/actions/workflows/ci.yml/badge.svg)

<p>A web platform which aims to empower user in accurately identifying seizure-affected areas in the brain and thus improving surgical outcomes for epilepsy patients.
Through an interactive interface like clicking or rotating the 3D visualization of brain, ML algorithm(s), and 3D visualizations, the application will contribute in making more informed decision.</p>


<h3>Project Description:</h3>
<p>Welcome!  <br>
This is place through which we are developing and maintaining the code for our web application. The tech stack used are -
<ul>
  <li>Frontend Programming Languages- React</li>
    <li>Backend Programming Languages- Node, Python</li>
    <li>Database- MongoDB, Postgres   </li>
    <li>Unit Testing- Jest, Pytest  </li>
    <li>Automation Tool- Selenium  </li>
    <li>CI tool- CircleCI  </li>
  </ul>

The development is in-progress so tech stack can be modified in future.</p>

<h4>How to run the application:</h4>

1. Frontend
  - In terminal, navigate to the Frontend Folder.
  - Run the command: <b>npm i</b>
  - Then, run: <b>npm run dev</b>
  - If you encounter an error, delete the node_modules folder in the Frontend directory and repeat steps 2(npm i) and 3(npm run dev) to resolve previously unresolved dependencies.
  - You will get a link for the application, e.g., **Local: http://localhost:5173/**
2. Backend
  - In terminal, navigate to the Backend Folder.
  - Run the command: <b>npm i</b>
  - Then, run: <b> npm start </b>
  - If you encounter an error, delete the node_modules folder in the backend directory and repeat steps 2(npm i) and 3(npm start) to resolve previously unresolved dependencies.
  - You will see a message saying we have now got a server.
3. Python MNE Application.
  - This application is in the repo https://github.com/2024S-SSW-555-EpiCareHub/Localization-Algorithm.git in the same organization on github.
  - Install the dependencies as it requires conda and python version >= 3.11
  - If you are a windows user, make sure to configure conda to path in environment variables.
  - Create a new environment in conda using <b>conda create --name myenv python=3.11</b>
  - Activate the new environment using <b>conda activate myenv</b>
  - Include all dependencies listed in environment.yml with command <b> conda env update -f environment.yml </b>
  - Make sure all the dependices are installed.
  - Run the command <b>uvicorn brain_api:app --reload</b>
  - If the error persists running the fast api backend for MNE, it will be because some of the packages would not have been installed and look at error mesaage of the package and install the package with conda on the same environment search for the command on internet as every package has different syntax.

  #### Some of the packages that need to be installed are

  - uvcorn: conda install -c conda-forge uvicorn
  - fastapi: conda install -c conda-forge fastapi
  - python-multipart: conda install -c conda-forge python-multipart
  - mne: conda install -c conda-forge mne
  - torch: conda install pytorch torchvision torchaudio -c pytorch
  - cloudinary: pip install cloudinary

Try with the above packages installed on your pc, if any other package is remaining just install conda install -c conda-forge <package_name> as showed above.

<!-- <p>In terminal go to Frontend Folder. From Frontend folder run command- <b> npm i</b>
  and then <b>npm run dev</b> If you still see an error then delete the node_modules folder and then start with <b> npm i</b> and <b> npm run dev</b> to resolve the previously unresolved dependencies<p></p><br>
You will get a link for application e.g., <b><i>Local:   http://localhost:5173/</i></b> <br>

<p>In terminal go to Backend Folder. From Backend folder run command - <b> npm i </b> 
and then <b>npm start</b> If you still see an error then delete the node_modules folder and then start with <b> npm i</b> and <b> npm run dev</b> to resolve the previously unresolved dependencies<br></p><br>
You will get a messagae printed of server for application e.g., <b><i>Local:   http://localhost:3000//</i></b> <br>
 -->
<h4>Status of CI</h4>

[![CircleCI](https://dl.circleci.com/status-badge/img/circleci/9WHruia3osscYXEUoJiFXB/4WeuN4KJSB5JHBXWGA6yxT/tree/main.svg?style=svg&circle-token=235d1f476b7f2b359ae40855db7c6a814db4d1be)](https://dl.circleci.com/status-badge/redirect/circleci/9WHruia3osscYXEUoJiFXB/4WeuN4KJSB5JHBXWGA6yxT/tree/main)
