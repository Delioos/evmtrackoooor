use crate::log_decoder::LogDecoder;
use crate::notificatooor::Notificator;
use crate::subscribe_manager::SubscribeManager;
use alloy::primitives::Address;
use alloy::providers::{Provider, ProviderBuilder, ReqwestProvider};
use alloy::rpc::types::BlockNumberOrTag;
use alloy::sol;
use std::sync::Arc;
use tokio::time::{sleep, Duration};
use tracing::{debug, error, trace};

sol!(
#[allow(missing_docs)]
function swapExactTokensForTokens(
    uint256 amountIn,
    uint256 amountOutMin,
    address[] calldata path,
    address to,
    uint256 deadline
  ) external returns (uint256[] memory amounts);
);

pub struct BlockProcessor {
    provider: ReqwestProvider,
    subscribe_manager: Arc<SubscribeManager>,
    notificator: Arc<Notificator>,
    // decoder: LogDecoder,
}

impl BlockProcessor {
    pub fn new(
        rpc_url: &str,
        subscribe_manager: Arc<SubscribeManager>,
        notificator: Arc<Notificator>,
    ) -> Self {
        let provider =
            ProviderBuilder::default().on_http(rpc_url.parse().expect("Invalid RPC URL"));
        // let decoder = LogDecoder::new();

        Self {
            provider,
            subscribe_manager,
            notificator,
            // decoder,
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
        match self
            .provider
            .get_block_by_number(BlockNumberOrTag::Number(block_number), true)
            .await
        {
            Ok(Some(block)) => {
                // TODO: implement the decoder
                match decoder.decode_block(&block) {
                    Ok(Some(wallet_movements)) => {
                        // dispatch notifications
                    }

                    Ok(None) => {
                        trace!(
                            "No tracked wallet interactions in the Block: {}",
                            block_number
                        )
                    }

                    Err(e) => {
                        error!("meow meow")
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
