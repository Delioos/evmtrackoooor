use alloy::{
    providers::ReqwestProvider,
    rpc::types::{Filter, Log, Transaction},
    sol,
};
use tracing::{debug, error, trace};

#[derive(Debug)]
pub struct LogDecoder {
    provider: ReqwestProvider,
}

impl LogDecoder {
    pub fn new(provider: ReqwestProvider) -> Self {
        Self { provider }
    }

    pub async fn get_decoded_logs(tx: &Transaction) -> &str {
        return "meow";
    }
}
