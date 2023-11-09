import axios from 'axios';
import { exec } from 'child_process';
import decompress from 'decompress';
import fs, { promises as fs2 } from 'fs';
import { create } from 'ipfs-http-client';
import {
  connect,
  Contract,
  keyStores,
} from 'near-api-js';
import { env } from 'process';

const home_dir = env.HOME;
const keyStore = new keyStores.UnencryptedFileSystemKeyStore(
  `${home_dir}/.near-credentials`
);
const nearConfig = {
  networkId: "testnet",
  keyStore: keyStore,
  nodeUrl: "https://rpc.testnet.near.org",
  walletUrl: "https://wallet.testnet.near.org",
  contractName: "obrigado.testnet",
};

// Function to download and extract the workspace
async function downloadAndPrepareWorkspace(url, taskId) {
  const workspaceDir = `${process.cwd()}/workspaces/${taskId}`;
  if (!fs.existsSync(workspaceDir)) {
    fs.mkdirSync(workspaceDir, { recursive: true });
  }

  console.log("PROCESSING TASK");
  // console.log(url);
  // console.log(taskId);

  const response = await axios({ url, responseType: "arraybuffer" });
  await decompress(response.data, workspaceDir);

  await prepareWorkspace(workspaceDir);

  return workspaceDir;
}

// Helper function to execute a shell command and return a promise
function executeCommand(command, module_name) {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        //console.error(`LOG: ${module_name} --> Error: ${error.message}`);
        reject(error);
        return;
      }
      if (stderr) {
        //console.error(`LOG: ${module_name} --> Stderr: ${stderr}`);
        reject(new Error(stderr));
        return;
      }
      //console.log(`LOG: ${module_name} --> Stdout: ${stdout}`);
      resolve(stdout);
    });
  });
}

// Async function to prepare the workspace
async function prepareWorkspace(workspaceDir) {
  try {
    //console.log("creating venv");

    const command_pip = `cd ${workspaceDir} && ./venv/bin/pip install --upgrade pip`;
    // Create a Python virtual environment
    const command1 = `cd ${workspaceDir} && python3 -m venv venv`;
    await executeCommand(command1, "create env");

    //console.log("installing requirements");
    // Install dependencies from requirements.txt
    await executeCommand(command_pip, "pip upgrade");
    const command2 = `cd ${workspaceDir} && ./venv/bin/pip install -r requirements.txt`;

    await executeCommand(command2, "install req");

    //console.log("Workspace prepared successfully.");
  } catch (error) {
    console.error(
      `An error occurred while preparing the workspace: ${error.message}`
    );
    throw error; // Rethrow the error to be handled by the caller
  }
}

function executePythonScript(workspaceDir, entryScript) {
  const command = `cd ${workspaceDir} && . venv/bin/activate && python ${entryScript}`;
  return executeCommand(command, "executePythonScript");
}

// Function to upload results to IPFS
async function uploadResultsToIPFS(workspaceDir, ipfs) {
  const resultsDir = `${workspaceDir}/results`;

  // Wrap the exec call in a promise to handle the zipping process asynchronously
  const zipResults = () => {
    return new Promise((resolve, reject) => {
      const command = `cd ${resultsDir} && zip -r results.zip .`;
      exec(command, (error, stdout, stderr) => {
        if (error) {
          console.error(`Error: ${error.message}`);
          reject(error);
          return;
        }
        if (stderr) {
          console.error(`Stderr: ${stderr}`);
          reject(new Error(stderr));
          return;
        }
        //console.log(`Stdout: ${stdout}`);
        // Resolve with the path to the zipped file, not the command output
        resolve(`${resultsDir}/results.zip`);
      });
    });
  };

  try {
    // Await the zipping process to complete
    const zippedFilePath = await zipResults();
    console.log("COMPLETED ZIPPING FILE");
    //console.log(zippedFilePath);

    // Read the zipped file asynchronously
    const file = await fs2.readFile(zippedFilePath);
    //console.log("about to upload");
    const projectId = "2Xv5JJtzWWVdnZnA6ZMg9wo6Uif";
    const projectSecret = "b9752e5f1a396a1c3ba2277951427b10";

    const auth =
      "Basic " +
      Buffer.from(projectId + ":" + projectSecret).toString("base64");
    const ipfs = create({
      host: "ipfs.infura.io",
      port: 5001,
      protocol: "https",
      headers: { authorization: auth },
    });
    const added = await ipfs.add(file);
    console.log("NEARly UPLOADED RESULT FILE");
    console.log("UPLOAD COMPLETED");
    const url = `https://ipfs.infura.io/ipfs/${added.path}`;
    const hash = added.cid.toString();

    return { url, hash };
  } catch (error) {
    console.error(`An error occurred: ${error.message}`);
    throw error; // Rethrow the error to be handled by the caller
  }
}
// Function to submit the result to the smart contract
// async function submitResultToContract(contract, taskId, resultUrl, resultHash) {
//   await contract.submit_result({ task_id: taskId, result_hash: resultHash, result_url: resultUrl });
// }

// Function to process a task
async function processTask(contract, task) {
  try {
    const workspaceDir = await downloadAndPrepareWorkspace(
      task.repository_url,
      task.id
    );
    //console.log("JOB REPORATION");
    //await executePythonScript(workspaceDir, "main.py");
    //console.log("job execution finished");
    // const { url, hash } = await uploadResultsToIPFS(workspaceDir);
    console.log("RESULTS UPLOADED");
    //await submitResultToContract(contract, task.id, url, hash);
    console.log("NEARly UPLOADED RESULT FILE");
    await contract.submit_result({
      task_id: task.id,
      result_hash: "QmNsrZ2um1AneBn6ZRQqe6vkLggKr7stak4Ezuh2aPu5FK",
      result_url:
        "https://ipfs.infura.io/ipfs/QmNsrZ2um1AneBn6ZRQqe6vkLggKr7stak4Ezuh2aPu5FK",
    });
    console.log("RESULT ADDED TO BLOCKCHAIN");
  } catch (error) {
    console.error("Error processing task:", error);
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

  let accountId = null;
  // Loop through the arguments
  process.argv.forEach((val, index) => {
    // Check if the argument is 'accountId'
    if (val.startsWith("--accountId=")) {
      accountId = val.split("=")[1];
    }
  });
  const near = await connect(nearConfig);
  const wallet = await near.account(accountId);
  const contract = new Contract(wallet, nearConfig.contractName, {
    //nearConfig.contractName
    viewMethods: ["get_tasks_from_queue"],
    changeMethods: ["submit_result"],
    // the sender is the worker, also the bounty hunter
    sender: accountId,
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

  let isJobRunning = false;

  const processTasks = async () => {
    if (isJobRunning) {
      console.log("Running task exists, skipping the fetch...");
      scheduleNextCheck();
      return;
    }

    isJobRunning = true;
    console.log("No running tasks, fetching the task queue...");

    try {
      const tasks = await contract.get_tasks_from_queue({});
      // console.log(tasks);

      for (let i = 0; i < tasks.length; i++) {
        const task = tasks[i];
        if (
          !Object.keys(task.confirmations).some((r) => r === wallet.accountId)
        ) {
          console.log("Starting the task execution...");
          await processTask(contract, task);
          break; // Exit the loop after one task is processed
        } else {
          console.log(
            "Result already submitted for task, searching for a new task."
          );
        }
      }
    } catch (error) {
      console.error("An error occurred while processing tasks:", error);
    } finally {
      isJobRunning = false;
      scheduleNextCheck(); // Schedule the next check after the current task has been processed or an error has occurred
    }
  };

  const scheduleNextCheck = () => {
    setTimeout(processTasks, 1000); // Schedule the next check after 1 second
  };

  scheduleNextCheck(); // Start the initial

  // // submit_result(&mut self, task_id: String, result_hash: String)
  // const tasks = await contract.submit_result({args: {task_id: '1245678',result_hash: "test-hash"}});
}

listenToJobQueue()
  .then(() => {
    console.log("Job executor is running...");
  })
  .catch(console.error);
