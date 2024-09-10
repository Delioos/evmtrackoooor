use actix_web::{web, App, HttpServer};
use colored::Colorize;

mod models;
mod app_state;
mod handlers;

use app_state::AppState;

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    let app_state = web::Data::new(AppState::new());

    println!("{}", "Server starting at http://127.0.0.1:8080".cyan());

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
