use axum::{
    extract::State,
    http::{HeaderMap, StatusCode},
    response::IntoResponse,
    routing::post,
    Json, Router,
};
use hmac::{Hmac, Mac};
use hmac::digest::KeyInit;
use sha1::Sha1;
use sha2::{Sha512, Digest as Sha2Digest};
use sqlx::PgPool;
use std::env;
use chrono::Utc;

use crate::handlers::ApiResponse;
use crate::models::Order;

type HmacSha1 = Hmac<Sha1>;

// We need the raw body to verify the signature. 
// Axum's `Bytes` extractor will give us the exact raw body.
pub async fn digiflazz_webhook(
    headers: HeaderMap,
    State(pool): State<PgPool>,
    body: axum::body::Bytes,
) -> impl IntoResponse {
    let secret = env::var("DIGIFLAZZ_WEBHOOK_SECRET").unwrap_or_default();
    
    // If secret is set, verify the signature
    if !secret.is_empty() {
        let signature_header = headers.get("x-hub-signature")
            .and_then(|val| val.to_str().ok())
            .unwrap_or("");
            
        println!("Digiflazz Webhook hit! Signature header: {}", signature_header);
        
        let mut mac = HmacSha1::new_from_slice(secret.as_bytes())
            .expect("HMAC can take key of any size");
        mac.update(&body);
        
        let result = mac.finalize();
        let expected_signature = format!("sha1={}", hex::encode(result.into_bytes()));

        if signature_header != expected_signature {
            let body_str = String::from_utf8_lossy(&body);
            println!("Digiflazz Webhook signature MISMATCH. Expected: {}, Got: {}", expected_signature, signature_header);
            println!("Raw body for mismatch: {}", body_str);
            return (
                StatusCode::UNAUTHORIZED,
                Json(ApiResponse::<()> {
                    ok: false,
                    data: None,
                    message: Some("Signature webhook Digiflazz tidak valid".to_string()),
                }),
            ).into_response();
        }
    }

    // Try parsing the body into JSON to process the payload
    if let Ok(payload) = serde_json::from_slice::<serde_json::Value>(&body) {
        println!("Received valid Digiflazz webhook: {:?}", payload);
        
        let d = &payload["data"];
        let ref_id = d["ref_id"].as_str().unwrap_or("");
        let status = d["status"].as_str().unwrap_or("").to_lowercase();
        let message = d["message"].as_str().unwrap_or("");
        let sn = d["sn"].as_str().unwrap_or("");
        
        let rc = d["rc"].as_str().unwrap_or("");
        
        let order_status = match status.as_str() {
            "sukses" => "success",
            "pending" => "processing",
            _ => "failed"
        };
        
        let now = Utc::now().naive_utc();
        let completed_at = if order_status == "success" || order_status == "failed" { Some(now) } else { None };

        let _ = sqlx::query(
            "UPDATE orders SET order_status = $1, provider_status = $2, provider_message = $3, sn = $4, provider_rc = $5, completed_at = $6, updated_at = $7 WHERE ref_id = $8"
        )
        .bind(order_status)
        .bind(&status)
        .bind(message)
        .bind(sn)
        .bind(rc)
        .bind(completed_at)
        .bind(now)
        .bind(ref_id)
        .execute(&pool).await;
        
        return (
            StatusCode::OK,
            Json(ApiResponse {
                ok: true,
                data: Some(serde_json::json!({"status": "received"})),
                message: Some("Webhook diterima".to_string()),
            }),
        ).into_response();
    }

    (
        StatusCode::BAD_REQUEST,
        Json(ApiResponse::<()> {
            ok: false,
            data: None,
            message: Some("Invalid JSON payload".to_string()),
        }),
    ).into_response()
}

pub async fn midtrans_webhook(
    State(pool): State<PgPool>,
    Json(payload): Json<serde_json::Value>,
) -> impl IntoResponse {
    let server_key = env::var("MIDTRANS_SERVER_KEY").unwrap_or_default();
    
    let order_id = payload["order_id"].as_str().unwrap_or("");
    let status_code = payload["status_code"].as_str().unwrap_or("");
    let gross_amount = payload["gross_amount"].as_str().unwrap_or("");
    let signature_key = payload["signature_key"].as_str().unwrap_or("");
    let transaction_status = payload["transaction_status"].as_str().unwrap_or("");
    
    // Validate Signature
    let sign_payload = format!("{}{}{}{}", order_id, status_code, gross_amount, server_key);
    let mut hasher = Sha512::new();
    hasher.update(sign_payload.as_bytes());
    let calculated_signature = hex::encode(hasher.finalize());
    
    if calculated_signature != signature_key {
        return (
            StatusCode::UNAUTHORIZED,
            Json(ApiResponse::<()> {
                ok: false,
                data: None,
                message: Some("Invalid Midtrans Signature".to_string()),
            }),
        ).into_response();
    }

    if transaction_status == "settlement" || transaction_status == "capture" {
        // Find the order
        let order_res = sqlx::query_as::<_, Order>("SELECT * FROM orders WHERE invoice = $1")
            .bind(order_id)
            .fetch_optional(&pool)
            .await;
            
        if let Ok(Some(order)) = order_res {
            if order.payment_status == "unpaid" {
                let now = Utc::now().naive_utc();
                
                // Update payment_status to paid, and order_status to processing
                let _ = sqlx::query(
                    "UPDATE orders SET payment_status = $1, paid_at = $2, order_status = $3, updated_at = $4 WHERE invoice = $5"
                )
                .bind("paid")
                .bind(now)
                .bind("processing")
                .bind(now)
                .bind(order_id)
                .execute(&pool).await;

                // Fire Digiflazz Topup!
                if !order.buyer_sku_code.is_empty() && !order.customer_no.is_empty() {
                    let digiflazz = crate::providers::DigiflazzClient::new();
                    let testing_mode = env::var("DIGIFLAZZ_TESTING").unwrap_or_else(|_| "false".to_string()) == "true";
                    
                    let ref_id = order.ref_id.clone();
                    
                    match digiflazz.prepaid_topup(&order.buyer_sku_code, &order.customer_no, &ref_id, testing_mode).await {
                        Ok(res) => {
                            let d = &res["data"];
                            let status = d["status"].as_str().unwrap_or("").to_lowercase();
                            let message = d["message"].as_str().unwrap_or("");
                            let sn = d["sn"].as_str().unwrap_or("");
                            let rc = d["rc"].as_str().unwrap_or("");
                            
                            let order_status = match status.as_str() {
                                "sukses" => "success",
                                "pending" => "processing",
                                _ => "failed"
                            };
                            
                            let completed_at = if order_status == "success" || order_status == "failed" { Some(now) } else { None };
                            
                            let _ = sqlx::query(
                                "UPDATE orders SET order_status = $1, provider_status = $2, provider_message = $3, sn = $4, provider_rc = $5, raw_provider_response = $6, completed_at = $7, updated_at = $8 WHERE ref_id = $9"
                            )
                            .bind(order_status)
                            .bind(status)
                            .bind(message)
                            .bind(sn)
                            .bind(rc)
                            .bind(&res)
                            .bind(completed_at)
                            .bind(now)
                            .bind(ref_id)
                            .execute(&pool).await;
                        },
                        Err(e) => {
                            eprintln!("Failed to topup Digiflazz automatically: {}", e);
                        }
                    }
                }
            }
        }
    }
    
    (
        StatusCode::OK,
        Json(ApiResponse {
            ok: true,
            data: Some(serde_json::json!({"status": "received"})),
            message: Some("Midtrans webhook processed".to_string()),
        }),
    ).into_response()
}

pub fn webhook_routes() -> Router<PgPool> {
    Router::new()
        .route("/digiflazz", post(digiflazz_webhook))
        .route("/midtrans", post(midtrans_webhook))
}
