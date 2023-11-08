import { connect, keyStores, Contract, utils } from 'near-api-js';
import axios from 'axios';
import decompress from 'decompress';
import { PythonShell } from 'python-shell';
import fs from 'fs';
import { create } from 'ipfs-http-client';
import { execa } from 'execa';

const ipfs = create({ host: 'ipfs.infura.io', port: 5001, protocol: 'https' });
const nearConfig = {
  networkId: 'testnet',
  keyStore: new keyStores.InMemoryKeyStore(),
  nodeUrl: 'https://rpc.testnet.near.org',
  walletUrl: 'https://wallet.testnet.near.org',
  contractName: 'contractName',
};

// Function to download and extract the workspace
async function downloadAndPrepareWorkspace(url, taskId) {
  const workspaceDir = `./workspaces/${taskId}`;
  if (!fs.existsSync(workspaceDir)) {
    fs.mkdirSync(workspaceDir, { recursive: true });
  }

  const response = await axios({ url, responseType: 'arraybuffer' });
  await decompress(response.data, workspaceDir);

  prepareWorkspace(workspaceDir)

  return workspaceDir;
}

async function prepareWorkspace(workspaceDir) {
  // Create a Python virtual environment
  await execa('python3', ['-m', 'venv', 'venv'], { cwd: workspaceDir });

  // Install dependencies from requirements.txt
  await execa('./venv/bin/pip', ['install', '-r', 'requirements.txt'], { cwd: workspaceDir });
}

// Function to execute the Python script
async function executePythonScript(workspaceDir, entryScript) {
    return new Promise((resolve, reject) => {
      PythonShell.run(`${workspaceDir}${entryScript}`, { pythonPath: `${workspaceDir}/venv/bin/python` }, (err, results) => {
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
async function processTask(contract, taskId, task) {
  try {
    const workspaceDir = await downloadAndPrepareWorkspace(task.workspace_url, taskId);
    await executePythonScript(workspaceDir, 'main.py');
    const { url, hash } = await uploadResultsToIPFS(workspaceDir);
    await submitResultToContract(contract, taskId, url, hash);
  } catch (error) {
    console.error('Error processing task:', error);
  }
}

// Main function to listen to the job queue and process tasks
async function listenToJobQueue() {

    // while developing hardcode running the job from the local path
    const job_workspace_dir = "../sample_jobs/hellonear/"

    // create python venv and install requirements
    await prepareWorkspace(job_workspace_dir)
    await executePythonScript(job_workspace_dir, 'entry_script.py')
    .then((output) => {
        // Output has already been logged to the console in the function
        // TODO: store it in a file, upload it and submit the results
        console.log(output)
      })
      .catch((error) => {
        // Error has already been logged to the console in the function
        // TODO: store it in a file, upload it and submit the results
        console.log(error)
      });


    // TODO: uncomment below to actually listen to the queue
    // TODO: add the changes above to cetch the console logs and package them
    const near = await connect(nearConfig);
    const wallet = near.account(nearConfig.contractName);
    const contract = new Contract(wallet, nearConfig.contractName, {
        viewMethods: ['get_tasks'],
        changeMethods: ['submit_task_result'],
    });

    // Polling for new tasks
    setInterval(async () => {
        const tasks = await contract.get_tasks({ from_index: 0, limit: 100 });
        for (const [taskId, task] of tasks) {
        if (task.status === 'Open' && !task.results.some(r => r.submitter === wallet.accountId)) {
            await processTask(contract, taskId, task);
        }
        }
    }, 10000); // Poll every 10 seconds
}

listenToJobQueue().then(() => {
  console.log('Job executor is running...');
}).catch(console.error);
