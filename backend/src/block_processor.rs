use alloy::providers::{Provider, ProviderBuilder, ReqwestProvider};
use alloy::transports::http::Http;
use tokio::time::{sleep, Duration};
use crate::notificatooor::Notificator;
use crate::subscribe_manager::SubscribeManager;
use std::sync::Arc;

pub struct BlockProcessor {
    provider: ReqwestProvider,
    subscribe_manager: Arc<SubscribeManager>,
    notificator: Arc<Notificator>,
}

impl BlockProcessor {
    pub fn new(rpc_url: &str, subscribe_manager: Arc<SubscribeManager>, notificator: Arc<Notificator>) -> Self {
        let provider = ProviderBuilder::default()
            .on_http(rpc_url.parse().expect("Invalid RPC URL"));

        Self {
            provider,
            subscribe_manager,
            notificator,
        }
    }

    pub async fn start(&self) {
        let mut last_processed_block = 0u64;
        loop {
            match self.provider.get_block_number().await {
                Ok(latest_block) => {
                    if latest_block > last_processed_block {
                        println!("Processing new block: {}", latest_block);
                        self.process_block(latest_block).await;
                        last_processed_block = latest_block;
                    }
                }
                Err(e) => {
                    eprintln!("Error fetching latest block: {:?}", e);
                }
            }
            sleep(Duration::from_secs(12)).await; // Ethereum block time is ~12 seconds
        }
    }

    async fn process_block(&self, block_number: u64) {
        match self.provider.get_block_with_txs(block_number).await {
            Ok(Some(block)) => {
                for tx in block.transactions {
                    if let Some(from) = tx.from {
                        let from_address = format!("{:?}", from);
                        if let Some(subscribers) = self.subscribe_manager.get_subscribers(&from_address).await {
                            for subscriber in subscribers {
                                let message = format!("New transaction from watched address {} in block {}", from_address, block_number);
                                self.notificator.send_notification(crate::notificatooor::Notification::new(subscriber as i64, message));
                            }
                        }
                    }
                }
            }
            Ok(None) => {
                eprintln!("Block {} not found", block_number);
            }
            Err(e) => {
                eprintln!("Error fetching block {}: {:?}", block_number, e);
            }
        }
    }
}
