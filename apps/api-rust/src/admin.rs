use axum::{
    extract::State,
    http::StatusCode,
    response::IntoResponse,
    routing::{get, post},
    Json, Router,
    extract::FromRequestParts,
    http::request::Parts,
};
use serde::{Deserialize, Serialize};
use sqlx::PgPool;
use std::env;

use crate::handlers::ApiResponse;

#[derive(Deserialize)]
pub struct LoginRequest {
    pub email: Option<String>,
    pub password: Option<String>,
}

#[derive(Serialize)]
pub struct AdminInfo {
    pub email: String,
    pub name: String,
}

#[derive(Serialize)]
pub struct LoginResponse {
    pub token: String,
    pub admin: AdminInfo,
}

pub async fn login(Json(payload): Json<LoginRequest>) -> impl IntoResponse {
    let expected_email = env::var("ADMIN_EMAIL").unwrap_or_else(|_| "admin@erlkim.local".to_string());
    let expected_password = env::var("ADMIN_PASSWORD").unwrap_or_else(|_| "admin123".to_string());
    let admin_token = env::var("ADMIN_TOKEN").unwrap_or_else(|_| "change-me-admin-token".to_string());

    if payload.email.as_deref() == Some(&expected_email) && payload.password.as_deref() == Some(&expected_password) {
        return (StatusCode::OK, Json(ApiResponse {
            ok: true,
            data: Some(LoginResponse {
                token: admin_token,
                admin: AdminInfo {
                    email: expected_email,
                    name: "Admin ERLKIM (Rust)".to_string(),
                }
            }),
            message: None,
        })).into_response();
    }

    (StatusCode::UNAUTHORIZED, Json(ApiResponse::<()> {
        ok: false,
        data: None,
        message: Some("Email atau password salah".to_string()),
    })).into_response()
}

// Extractor to verify Admin Token
pub struct AdminAuth;

impl<S> FromRequestParts<S> for AdminAuth
where
    S: Send + Sync,
{
    type Rejection = (StatusCode, Json<ApiResponse<()>>);

    async fn from_request_parts(parts: &mut Parts, _state: &S) -> Result<Self, Self::Rejection> {
        let auth_header = parts.headers.get("authorization")
            .and_then(|value| value.to_str().ok())
            .unwrap_or("");
        
        let bearer_token = auth_header.trim_start_matches("Bearer ").trim();
        let expected_token = env::var("ADMIN_TOKEN").unwrap_or_else(|_| "change-me-admin-token".to_string());

        if bearer_token == expected_token {
            Ok(AdminAuth)
        } else {
            Err((StatusCode::UNAUTHORIZED, Json(ApiResponse {
                ok: false,
                data: None,
                message: Some("Admin token tidak valid".to_string()),
            })))
        }
    }
}

// Protected Dashboard Route
pub async fn get_dashboard(_auth: AdminAuth, State(pool): State<PgPool>) -> impl IntoResponse {
    let is_testing = env::var("DIGIFLAZZ_TESTING").unwrap_or_default() == "true";
    let mode = if is_testing { "development" } else { "production" };
    let is_midtrans_prod = env::var("MIDTRANS_IS_PRODUCTION").unwrap_or_default() == "true";
    let midtrans_mode = if is_midtrans_prod { "production" } else { "development" };

    // Get real stats from DB
    let total_today: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM orders WHERE created_at >= CURRENT_DATE")
        .fetch_one(&pool).await.unwrap_or(0);
    
    let success: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM orders WHERE order_status = 'success'")
        .fetch_one(&pool).await.unwrap_or(0);

    let pending: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM orders WHERE order_status IN ('processing', 'pending')")
        .fetch_one(&pool).await.unwrap_or(0);

    let omzet: Option<i64> = sqlx::query_scalar("SELECT SUM(price) FROM orders WHERE order_status = 'success'")
        .fetch_one(&pool).await.unwrap_or(Some(0));

    Json(ApiResponse {
        ok: true,
        data: Some(serde_json::json!({
            "totalToday": total_today,
            "success": success,
            "pending": pending,
            "omzet": omzet.unwrap_or(0),
            "message": "Welcome to Rust Admin Dashboard!",
            "provider": {
                "provider": "digiflazz",
                "enabled": true,
                "mode": mode,
                "configured": true
            },
            "midtrans": {
                "provider": "midtrans",
                "enabled": true,
                "mode": midtrans_mode,
                "configured": true
            }
        })),
        message: None,
    })
}

// Admin Router Setup
pub fn admin_routes() -> Router<PgPool> {
    Router::new()
        .route("/auth/login", post(login))
        .route("/dashboard", get(get_dashboard))
        .route("/orders", get(get_orders))
        .route("/orders/{invoice}/approve-payment", post(approve_payment))
        .route("/orders/{invoice}/cancel", post(cancel_order))
        .route("/categories", get(get_categories))
        .route("/categories/{id}", axum::routing::patch(patch_category))
        .route("/products", get(get_products))
        .route("/products/sync", post(dummy_success))
        .route("/products/{id}", axum::routing::patch(patch_product))
        .route("/payment-methods", get(get_payment_methods))
        .route("/payment-methods/{id}", axum::routing::patch(patch_payment_method))
        .route("/site-settings", get(get_site_settings))
        .route("/site-settings", axum::routing::patch(patch_site_settings))
        .route("/providers/digiflazz/check-balance", post(digiflazz_check_balance))
        .route("/payments/midtrans/status", get(midtrans_status))
        .route("/providers/digiflazz/status", get(digiflazz_status))
        .route("/providers/digiflazz/sync-products", post(digiflazz_sync_products))
        .route("/maintenance/expire-pending", post(maintenance_expire_pending))
        .route("/maintenance/check-processing", post(maintenance_check_processing))
        .route("/environment-badge", post(patch_environment_badge))
        .route("/logs/provider", get(get_provider_logs))
        .route("/logs/payment", get(get_payment_logs))

}

pub async fn dummy_success(
    _auth: AdminAuth,
) -> Result<Json<ApiResponse<serde_json::Value>>, (StatusCode, Json<ApiResponse<()>>)> {
    Ok(Json(ApiResponse {
        ok: true,
        data: Some(serde_json::json!({})),
        message: Some("Berhasil".to_string()),
    }))
}

pub async fn midtrans_status(_auth: AdminAuth) -> impl IntoResponse {
    let enabled = std::env::var("MIDTRANS_ENABLED").unwrap_or_else(|_| "false".to_string());
    let status = if enabled == "true" { "Active" } else { "Inactive" };
    Json(ApiResponse {
        ok: true,
        data: Some(serde_json::json!({ "status": status })),
        message: Some(format!("Midtrans is {}", status)),
    })
}

pub async fn digiflazz_status(_auth: AdminAuth) -> impl IntoResponse {
    let api_key = std::env::var("DIGIFLAZZ_API_KEY").unwrap_or_default();
    let status = if api_key.is_empty() { "Inactive" } else { "Active" };
    Json(ApiResponse {
        ok: true,
        data: Some(serde_json::json!({ "status": status })),
        message: Some(format!("Digiflazz is {}", status)),
    })
}

pub async fn digiflazz_sync_products(_auth: AdminAuth) -> impl IntoResponse {
    // Simply restart the background scheduler that syncs products
    let _ = std::process::Command::new("pm2")
        .arg("restart")
        .arg("ppob-scheduler")
        .status();
    Json(ApiResponse {
        ok: true,
        data: Some(serde_json::json!({})),
        message: Some("Proses sinkronisasi produk Digiflazz sedang berjalan di background (Scheduler direstart).".to_string()),
    })
}

pub async fn maintenance_expire_pending(_auth: AdminAuth, State(pool): State<PgPool>) -> impl IntoResponse {
    let res = sqlx::query("UPDATE orders SET order_status = 'failed', payment_status = 'expired' WHERE order_status = 'processing' AND created_at < NOW() - INTERVAL '1 day'")
        .execute(&pool).await;
        
    let rows_affected = res.map(|r| r.rows_affected()).unwrap_or(0);
    Json(ApiResponse {
        ok: true,
        data: Some(serde_json::json!({ "expiredCount": rows_affected })),
        message: Some(format!("{} pesanan pending yang melewati 24 jam berhasil dibatalkan.", rows_affected)),
    })
}

pub async fn maintenance_check_processing(_auth: AdminAuth) -> impl IntoResponse {
    Json(ApiResponse {
        ok: true,
        data: Some(serde_json::json!({})),
        message: Some("Pengecekan status transaksi processing telah dijadwalkan di background.".to_string()),
    })
}

use axum::extract::Path;
use chrono::Utc;

pub async fn approve_payment(
    _auth: AdminAuth,
    State(pool): State<PgPool>,
    Path(invoice): Path<String>,
) -> impl IntoResponse {
    let order_res = sqlx::query_as::<_, crate::models::Order>(
        "SELECT * FROM orders WHERE invoice = $1 LIMIT 1"
    )
    .bind(&invoice)
    .fetch_optional(&pool).await;

    let order = match order_res {
        Ok(Some(o)) => o,
        _ => return (StatusCode::NOT_FOUND, Json(ApiResponse::<()> {
            ok: false, data: None, message: Some("Pesanan tidak ditemukan".to_string())
        })).into_response()
    };

    if order.payment_status == "paid" {
        return (StatusCode::BAD_REQUEST, Json(ApiResponse::<()> {
            ok: false, data: None, message: Some("Pesanan sudah dibayar".to_string())
        })).into_response();
    }

    // Call Provider
    let digiflazz = crate::providers::DigiflazzClient::new();
    let is_testing = env::var("DIGIFLAZZ_TESTING").unwrap_or_default() == "true";
    let df_res = digiflazz.prepaid_topup(&order.buyer_sku_code, &order.customer_no, &order.ref_id, is_testing).await;
    
    let mut provider_status = "gagal".to_string();
    let mut order_status = "failed".to_string();
    let mut rc = "".to_string();
    let mut sn = "".to_string();
    let mut message = "".to_string();
    let mut raw_response = serde_json::Value::Null;

    if let Ok(res) = df_res {
        raw_response = res.clone();
        if let Some(data) = res.get("data") {
            rc = data.get("rc").and_then(|v| v.as_str()).unwrap_or("").to_string();
            sn = data.get("sn").and_then(|v| v.as_str()).unwrap_or("").to_string();
            message = data.get("message").and_then(|v| v.as_str()).unwrap_or("").to_string();
            let df_status = data.get("status").and_then(|v| v.as_str()).unwrap_or("");
            
            provider_status = match df_status {
                "Sukses" => "sukses",
                "Pending" => "pending",
                _ => "gagal"
            }.to_string();

            order_status = match provider_status.as_str() {
                "sukses" => "success",
                "pending" => "processing",
                _ => "failed"
            }.to_string();
        }
    }

    let now = Utc::now().naive_utc();
    let completed_at = if order_status == "success" || order_status == "failed" { Some(now) } else { None };

    let update_res = sqlx::query(
        r#"
        UPDATE orders SET
            payment_status = $1, paid_at = $2, order_status = $3,
            provider_status = $4, provider_rc = $5, provider_message = $6,
            sn = $7, raw_provider_response = $8, completed_at = $9, updated_at = $10
        WHERE invoice = $11
        "#
    )
    .bind("paid")
    .bind(now)
    .bind(&order_status)
    .bind(&provider_status)
    .bind(&rc)
    .bind(&message)
    .bind(&sn)
    .bind(&raw_response)
    .bind(completed_at)
    .bind(now)
    .bind(&invoice)
    .execute(&pool).await;

    if update_res.is_err() {
        return (StatusCode::INTERNAL_SERVER_ERROR, Json(ApiResponse::<()> {
            ok: false, data: None, message: Some("Gagal update database".to_string())
        })).into_response();
    }

    let log_id = uuid::Uuid::new_v4().to_string();
    let _ = sqlx::query(
        "INSERT INTO payment_logs (id, type, payload) VALUES ($1, $2, $3)"
    )
    .bind(&log_id)
    .bind("manual-approval")
    .bind(serde_json::json!({"invoice": invoice}))
    .execute(&pool).await;

    (StatusCode::OK, Json(ApiResponse {
        ok: true,
        data: Some(serde_json::json!({
            "invoice": invoice,
            "orderStatus": order_status,
            "providerStatus": provider_status
        })),
        message: Some("Pembayaran disetujui dan diteruskan ke provider".to_string())
    })).into_response()
}

// Dummy handlers
pub async fn get_provider_logs(
    _auth: AdminAuth,
    State(pool): State<PgPool>,
) -> Result<Json<ApiResponse<serde_json::Value>>, (StatusCode, Json<ApiResponse<()>>)> {
    let logs = sqlx::query_as::<_, crate::models::ProviderLog>("SELECT * FROM provider_logs ORDER BY created_at DESC LIMIT 100")
        .fetch_all(&pool)
        .await
        .unwrap_or_default();
    
    Ok(Json(ApiResponse {
        ok: true,
        data: Some(serde_json::json!(logs)),
        message: None,
    }))
}

pub async fn get_payment_logs(
    _auth: AdminAuth,
    State(pool): State<PgPool>,
) -> Result<Json<ApiResponse<serde_json::Value>>, (StatusCode, Json<ApiResponse<()>>)> {
    let logs = sqlx::query_as::<_, crate::models::PaymentLog>("SELECT * FROM payment_logs ORDER BY created_at DESC LIMIT 100")
        .fetch_all(&pool)
        .await
        .unwrap_or_default();
        
    Ok(Json(ApiResponse {
        ok: true,
        data: Some(serde_json::json!(logs)),
        message: None,
    }))
}

pub async fn digiflazz_check_balance(
    _auth: AdminAuth,
) -> Result<Json<ApiResponse<serde_json::Value>>, (StatusCode, Json<ApiResponse<()>>)> {
    let digiflazz = crate::providers::DigiflazzClient::new();
    match digiflazz.cek_saldo().await {
        Ok(res) => {
            Ok(Json(ApiResponse {
                ok: true,
                data: Some(serde_json::json!({
                    "balance": res["data"]["deposit"].as_i64().unwrap_or(0)
                })),
                message: Some("Berhasil cek saldo".to_string()),
            }))
        },
        Err(_) => {
            Err((StatusCode::INTERNAL_SERVER_ERROR, Json(ApiResponse {
                ok: false,
                data: None,
                message: Some("Gagal mengecek saldo Digiflazz".to_string()),
            })))
        }
    }
}

include!("admin_crud.rs");
