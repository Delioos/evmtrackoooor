use actix_web::{middleware, web, App, HttpServer};
use colored::Colorize;
mod app_state;
mod auth_middleware;
mod block_processor;
mod handlers;
mod log_decoder;
mod models;
mod notificatooor;
mod subscribe_manager;
use app_state::AppState;
use auth_middleware::authenticate;
use block_processor::BlockProcessor;
use dotenv::dotenv;
use log_decoder::LogDecoder;
use notificatooor::{run_notificator, Notificator};
use std::sync::Arc;
use subscribe_manager::SubscribeManager;

// simple middleware authorizing req if they got a valid api_key in the headerk

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    // Load the .env file
    dotenv().ok();

    let url = std::env::var("ENDPOINT").expect("ENDPOINT must be set");
    println!("RPC URL: {}", url.green().on_bright_white());
    let api_key = std::env::var("API_KEY").expect("API_KEY must be set");
    println!("API_KEY: {}", api_key.cyan().on_bright_white());
    // Initialize the app state with the new SubscribeManager
    let subscribe_manager = SubscribeManager::new();
    let app_state = web::Data::new(AppState::new(subscribe_manager.clone()));

    // Initialize the notificator
    let (notificator, rx) = Notificator::new();
    let clients = notificator.clients.clone();

    // Initialize the block processor
    let block_processor = BlockProcessor::new(
        &url,
        Arc::new(subscribe_manager.clone()),
        Arc::new(notificator.clone()),
    );

    // Spawn the block processor
    tokio::spawn(async move {
        block_processor.start().await;
    });

    // Spawn the notificator WebSocket server
    let notificator_clone = notificator.clone();
    tokio::spawn(async move {
        notificator_clone.start(8081).await;
    });

    // Spawn the notification handler
    tokio::spawn(async move {
        run_notificator(rx, clients).await;
    });

    println!("{}", "HTTP Server starting at http://127.0.0.1:8080".cyan());
    println!(
        "{}",
        "WebSocket server starting at ws://127.0.0.1:8081/ws".cyan()
    );

    HttpServer::new(move || {
        let auth = web::Data::new(api_key.clone());
        App::new()
            .wrap(middleware::from_fn(authenticate))
            .app_data(auth.clone())
            .app_data(app_state.clone())
            .route("/users", web::post().to(handlers::create_user))
            .route("/users", web::get().to(handlers::get_all_users))
            .route("/users/{id}", web::get().to(handlers::get_user))
            .route("/users/{id}", web::put().to(handlers::update_user))
            .route("/users/{id}", web::delete().to(handlers::delete_user))
            .route(
                "/users/{id}/watchlist",
                web::post().to(handlers::add_wallet_to_watchlist),
            )
            .route(
                "/users/{id}/watchlist",
                web::get().to(handlers::get_watchlist),
            )
            .route(
                "/users/{id}/watchlist",
                web::delete().to(handlers::remove_wallet_from_watchlist),
            )
    })
    .bind("127.0.0.1:8080")?
    .run()
    .await
}
