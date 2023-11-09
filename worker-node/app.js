import { connect, keyStores, Contract, utils } from 'near-api-js';
import axios from 'axios';
import decompress from 'decompress';
import { PythonShell } from 'python-shell';
import fs from 'fs';
import { create } from 'ipfs-http-client';
import { execa } from 'execa';


const keyStore = new keyStores.UnencryptedFileSystemKeyStore('C:/Users/joaov/.near-credentials');

const ipfs = create({ host: 'ipfs.infura.io', port: 5001, protocol: 'https' });
const nearConfig = {
  networkId: 'testnet',
  keyStore: keyStore,
  nodeUrl: 'https://rpc.testnet.near.org',
  walletUrl: 'https://wallet.testnet.near.org',
  contractName: 'obrigado.testnet',
};

// Function to download and extract the workspace
async function downloadAndPrepareWorkspace(url, taskId) {
  const workspaceDir = `./workspaces/${taskId}`;
  if (!fs.existsSync(workspaceDir)) {
    fs.mkdirSync(workspaceDir, { recursive: true });
  }
  console.log("PROCESSING TASK MADAFAKAAAAAA");
  console.log(url);
  console.log(taskId);

  const response = await axios({ url, responseType: 'arraybuffer' });
  await decompress(response.data, workspaceDir);

  prepareWorkspace(workspaceDir)

  return workspaceDir;
}

async function prepareWorkspace(workspaceDir) {
  // Create a Python virtual environment
  console.log(workspaceDir);
  await execa('python3', ['-m', 'venv', 'venv'], { cwd: workspaceDir });

  // Install dependencies from requirements.txt
  await execa('./venv/bin/pip', ['install', '-r', 'requirements.txt'], { cwd: workspaceDir });
}

// Function to execute the Python script
async function executePythonScript(workspaceDir, entryScript) {
    return new Promise((resolve, reject) => {
      PythonShell.run(`${workspaceDir}/${entryScript}`, { pythonPath: `${workspaceDir}/venv/bin/python` }, (err, results) => {
        if (err) {
          console.error('Error running Python script:', err);
          reject(err);
        } else {
          console.log('Results from Python script:', results);
          resolve(results);
        }
      });
    });
  }

// Function to upload results to IPFS
async function uploadResultsToIPFS(workspaceDir) {
  const resultsDir = `${workspaceDir}/results`;
  // Zip the results directory
  const { stdout } = await execa('zip', ['-r', 'results.zip', '.'], { cwd: resultsDir });
  console.log(stdout);

  // Read the zipped file
  const file = fs.readFileSync(`${resultsDir}/results.zip`);
  const added = await ipfs.add(file);
  const url = `https://ipfs.infura.io/ipfs/${added.path}`;
  const hash = added.cid.toString();

  return { url, hash };
}

// Function to submit the result to the smart contract
async function submitResultToContract(contract, taskId, resultUrl, resultHash) {
  // Submit the result to the smart contract
  // This is a placeholder function. You'll need to implement the actual contract call.
}

// Function to process a task
async function processTask(contract, task) {
  try {
    const workspaceDir = await downloadAndPrepareWorkspace(task.repository_url, task.id);
    await executePythonScript(workspaceDir, 'main.py');
    const { url, hash } = await uploadResultsToIPFS(workspaceDir);
    await submitResultToContract(contract, task.id, url, hash);
  } catch (error) {
    console.error('Error processing task:', error);
  }
}

// Main function to listen to the job queue and process tasks
async function listenToJobQueue() {

    // // while developing hardcode running the job from the local path
    // const job_workspace_dir = "../sample_jobs/hellonear/"

    // // create python venv and install requirements
    // await prepareWorkspace(job_workspace_dir)
    // await executePythonScript(job_workspace_dir, 'entry_script.py')
    // .then((output) => {
    //     // Output has already been logged to the console in the function
    //     // TODO: store it in a file, upload it and submit the results
    //     console.log(output)
    //   })
    //   .catch((error) => {
    //     // Error has already been logged to the console in the function
    //     // TODO: store it in a file, upload it and submit the results
    //     console.log(error)
    //   });

    // TODO: uncomment below to actually listen to the queue
    // TODO: add the changes above to cetch the console logs and package them
    const near = await connect(nearConfig);
    const wallet = await near.account('joaovascopestana.testnet');
    const contract = new Contract(wallet, nearConfig.contractName, { //nearConfig.contractName
        viewMethods: ['get_tasks_from_queue'],
        changeMethods: ['submit_result'],
        // the sender is the worker, also the bounty hunter 
        sender: 'joaovascopestana.testnet',
    });



    // {
    //   submitter_account_id: 'develoco.testnet',
    //   bounty: 21,
    //   repository_url: 'asdasdasd',
    //   confirmation_count: '0',
    //   confirmations: {},
    //   id: 'cmawozD4CwTh',
    //   task_queue_timestamp_key: '1699480703646659420-develoco.testnet',
    //   timestamp: '1699480703646659420'
    // },

    // Polling for new tasks
    setInterval(async () => {
        const tasks = await contract.get_tasks_from_queue({ });
        // console.log(tasks);
        for (let i = 0; i<tasks.length; i++) {
          const task = tasks[i];
          console.log(task);
          if (!Object.values(task.confirmations).some(r => r.submitter === wallet.accountId)) {
              await processTask(contract, task);
          }
        }
    }, 1000); // Poll every 1 seconds

        // console.log(tasks);
        // for (const [taskId, task] of tasks) {
        //   if (task.status === 'Open' && !task.results.some(r => r.submitter === wallet.accountId)) {
        //       await processTask(contract, taskId, task);
        //   }
        // }

    // // submit_result(&mut self, task_id: String, result_hash: String)
    // // `contract.methodName({ args, gas?, amount?, callbackUrl?, meta? })`
    // const tasks = await contract.submit_result({args: {task_id: '1245678',result_hash: "test-hash"}});
}

listenToJobQueue().then(() => {
  console.log('Job executor is running...');
}).catch(console.error);
