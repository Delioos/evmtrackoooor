use actix_web::{web, App, HttpServer, HttpResponse, Responder};
use serde::{Serialize, Deserialize};
use std::sync::Mutex;
use std::collections::HashMap;
use colored::Colorize;

#[derive(Debug, Clone, Serialize, Deserialize)]
struct User {
    id: i32,
    username: String,
    watchlist: Vec<String>,
    altitude: bool,
    active: bool,
}

struct AppState {
    users: Mutex<HashMap<i32, User>>,
}

// TODO: Securise the api by using a token and a middleware

async fn create_user(data: web::Data<AppState>, user: web::Json<User>) -> impl Responder {
    println!("{}", "POST /users".green()); // Log creation
    let mut users = data.users.lock().unwrap();

    let new_user = User {
        id: user.id,
        username: user.username.clone(),
        watchlist: Vec::new(),
        altitude: user.altitude,
        active: user.active,
    };

    users.insert( user.id, new_user.clone());

    println!("{}", format!("User {} created", user.id).on_green());
    HttpResponse::Created().json(new_user)
}

async fn get_user(data: web::Data<AppState>, id: web::Path<i32>) -> impl Responder {
    println!("{}", format!("GET /users/{}", id).blue()); // Log retrieval
    let users = data.users.lock().unwrap();
    match users.get(&id) {
        Some(user) => HttpResponse::Ok().json(user),
        None => HttpResponse::NotFound().finish(),
    }
}

async fn get_watchlist(data: web::Data<AppState>, id: web::Path<i32>) -> impl Responder {
    println!("{}", format!("GET /users/{}/watchlist", id).blue()); // Log retrieval of watchlist
    let users = data.users.lock().unwrap();
    match users.get(&id) {
        Some(user) => HttpResponse::Ok().json(user.watchlist.clone()),
        None => HttpResponse::NotFound().finish(),
    }
}

async fn update_user(data: web::Data<AppState>, id: web::Path<i32>, user: web::Json<User>) -> impl Responder {
    println!("{}", format!("PUT /users/{}", id).yellow()); // Log update
    let mut users = data.users.lock().unwrap();
    match users.get_mut(&id) {
        Some(existing_user) => {
            existing_user.username = user.username.clone();
            existing_user.altitude = user.altitude;
            existing_user.active = user.active;
            HttpResponse::Ok().json(existing_user)
        },
        None => HttpResponse::NotFound().finish(),
    }
}

async fn delete_user(data: web::Data<AppState>, id: web::Path<i32>) -> impl Responder {
    println!("{}", format!("DELETE /users/{}", id).red()); // Log deletion
    let mut users = data.users.lock().unwrap();
    if users.remove(&id).is_some() {
        HttpResponse::NoContent().finish()
    } else {
        HttpResponse::NotFound().finish()
    }
}

async fn get_all_users(data: web::Data<AppState>) -> impl Responder {
    println!("{}", "GET /users".blue()); // Log retrieval of all users
    let users = data.users.lock().unwrap();
    let users_vec: Vec<User> = users.values().cloned().collect();
    HttpResponse::Ok().json(users_vec)
}

async fn add_wallet_to_watchlist(data: web::Data<AppState>, id: web::Path<i32>, wallet: web::Json<String>) -> impl Responder {
    println!("{}", format!("POST /users/{}/watchlist", id).green()); // Log addition to watchlist
    // Check data integrity using a regex
    /*
    // extraire une fonction is valid 
    if !wallet.match(r"^0x[a-fA-F0-9]{40}$").is_none() {
        return HttpResponse::BadRequest().body("Invalid wallet address");
    }*/
    let mut users = data.users.lock().unwrap();
    match users.get_mut(&id) {
        Some(user) => {
            if !user.watchlist.contains(&wallet) {
                user.watchlist.push(wallet.into_inner());
                HttpResponse::Ok().json(user)
            } else {
                HttpResponse::BadRequest().body("Wallet already in watchlist")
            }
        },
        // log user not found
        None => HttpResponse::NotFound().finish()
    }
}

async fn remove_wallet_from_watchlist(data: web::Data<AppState>, id: web::Path<i32>, wallet: web::Json<String>) -> impl Responder {
    println!("{}", format!("DELETE /users/{}/watchlist", id).red()); // Log removal from watchlist
    let mut users = data.users.lock().unwrap();
    match users.get_mut(&id) {
        Some(user) => {
            let wallet_as_string = wallet.into_inner();
            if let Some(pos) = user.watchlist.iter().position(|x| x == &wallet_as_string) {
                user.watchlist.remove(pos);
                HttpResponse::Ok().json(user)
            } else {
                HttpResponse::BadRequest().body("Wallet not found in watchlist")
            }
        },
        None => HttpResponse::NotFound().finish(),
    }
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    let app_state = web::Data::new(AppState {
        users: Mutex::new(HashMap::new()),
    });

    println!("{}", "Server starting at http://127.0.0.1:8080".cyan());

    HttpServer::new(move || {
        App::new()
            .app_data(app_state.clone())
            .route("/users", web::post().to(create_user))
            .route("/users", web::get().to(get_all_users))
            .route("/users/{id}", web::get().to(get_user))
            .route("/users/{id}", web::put().to(update_user))
            .route("/users/{id}", web::delete().to(delete_user))
            .route("/users/{id}/watchlist", web::post().to(add_wallet_to_watchlist))
            .route("/users/{id}/watchlist", web::get().to(get_watchlist))
            .route("/users/{id}/watchlist", web::delete().to(remove_wallet_from_watchlist))
    })
    .bind("127.0.0.1:8080")?
    .run()
    .await
}
