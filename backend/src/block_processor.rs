use crate::notificatooor::Notificator;
use crate::subscribe_manager::SubscribeManager;
use alloy::primitives::{hex, Address};
use alloy::providers::{Provider, ProviderBuilder, ReqwestProvider};
use alloy::rpc::types::BlockNumberOrTag;
use alloy::sol;
use alloy::sol_types::SolCall;
use std::sync::Arc;
use tokio::time::{sleep, Duration};

// TODO: separate in another file?
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
}

impl BlockProcessor {
    pub fn new(
        rpc_url: &str,
        subscribe_manager: Arc<SubscribeManager>,
        notificator: Arc<Notificator>,
    ) -> Self {
        let provider =
            ProviderBuilder::default().on_http(rpc_url.parse().expect("Invalid RPC URL"));

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
        match self
            .provider
            .get_block_by_number(BlockNumberOrTag::Number(block_number), true)
            .await
        {
            Ok(Some(block)) => {
                for tx in block.transactions.into_transactions() {
                    if let Some(from) = Option::from(tx.from) {
                        let from_address = Address::from(from);

                        // Attempt to decode the transaction as a swapExactTokensForTokens call
                        if let Some(to) = tx.to {
                            let input = tx.input;
                            if let Ok(decoded) =
                                swapExactTokensForTokensCall::abi_decode(&input, false)
                            {
                                // Successfully decoded the swap
                                let message = format!(
                                    "Swap detected from {} in block {}:\n\
                                     Amount In: {}\n\
                                     Amount Out Min: {}\n\
                                     Path: {:?}\n\
                                     To: {}\n\
                                     Deadline: {}",
                                    from_address,
                                    block_number,
                                    decoded.amountIn,
                                    decoded.amountOutMin,
                                    decoded.path,
                                    decoded.to,
                                    decoded.deadline
                                );

                                if let Some(subscribers) =
                                    self.subscribe_manager.get_subscribers(from).await
                                {
                                    for subscriber in subscribers {
                                        println!("Sending notification to {}", subscriber);
                                        self.notificator.send_notification(
                                            crate::notificatooor::Notification::new(
                                                subscriber as i64,
                                                message.clone(),
                                            ),
                                        );
                                    }
                                }
                            } else {
                                // Not a swapExactTokensForTokens call, or decoding failed
                                // println!("Transaction is not a swapExactTokensForTokens call or decoding failed");
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
