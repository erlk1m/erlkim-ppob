use axum::{
    routing::{get, post},
    Router,
    response::IntoResponse,
    Json,
};
use serde_json::json;
use sqlx::postgres::PgPoolOptions;
use std::net::SocketAddr;
use tower_http::cors::{CorsLayer, Any};

mod models;
mod handlers;
mod store;
mod admin;
mod webhooks;
mod providers;

#[tokio::main]
async fn main() {
    // 1. Load environment variables from the monorepo root (.env)
    // Adjust the path depending on where the binary is run from. 
    // For now we try to load from the workspace root or the current dir.
    let _ = dotenvy::from_filename("../../.env").or_else(|_| dotenvy::dotenv());

    let database_url = std::env::var("DATABASE_URL")
        .expect("DATABASE_URL must be set in .env");
    
    let port = std::env::var("PORT_RUST")
        .unwrap_or_else(|_| "3002".to_string())
        .parse::<u16>()
        .unwrap_or(3002);

    println!("🔄 Connecting to database...");

    // 2. Create Database Connection Pool
    let pool = PgPoolOptions::new()
        .max_connections(5)
        .connect(&database_url)
        .await
        .expect("Failed to connect to the database");

    println!("✅ Connected to database successfully.");

    // 3. Configure CORS
    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    // 4. Build Router
    let app = Router::new()
        .route("/health", get(health_check))
        .route("/api/health", get(health_check))
        .route("/api/settings/public", get(handlers::get_settings_public))
        .route("/api/maintenance-status", get(handlers::get_maintenance_status))
        .route("/api/payment-methods", get(handlers::get_payment_methods))
        .route("/api/store/home-content", get(handlers::get_home_content))
        .route("/api/categories", get(handlers::get_categories))
        .route("/api/products", get(handlers::get_products))
        .route("/api/store/orders/pln/inquiry", post(handlers::pln_inquiry))
        .route("/api/store/orders", post(handlers::create_order))
        .route("/api/store/orders/{invoice}/pay/midtrans", post(handlers::pay_midtrans))
        .route("/api/store/orders/{invoice}", get(handlers::get_order))
        .nest("/api/admin", admin::admin_routes())
        .nest("/api/webhooks", webhooks::webhook_routes())
        .route("/api/payment-provider/callback/midtrans", post(webhooks::midtrans_webhook))
        .route("/api/digiflazz/webhook", post(webhooks::digiflazz_webhook))
        .layer(cors)
        .with_state(pool); // Pass the DB pool to routes

    // 5. Start Server
    let addr = SocketAddr::from(([0, 0, 0, 0], port));
    println!("🚀 Rust Backend Server listening on http://{}", addr);

    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}

/// Simple Health Check Endpoint
async fn health_check() -> impl IntoResponse {
    Json(json!({
        "status": "success",
        "message": "PPOB API (Rust) is up and running!",
        "version": "1.0.0"
    }))
}
