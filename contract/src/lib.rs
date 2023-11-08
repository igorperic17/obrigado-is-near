use near_sdk::borsh::{self, BorshDeserialize, BorshSerialize};
use near_sdk::{env, near_bindgen, AccountId, Balance, PanicOnDefault};
use near_sdk::collections::{Vector, UnorderedMap};
use near_sdk::json_types::{U128, Base64VecU8};
use near_sdk::serde_json;
use std::collections::HashMap;

use bs58;

// Add the sha2 crate to your Cargo.toml dependencies
use sha2::{Sha256, Digest};

#[near_bindgen]
#[derive(BorshDeserialize, BorshSerialize, PanicOnDefault)]
pub struct TaskContract {
    tasks: UnorderedMap<u64, Task>,
    task_results: UnorderedMap<u64, Vector<TaskResult>>,
    task_count: u64,
}

#[derive(BorshDeserialize, BorshSerialize)]
pub struct Task {
    bounty: Balance,
    workspace_url: String,
    status: TaskStatus,
    submitter: AccountId,
}

#[derive(BorshDeserialize, BorshSerialize)]
pub struct TaskResult {
    result_url: String,
    result_hash: Base64VecU8,
    submitter: AccountId,
}

#[derive(BorshDeserialize, BorshSerialize)]
pub enum TaskStatus {
    Open,
    Completed,
    Challenged,
}

#[near_bindgen]
impl TaskContract {
    #[init]
    pub fn new() -> Self {
        Self {
            tasks: UnorderedMap::new(b"t".to_vec()),
            task_results: UnorderedMap::new(b"r".to_vec()),
            task_count: 0,
        }
    }

    pub fn add_task(&mut self, bounty: U128, workspace_url: String) -> u64 {
        let task_id = self.task_count;
        let task = Task {
            bounty: bounty.0,
            workspace_url,
            status: TaskStatus::Open,
            submitter: env::signer_account_id(),
        };
        self.tasks.insert(&task_id, &task);
        self.task_count += 1;
        env::log_str(&format!("Task {} added by {}", task_id, task.submitter));
        task_id
    }

    #[payable]
    pub fn submit_task_result(&mut self, task_id: u64, result_url: String, result_hash: Base64VecU8) {
        let deposit = env::attached_deposit();
        let task = self.tasks.get(&task_id).expect("Task not found");

        // Check if the deposit is at least 30% of the bounty
        assert!(deposit >= task.bounty / 3, "Deposit must be at least 30% of the bounty");

        // Check if the task is still open
        assert!(matches!(task.status, TaskStatus::Open), "Task is not open");

        // Check if the submitter has already submitted a result for this task
        let results = self.task_results.get(&task_id).unwrap_or_else(|| Vector::new(b"r".to_vec()));
        assert!(
            results.iter().all(|r| r.submitter != env::signer_account_id()),
            "Submitter has already submitted a result for this task"
        );

        // Add the result
        let mut results = results;
        results.push(&TaskResult {
            result_url,
            result_hash,
            submitter: env::signer_account_id(),
        });
        self.task_results.insert(&task_id, &results);

        // Check if the task is completed
        // Convert Base64VecU8 to String before using it as a key
        let mut result_count: HashMap<String, u64> = HashMap::new();
        for result in results.iter() {
            // Access the underlying Vec<u8> directly with .0
            let hash_string = bs58::encode(result.result_hash.0.as_slice()).into_string();
            *result_count.entry(hash_string).or_insert(0) += 1;
        }
        

        if let Some(count) = result_count.values().find(|&&count| count >= 3) {
            // Task is completed
            self.tasks.insert(&task_id, &Task {
                status: TaskStatus::Completed,
                ..task
            });
            env::log_str(&format!("Task {} completed", task_id));
        }
    }
}

// Helper function to hash the result data
fn hash_result_data(data: &[u8]) -> Base64VecU8 {
    let mut hasher = Sha256::new();
    hasher.update(data);
    let result = hasher.finalize();
    Base64VecU8::from(result.to_vec())
}

// Helper function to verify a result hash
fn verify_result_hash(data: &Vec<u8>, hash: &Base64VecU8) -> bool {
    hash_result_data(data) == *hash
}

// The rest of the contract would include more functions to manage tasks and results,
// such as getting tasks, getting results for a task, challenging results, etc.
