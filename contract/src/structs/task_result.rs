use near_sdk::borsh::{self, BorshDeserialize, BorshSerialize};
use serde::ser::{SerializeStruct, Serializer};
use serde::Serialize;

#[derive(BorshDeserialize, BorshSerialize)]
// If this struct is modified update the `impl Serialize for TaskResult`
pub struct TaskResult {
    pub result_hash: String,
    pub result_url: String,
}

impl TaskResult {
    pub fn new(result_hash: String, result_url: String) -> Self {
        Self {
            result_hash,
            result_url,
        }
    }
}

impl Serialize for TaskResult {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        let mut state = serializer.serialize_struct("TaskResult", 2)?;
        state.serialize_field("result_hash", &self.result_hash)?;
        state.serialize_field("result_url", &self.result_url)?;
        state.end()
    }
}
