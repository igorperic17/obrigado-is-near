use core::fmt;

use near_sdk::borsh::{self, BorshDeserialize, BorshSerialize};
use near_sdk::collections::Vector;
use near_sdk::json_types::U128;
use near_sdk::{env, near_bindgen, AccountId, Balance, PanicOnDefault};

use rand::Rng;

const MINIMUM_COMPUTE_COUNT: U128 = U128(3);
const TASK_ID_LENGTH: u128 = 10;

#[near_bindgen]
#[derive(BorshDeserialize, BorshSerialize, PanicOnDefault)]
pub struct TaskContract {
    task_queue: Vector<Task>,
}

#[near_bindgen]
impl TaskContract {
    #[init]
    pub fn new() -> Self {
        Self {
            task_queue: Vector::new(b"t"),
        }
    }

    pub fn create_task(&mut self, bounty: Balance, repository_url: String) -> String {
        let task = Task::new(bounty, repository_url);

        self.task_queue.push(&task);

        format!("Task created successfully: {}", task)
    }

    //pub fn submit_task_result(&mut self, )

    // #[payable]
    // pub fn submit_task_result(
    //     &mut self,
    //     task_id: u64,
    //     result_url: String,
    //     result_hash: Base64VecU8,
    // ) {
    //     let deposit = env::attached_deposit();
    //     let task = self.tasks.get(&task_id).expect("Task not found");

    //     // Check if the deposit is at least 30% of the bounty
    //     assert!(
    //         deposit >= task.bounty / 3,
    //         "Deposit must be at least 30% of the bounty"
    //     );

    //     // Check if the task is still open
    //     assert!(matches!(task.status, TaskStatus::Open), "Task is not open");

    //     // Check if the submitter has already submitted a result for this task
    //     let results = self
    //         .task_results
    //         .get(&task_id)
    //         .unwrap_or_else(|| Vector::new(b"r".to_vec()));
    //     assert!(
    //         results
    //             .iter()
    //             .all(|r| r.submitter != env::signer_account_id()),
    //         "Submitter has already submitted a result for this task"
    //     );

    //     // Add the result
    //     let mut results = results;
    //     results.push(&TaskResult {
    //         result_url,
    //         result_hash,
    //         submitter: env::signer_account_id(),
    //     });
    //     self.task_results.insert(&task_id, &results);

    //     // Check if the task is completed
    //     // Convert Base64VecU8 to String before using it as a key
    //     let mut result_count: HashMap<String, u64> = HashMap::new();
    //     for result in results.iter() {
    //         // Access the underlying Vec<u8> directly with .0
    //         let hash_string = bs58::encode(result.result_hash.0.as_slice()).into_string();
    //         *result_count.entry(hash_string).or_insert(0) += 1;
    //     }

    //     if let Some(count) = result_count.values().find(|&&count| count >= 3) {
    //         // Task is completed
    //         self.tasks.insert(
    //             &task_id,
    //             &Task {
    //                 status: TaskStatus::Completed,
    //                 ..task
    //             },
    //         );
    //         env::log_str(&format!("Task {} completed", task_id));
    //     }
    // }
}

#[derive(BorshDeserialize, BorshSerialize)]
pub struct Task {
    submitter_account_id: AccountId,
    bounty: Balance,
    repository_url: String,
    compute_count: U128,
    id: String,
}

impl Task {
    fn new(bounty: Balance, repository_url: String) -> Self {
        Self {
            submitter_account_id: env::signer_account_id(),
            bounty,
            repository_url,
            compute_count: U128(0),
            id: generate_task_id(),
        }
    }
}

impl fmt::Display for Task {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(
            f,
            "{{ submitter_account_id: {}, bounty: {}, respository_url: {}, compute_count: {} }}",
            self.submitter_account_id,
            self.bounty,
            self.repository_url,
            u128::from(self.compute_count)
        )
    }
}

// fn generate_task_id(bounty: &Balance, repository_url: String) {
//     let mut hash = DefaultHasher::new();
//     let seed = env::random_seed();
//     let timestamp = env::block_timestamp();
//     let block_height = env::block_height();

//     repository_url.hash(&mut hash);
//     contract_len.hash(&mut hash);
//     seed.hash(&mut hash);
//     timestamp.hash(&mut hash);
//     block_height.hash(&mut hash);

//     hash.finish().to_string()
// }

// fn generate_sha256_hash() {
//     let seed = env::random_seed();
//     let timestamp = env::block_timestamp();
//     let block_height = env::block_height();

//     let mut hasher = Sha256::new();

//     hasher.update(seed.as_)
// }

fn generate_task_id() -> String {
    let charset: &[u8] = b"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let mut rng = rand::thread_rng();
    let random_string: String = (0..TASK_ID_LENGTH)
        .map(|_| {
            let index = rng.gen_range(0..charset.len());
            charset[index] as char
        })
        .collect();

    format!("{}-{}", env::signer_account_id(), random_string)
}

// #[derive(BorshDeserialize, BorshSerialize)]
// pub struct TaskResult {
//     creator_account_id: AccountId,
//     url: String,
//     hash: Base64VecU8,
// }

// #[derive(BorshDeserialize, BorshSerialize)]
// pub enum TaskStatus {
//     Open,
//     Completed,
//     Challenged,
// }

// Helper function to hash the result data
// fn hash_result_data(data: &[u8]) -> Base64VecU8 {
//     let mut hasher = Sha256::new();
//     hasher.update(data);
//     let result = hasher.finalize();
//     Base64VecU8::from(result.to_vec())
// }

// Helper function to verify a result hash
// fn verify_result_hash(data: &Vec<u8>, hash: &Base64VecU8) -> bool {
//     hash_result_data(data) == *hash
// }

// The rest of the contract would include more functions to manage tasks and results,
// such as getting tasks, getting results for a task, challenging results, etc.
