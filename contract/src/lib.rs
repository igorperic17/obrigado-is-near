use core::fmt;
use std::collections::HashMap;

use near_rng::Rng;
use near_sdk::borsh::{self, BorshDeserialize, BorshSerialize};
use near_sdk::collections::{LookupMap, TreeMap, Vector};
use near_sdk::json_types::{U128, U64};
use near_sdk::{env, near_bindgen, AccountId, Balance, Promise};
use serde::ser::{SerializeStruct, Serializer};
use serde::Serialize;

const MINIMUM_CONFIRMATION_COUNT: U128 = U128(2);
const TASK_ID_LENGTH: u32 = 12;
const NO_OF_TASKS_RETURNED: u64 = 10;
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
        // If the item is no longer in task_queue it has already been fulfilled or the task_id is incorrect:
        if !self.task_queue.contains_key(&task_id) {
            near_log_return(format!(
                "Task: {} does not exist. The task may have alread been fulfilled or the task_id could be incorrect.",
                task_id
            ));
        }

        match self.task_queue.get(&task_id) {
            Some(mut task) => {
                // If the account hasn't already submitted a result for this task then add a confirmation:
                if !task.confirmations.contains_key(&env::signer_account_id()) {
                    near_log(format!("Adding result to task: {}", task_id));

                    self.add_confirmation(&mut task, result_hash, result_url);

                    near_log(format!(
                        "Result submitted to task: {} successfully for user {}",
                        task_id,
                        env::signer_account_id()
                    ));

                    // If the task has reached the minimum number of required confirmations move the task to history and send NEAR to confirming accounts:
                    if task.confirmation_count >= MINIMUM_CONFIRMATION_COUNT {
                        near_log(format!(
                            "Task: {} has reached confirmation count. Adding task to task_history for user: {} and distributing funds", 
                            task.id,
                            task.submitter_account_id
                        ));

                        let payout = task.bounty / task.confirmation_count.0;

                        for account in task.confirmations.keys() {
                            Promise::new(account.clone()).transfer(payout);
                        }

                        near_log(format!(
                            "All accounts paid {} for task: {}",
                            payout, task.id
                        ));

                        self.move_task_to_history(task);

                        return near_log_return(format!(
                            "Result submitted to task: {} successfully for user {}. Confirmation count met so bounty has been distrubuted.",
                            task_id,
                            env::signer_account_id()
                        ));
                    }

                    near_log_return(format!(
                        "Result submitted to task: {} successfully for user {}.",
                        task_id,
                        env::signer_account_id()
                    ))
                } else {
                    near_log_return(format!(
                        "User {} has already submitted a result for task: {}",
                        env::signer_account_id(),
                        task_id
                    ))
                }
            }
            None => near_log_return(format!("Task: {} cannont be found", task_id)),
        }
    }

    fn move_task_to_history(&mut self, task: Task) {
        near_log(format!("Moving task: {} to history", task.id));

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

    fn add_confirmation(&mut self, task: &mut Task, result_hash: String, result_url: String) {
        task.confirmations.insert(
            env::signer_account_id(),
            Confirmation::new(result_hash, result_url),
        );

        task.confirmation_count = U128(task.confirmation_count.0 + 1);

        self.task_queue.insert(&task.id, task);
    }

    pub fn get_tasks_from_queue(&self) -> Vec<Task> {
        let mut task_vec = vec![];
        let mut iter = self.task_queue.iter();
        let mut i = 0;

        while i < NO_OF_TASKS_RETURNED {
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

    pub fn get_task(&self, task_id: String) -> String {
        match self.task_queue.get(&task_id) {
            Some(task) => task.to_string(),
            None => "".to_string(),
        }
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

#[derive(BorshDeserialize, BorshSerialize, Serialize)]
pub struct Task {
    submitter_account_id: AccountId,
    bounty: Balance,
    repository_url: String,
    confirmation_count: U128,
    confirmations: HashMap<AccountId, Confirmation>,
    id: String,
    timestamp: U64,
}

impl Task {
    fn new(bounty: Balance, repository_url: String) -> Self {
        Self {
            submitter_account_id: env::signer_account_id(),
            bounty,
            repository_url,
            confirmation_count: U128(0),
            confirmations: HashMap::new(),
            id: generate_task_id(),
            timestamp: U64(env::block_timestamp()),
        }
    }
}

impl fmt::Display for Task {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(
            f,
            "{{ submitter_account_id: {}, bounty: {}, respository_url: {}, confirmation_count: {}, id: {}, timestamp: {} }}",
            self.submitter_account_id,
            self.bounty,
            self.repository_url,
            u128::from(self.confirmation_count),
            self.id,
            self.timestamp.0
        )
    }
}

#[derive(BorshDeserialize, BorshSerialize)]
pub struct Confirmation {
    result_hash: String,
    result_url: String,
}

impl Confirmation {
    fn new(result_hash: String, result_url: String) -> Self {
        Self {
            result_hash,
            result_url,
        }
    }
}

impl Serialize for Confirmation {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        let mut state = serializer.serialize_struct("Confirmation", 2)?;
        state.serialize_field("result_hash", &self.result_hash)?;
        state.serialize_field("result_url", &self.result_url)?;
        state.end()
    }
}

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

fn generate_task_id() -> String {
    let charset: &[u8] = b"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let mut rng = Rng::new(&env::random_seed());
    let random_string: String = (0..TASK_ID_LENGTH)
        .map(|_| {
            let index = rng.rand_range_i32(0, charset.len() as i32);
            charset[index as usize] as char
        })
        .collect();

    format!("{}-{}", env::block_timestamp().to_string(), random_string)
}
