use near_sdk::borsh::{self, BorshDeserialize, BorshSerialize};
use near_sdk::collections::{LookupMap, TreeMap, Vector};
use near_sdk::{env, near_bindgen, AccountId, Balance, Promise};

pub mod structs;

use crate::structs::task::Task;
use crate::structs::task_result::TaskResult;

const MINIMUM_RESULT_COUNT: usize = 2;
const NUM_OF_TASKS_RETURNED: u64 = 10;
const MINIMUM_BOUNTY: Balance = 10_u128.pow(24);

#[near_bindgen]
#[derive(BorshDeserialize, BorshSerialize)]
pub struct TaskContract {
    // Provides an ordered queue with O(1) look up, O(log N) insert/remove operations
    task_queue: TreeMap<String, Task>,
    // Store and retrieve users' completed task history with O(1) look up, O(1) insert/remove operations
    task_history: LookupMap<AccountId, Vector<Task>>,
}

#[near_bindgen]
impl TaskContract {
    // Create a new compute task and add it to the queue
    // #[payable] is required as env::attached_deposit() (bounty) is required
    #[payable]
    pub fn create_task(&mut self, repository_url: String) -> String {
        let attached_bounty = env::attached_deposit();

        if attached_bounty < MINIMUM_BOUNTY {
            return near_log_return(format!(
                "Attached deposit for bounty must be at least {}, but was only {}",
                MINIMUM_BOUNTY, attached_bounty
            ));
        }

        let task = Task::new(attached_bounty, repository_url);
        near_log(format!("Created task: {}", task.id));

        self.task_queue.insert(&task.id, &task);

        near_log_return(format!("Task: {} created and added to state", task))
    }

    pub fn submit_result(
        &mut self,
        task_id: String,
        result_hash: String,
        result_url: String,
    ) -> String {
        match self.task_queue.get(&task_id) {
            Some(mut task) => {
                // If the account has already submitted a result for this task then don't add another:
                if task.results.contains_key(&env::signer_account_id()) {
                    return near_log_return(format!(
                        "User {} has already submitted a result for task: {}.",
                        env::signer_account_id(),
                        task_id
                    ));
                }

                near_log(format!("Adding result from user: {} to task: {}",
                    env::signer_account_id(),
                    task_id
                ));

                self.add_result(&mut task, result_hash, result_url);

                let mut return_string = format!(
                    "Result successfully submitted to task: {} for user: {}.",
                    task_id,
                    env::signer_account_id()
                );

                // If the task has reached the minimum number of required results move the task to history and send NEAR to result submitting accounts:
                if task.results.len() >= MINIMUM_RESULT_COUNT {
                    near_log(format!(
                        "Task: {} has reached result count. Distributing bounty.",
                        task.id
                    ));

                    self.distribute_bounty(&task);

                    near_log(format!(
                        "Bounty successfully distributed for task: {}. Moving task to history of user: {}",
                        task.id,
                        task.submitter_account_id
                    ));

                    self.move_task_to_history(task);

                    return_string.push_str(" Result count met so bounty has been distrubuted and task has been moved to history.");
                }

                return_string
            }
            // If the item is no longer in task_queue it has already been fulfilled or the task_id is incorrect:
            None => {
                near_log_return(format!(
                    "You cannot submit a result for task: {}. The task may have alread been fulfilled or the task_id could be incorrect.",
                task_id
                ))
            }
        }
    }

    fn add_result(&mut self, task: &mut Task, result_hash: String, result_url: String) {
        task.results.insert(
            env::signer_account_id(),
            TaskResult::new(result_hash, result_url),
        );

        self.task_queue.insert(&task.id, task);
    }

    fn distribute_bounty(&self, task: &Task) {
        let payout = task.bounty / task.results.len() as u128;

        for account in task.results.keys() {
            Promise::new(account.clone()).transfer(payout);
        }
    }

    fn move_task_to_history(&mut self, task: Task) {
        match self.task_history.get(&task.submitter_account_id) {
            // Add the task to the useres history if it exists:
            Some(mut history) => {
                history.push(&task);

                self.task_history
                    .insert(&task.submitter_account_id, &history);
            }
            // If the user has no history, create it and add the task:
            None => {
                let mut history = Vector::new(Prefix::AccountTaskHistory(
                    task.submitter_account_id.clone(),
                ));

                history.push(&task);

                self.task_history
                    .insert(&task.submitter_account_id, &history);
            }
        }

        // Remove the completed task from task_queue:
        self.task_queue.remove(&task.id);
    }

    pub fn get_tasks_from_queue(&self) -> Vec<Task> {
        let mut task_vec = vec![];
        let mut iter = self.task_queue.iter();
        let mut i = 0;

        while i < NUM_OF_TASKS_RETURNED {
            if let Some((_key, task)) = iter.next() {
                task_vec.push(task);
                i += 1;
            } else {
                break;
            }
        }

        task_vec
    }

    pub fn get_task_history(&self, account_id: AccountId) -> Vec<Task> {
        let mut task_history = vec![];

        match self.task_history.get(&account_id) {
            Some(tasks) => {
                for task in tasks.iter() {
                    task_history.push(task);
                }
            }
            None => (),
        }

        task_history
    }

    pub fn get_task(&self, task_id: String) -> Option<Task> {
        self.task_queue.get(&task_id)
    }

    // Only used for testing
    #[private]
    pub fn clear_state(&mut self) {
        self.task_queue.clear();
        self.task_history
            .remove(&AccountId::new_unchecked("obrigado.testnet".to_string()));
    }
}

impl Default for TaskContract {
    fn default() -> Self {
        Self {
            task_queue: TreeMap::new(Prefix::TaskQueue),
            task_history: LookupMap::new(Prefix::TaskHistory),
        }
    }
}

// #[derive(BorshDeserialize, BorshSerialize, Serialize)]
// pub struct Task {
//     submitter_account_id: AccountId,
//     bounty: Balance,
//     repository_url: String,
//     results: HashMap<AccountId, TaskResult>,
//     id: String,
//     timestamp: U64,
// }

// impl Task {
//     fn new(bounty: Balance, repository_url: String) -> Self {
//         Self {
//             submitter_account_id: env::signer_account_id(),
//             bounty,
//             repository_url,
//             results: HashMap::new(),
//             id: generate_task_id(),
//             timestamp: U64(env::block_timestamp()),
//         }
//     }
// }

// impl fmt::Display for Task {
//     fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
//         write!(
//             f,
//             "{{ submitter_account_id: {}, bounty: {}, respository_url: {}, id: {}, timestamp: {} }}",
//             self.submitter_account_id,
//             self.bounty,
//             self.repository_url,
//             self.id,
//             self.timestamp.0
//         )
//     }
// }

// #[derive(BorshDeserialize, BorshSerialize)]
// pub struct TaskResult {
//     result_hash: String,
//     result_url: String,
// }

// impl TaskResult {
//     fn new(result_hash: String, result_url: String) -> Self {
//         Self {
//             result_hash,
//             result_url,
//         }
//     }
// }

// impl Serialize for TaskResult {
//     fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
//     where
//         S: Serializer,
//     {
//         let mut state = serializer.serialize_struct("TaskResult", 2)?;
//         state.serialize_field("result_hash", &self.result_hash)?;
//         state.serialize_field("result_url", &self.result_url)?;
//         state.end()
//     }
// }

#[derive(near_sdk::BorshStorageKey, BorshSerialize)]
enum Prefix {
    TaskQueue,
    TaskHistory,
    AccountTaskHistory(AccountId),
}

fn near_log(string: String) {
    env::log_str(string.as_str());
}

fn near_log_return(string: String) -> String {
    env::log_str(string.as_str());

    string
}
