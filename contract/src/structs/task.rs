use core::fmt;
use std::collections::HashMap;

use near_rng::Rng;
use near_sdk::borsh::{self, BorshDeserialize, BorshSerialize};
use near_sdk::json_types::U64;
use near_sdk::{env, AccountId, Balance};
use serde::Serialize;

use super::task_result::TaskResult;

const TASK_ID_LENGTH: u32 = 12;

#[derive(BorshDeserialize, BorshSerialize, Serialize)]
pub struct Task {
    pub submitter_account_id: AccountId,
    pub bounty: Balance,
    repository_url: String,
    pub results: HashMap<AccountId, TaskResult>,
    pub id: String,
    timestamp: U64,
}

impl Task {
    pub fn new(bounty: Balance, repository_url: String) -> Self {
        Self {
            submitter_account_id: env::signer_account_id(),
            bounty,
            repository_url,
            results: HashMap::new(),
            id: generate_task_id(),
            timestamp: U64(env::block_timestamp()),
        }
    }
}

impl fmt::Display for Task {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(
            f,
            "{{ submitter_account_id: {}, bounty: {}, respository_url: {}, id: {}, timestamp: {} }}",
            self.submitter_account_id,
            self.bounty,
            self.repository_url,
            self.id,
            self.timestamp.0
        )
    }
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
