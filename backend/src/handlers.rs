use actix_web::{web, HttpResponse, Responder};
use colored::Colorize;
use crate::models::User;
use crate::app_state::AppState;

pub async fn create_user(data: web::Data<AppState>, user: web::Json<User>) -> impl Responder {
    println!("{}", "POST /users".green());
    let mut users = data.users.write().await;
    let new_user = User {
        id: user.id,
        username: user.username.clone(),
        watchlist: Vec::new(),
        altitude: user.altitude,
        active: user.active,
    };
    users.insert(user.id, new_user.clone());
    println!("{}", format!("User {} created", user.id).on_green());
    HttpResponse::Created().json(new_user)
}

pub async fn get_user(data: web::Data<AppState>, id: web::Path<i32>) -> impl Responder {
    println!("{}", format!("GET /users/{}", id).blue());
    let users = data.users.read().await;
    match users.get(&id) {
        Some(user) => HttpResponse::Ok().json(user),
        None => HttpResponse::NotFound().finish(),
    }
}

pub async fn get_watchlist(data: web::Data<AppState>, id: web::Path<i32>) -> impl Responder {
    println!("{}", format!("GET /users/{}/watchlist", id).blue());
    let users = data.users.read().await;
    match users.get(&id) {
        Some(user) => HttpResponse::Ok().json(user.watchlist.clone()),
        None => HttpResponse::NotFound().finish(),
    }
}

pub async fn update_user(data: web::Data<AppState>, id: web::Path<i32>, user: web::Json<User>) -> impl Responder {
    println!("{}", format!("PUT /users/{}", id).yellow());
    let mut users = data.users.write().await;
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

pub async fn delete_user(data: web::Data<AppState>, id: web::Path<i32>) -> impl Responder {
    println!("{}", format!("DELETE /users/{}", id).red());
    let mut users = data.users.write().await;
    if users.remove(&id).is_some() {
        HttpResponse::NoContent().finish()
    } else {
        HttpResponse::NotFound().finish()
    }
}

pub async fn get_all_users(data: web::Data<AppState>) -> impl Responder {
    println!("{}", "GET /users".blue());
    let users = data.users.read().await;
    let users_vec: Vec<User> = users.values().cloned().collect();
    HttpResponse::Ok().json(users_vec)
}

pub async fn add_wallet_to_watchlist(
    data: web::Data<AppState>,
    id: web::Path<i32>,
    wallet: web::Json<String>
) -> impl Responder {
    println!("{}", format!("POST /users/{}/watchlist", id).green());

    let user_id = id.into_inner();
    let wallet_address = wallet.into_inner();

    // Vérifier d'abord si l'utilisateur existe
    let user_exists = {
        let users = data.users.read().await;
        users.contains_key(&user_id)
    };

    if !user_exists {
        return HttpResponse::NotFound().finish();
    }

    // Ajouter l'abonnement de manière asynchrone
    data.subscribe_manager.add_subscriber(&wallet_address, user_id).await;

    // Mettre à jour la watchlist de l'utilisateur
    let mut users = data.users.write().await;
    let user = users.get_mut(&user_id).unwrap(); // Safe because we checked existence

    if !user.watchlist.contains(&wallet_address) {
        user.watchlist.push(wallet_address.clone());
        HttpResponse::Ok().json(user)
    } else {
        HttpResponse::BadRequest().body("Wallet already in watchlist")
    }
}

pub async fn remove_wallet_from_watchlist(
    data: web::Data<AppState>,
    id: web::Path<i32>,
    wallet: web::Json<String>
) -> impl Responder {
    println!("{}", format!("DELETE /users/{}/watchlist", id).red());

    let user_id = id.into_inner();
    let wallet_address = wallet.into_inner();

    // Vérifier d'abord si l'utilisateur existe
    let user_exists = {
        let users = data.users.read().await;
        users.contains_key(&user_id)
    };

    if !user_exists {
        return HttpResponse::NotFound().finish();
    }

    // Mettre à jour la watchlist de l'utilisateur
    let mut users = data.users.write().await;
    let user = users.get_mut(&user_id).unwrap(); // Safe because we checked existence

    if let Some(pos) = user.watchlist.iter().position(|x| x == &wallet_address) {
        user.watchlist.remove(pos);
        
        // Supprimer l'abonnement de manière asynchrone
        let subscribe_manager = data.subscribe_manager.clone();
        tokio::spawn(async move {
            subscribe_manager.remove_subscriber(&wallet_address, user_id).await;
        });

        HttpResponse::Ok().json(user)
    } else {
        HttpResponse::BadRequest().body("Wallet not found in watchlist")
    }
}
