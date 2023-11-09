use core::fmt;
use std::collections::HashMap;

use near_rng::Rng;
use near_sdk::borsh::{self, BorshDeserialize, BorshSerialize};
use near_sdk::collections::{LookupMap, TreeMap, Vector};
use near_sdk::json_types::{U128, U64};
use near_sdk::{env, near_bindgen, AccountId, Balance, Promise};
use serde::ser::{SerializeStruct, Serializer};
use serde::Serialize;

const MINIMUM_CONFIRMATION_COUNT: U128 = U128(3);
const TASK_ID_LENGTH: u32 = 12;
const NO_OF_TASKS_RETURNED: u64 = 10;

#[near_bindgen]
#[derive(BorshDeserialize, BorshSerialize)]
pub struct TaskContract {
    // Provides an ordered data structure with O(log N) insert/remove operations
    task_queue: TreeMap<String, Task>,
    // Provides task lookup in O(n)
    task_items: LookupMap<String, Task>,
    // Store users' completed task history
    task_history: LookupMap<AccountId, Vector<Task>>,
}

#[near_bindgen]
impl TaskContract {
    pub fn create_task(&mut self, bounty: Balance, repository_url: String) -> String {
        // Create task's key for the task_queue. Created from timestamp + account Id.
        let task_queue_timestamp_key = format!(
            "{}-{}",
            env::block_timestamp().to_string(),
            env::signer_account_id()
        );
        let task = Task::new(bounty, repository_url, task_queue_timestamp_key.clone());

        self.task_queue.insert(&task_queue_timestamp_key, &task);
        self.task_items.insert(&task.id, &task);

        format!("Task created successfully: {}", task)
    }

    pub fn submit_result(&mut self, task_id: String, result_url: String, result_hash: String) -> String {
        // If the item is no longer in the task_items map it has already been fulfilled:
        if !self.task_items.contains_key(&task_id) {
            return "This task has already been fulfilled!".to_string();
        }

        match self.task_items.get(&task_id) {
            Some(mut task) => {
                // If the account hasn't already submitted a result for this task add a confirmation:
                if !task.confirmations.contains_key(&env::signer_account_id())
                    || env::signer_account_id()
                        == AccountId::new_unchecked("obrigado.testnet".to_string())
                {
                    self.add_confirmation(&mut task, result_hash, result_url);

                    // If the task has noew reached the minimum number of required confirmations move the task to history and send NEAR to confirming accounts:
                    if task.confirmation_count >= MINIMUM_CONFIRMATION_COUNT {
                        let payout = task.bounty / task.confirmation_count.0;

                        for account in task.confirmations.keys() {
                            Promise::new(account.clone()).transfer(payout);
                        }

                        self.move_task_to_history(task);
                    }

                    "Result submitted successfully!".to_string()
                } else {
                    "You have already submitted a result for this task!".to_string()
                }
            }
            None => "This task has already been fulfilled!".to_string(),
        }
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

    pub fn get_task(&self, id: String) -> String {
        match self.task_items.get(&id) {
            Some(task) => task.to_string(),
            None => "".to_string(),
        }
    }

    fn move_task_to_history(&mut self, task: Task) {
        let task_queue_timestamp_key = task.task_queue_timestamp_key.clone();

        // If the task submitter has no history yet, create an empty history vector:
        if !self.task_history.contains_key(&task.submitter_account_id) {
            self.task_history.insert(
                &task.submitter_account_id,
                &Vector::new(Prefix::AccountTaskHistory(
                    task.submitter_account_id.clone(),
                )),
            );
        }

        // Add the task to the submitters history.
        match self.task_history.get(&task.submitter_account_id) {
            Some(mut history) => {
                history.push(&task);
            }
            None => (),
        }

        // Remove the completed task from task_queue and task_items:
        self.task_queue.remove(&task_queue_timestamp_key);
        self.task_items.remove(&task.id);
    }

    fn add_confirmation(&mut self, task: &mut Task, result_hash: String, result_url: String) {
        task.confirmations
            .insert(env::signer_account_id(), Confirmation::new(result_hash, result_url));

        task.confirmation_count = U128(task.confirmation_count.0 + 1);

        self.task_queue.insert(&task.task_queue_timestamp_key, task);
        self.task_items.insert(&task.id, task);
    }

    //REMOVE THIS METHOD. ONLY USED FOR TESTING
    pub fn clear_queue(&mut self) {
        self.task_queue.clear();
    }

    //REMOVE THIS METHOD. ONLY USED FOR TESTING
    pub fn clear_history(&mut self) {
        self.task_history
            .remove(&AccountId::new_unchecked("obrigato.testnet".to_string()));
    }
}

impl Default for TaskContract {
    fn default() -> Self {
        Self {
            task_queue: TreeMap::new(Prefix::TaskQueue),
            task_items: LookupMap::new(Prefix::TaskItems),
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
    task_queue_timestamp_key: String,
    timestamp: U64,
}

impl Task {
    fn new(bounty: Balance, repository_url: String, task_queue_timestamp_key: String) -> Self {
        let task_id = generate_task_id();

        Self {
            submitter_account_id: env::signer_account_id(),
            bounty,
            repository_url,
            confirmation_count: U128(0),
            confirmations: HashMap::new(),
            id: task_id,
            task_queue_timestamp_key,
            timestamp: U64(env::block_timestamp()),
        }
    }
}

impl fmt::Display for Task {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(
            f,
            "{{ submitter_account_id: {}, bounty: {}, respository_url: {}, confirmation_count: {}, id: {}, task_queue_timestamp_key: {}, timestamp: {} }}",
            self.submitter_account_id,
            self.bounty,
            self.repository_url,
            u128::from(self.confirmation_count),
            self.id,
            self.task_queue_timestamp_key,
            self.timestamp.0
        )
    }
}

#[derive(BorshDeserialize, BorshSerialize)]
pub struct Confirmation {
    result_hash: String,
    result_url: String
}

impl Confirmation {
    fn new(result_hash: String, result_url: String) -> Self {
        Self { result_hash, result_url }
    }
}

impl Serialize for Confirmation {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        let mut state = serializer.serialize_struct("Confirmation", 1)?;
        state.serialize_field("result_hash", &self.result_hash)?;
        state.end()
    }
}

#[derive(near_sdk::BorshStorageKey, BorshSerialize)]
enum Prefix {
    TaskQueue,
    TaskItems,
    TaskHistory,
    AccountTaskHistory(AccountId),
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

    random_string
}

// impl Display for Confirmation {
//     fn fmt(&self, f: &mut Formatter) -> Result {
//         write!(f, "{{ result_hash: {} }}", self.result_hash)
//     }
// }

// impl Serialize for Task {
//     fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
//     where
//         S: Serializer,
//     {
//         // 3 is the number of fields in the struct.
//         let mut state = serializer.serialize_struct("Task", 8)?;
//         state.serialize_field("submitter_account_id", &self.submitter_account_id)?;
//         state.serialize_field("bounty", &self.bounty)?;
//         state.serialize_field("repository_url", &self.repository_url)?;
//         state.serialize_field("confirmation_count", &self.confirmation_count)?;
//         state.serialize_field("confirmations", &self.confirmations)?;
//         state.serialize_field("id", &self.id)?;
//         state.serialize_field("task_queue_timestamp_key", &self.task_queue_timestamp_key)?;
//         state.serialize_field("timestamp", &self.timestamp)?;
//         state.end()
//     }
// }

// Helper function to verify a result hash
// fn verify_result_hash(data: &Vec<u8>, hash: &Base64VecU8) -> bool {
//     hash_result_data(data) == *hash
// }
