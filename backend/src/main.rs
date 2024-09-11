use actix_web::{web, App, HttpServer};
use colored::Colorize;
mod models;
mod app_state;
mod handlers;
mod notificatooor;
use app_state::AppState;
use notificatooor::{Notificator, run_notificator, Notification};
use tokio::time::{sleep, Duration};
use rand::Rng;
use rand::rngs::StdRng;
use rand::SeedableRng;

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    let app_state = web::Data::new(AppState::new());
    
    // Initialize the notificator
    let (notificator, rx) = Notificator::new();
    let clients = notificator.clients.clone();
    
    // Spawn the notificator WebSocket server
    let notificator_clone = notificator.clone();
    tokio::spawn(async move {
        notificator_clone.start(8081).await;
    });
    
    // Spawn the notification handler
    tokio::spawn(async move {
        run_notificator(rx, clients).await;
    });
    
    // Spawn the random notification generator
    let notificator_clone = notificator.clone();
    tokio::spawn(async move {
        let mut rng = StdRng::from_entropy();
        loop {
            sleep(Duration::from_secs(2)).await;
            let random_id = rng.gen_range(1..1000);
            let random_message = format!("Random notification #{}", rng.gen_range(1..100));
            notificator_clone.send_notification(Notification::new(random_id, random_message));
        }
    });
    
    println!("{}", "HTTP Server starting at http://127.0.0.1:8080".cyan());
    println!("{}", "WebSocket server starting at ws://127.0.0.1:8081/ws".cyan());
    
    HttpServer::new(move || {
        App::new()
            .app_data(app_state.clone())
            .route("/users", web::post().to(handlers::create_user))
            .route("/users", web::get().to(handlers::get_all_users))
            .route("/users/{id}", web::get().to(handlers::get_user))
            .route("/users/{id}", web::put().to(handlers::update_user))
            .route("/users/{id}", web::delete().to(handlers::delete_user))
            .route("/users/{id}/watchlist", web::post().to(handlers::add_wallet_to_watchlist))
            .route("/users/{id}/watchlist", web::get().to(handlers::get_watchlist))
            .route("/users/{id}/watchlist", web::delete().to(handlers::remove_wallet_from_watchlist))
    })
    .bind("127.0.0.1:8080")?
    .run()
    .await
}
