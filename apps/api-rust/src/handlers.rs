use axum::{
    extract::{State, Query},
    response::IntoResponse,
    Json,
};
use serde::{Deserialize, Serialize};
use sqlx::PgPool;

use crate::models::{Category, Product, PaymentMethod, SiteSetting};

#[derive(Serialize)]
pub struct ApiResponse<T> {
    pub ok: bool,
    pub data: Option<T>,
    pub message: Option<String>,
}

pub async fn get_home_content(State(pool): State<PgPool>) -> impl IntoResponse {
    let result = sqlx::query_as::<_, SiteSetting>("SELECT * FROM site_settings LIMIT 1")
        .fetch_optional(&pool)
        .await;

    match result {
        Ok(Some(settings)) => Json(ApiResponse {
            ok: true,
            data: Some(settings),
            message: None,
        }),
        Ok(None) => Json(ApiResponse {
            ok: false,
            data: None,
            message: Some("Home content not found".to_string()),
        }),
        Err(e) => {
            eprintln!("DB Error: {}", e);
            Json(ApiResponse {
                ok: false,
                data: None,
                message: Some("Internal Server Error".to_string()),
            })
        }
    }
}

pub async fn get_categories(
    State(pool): State<PgPool>,
    Query(filter): Query<ProductFilter>,
) -> impl IntoResponse {
    let result = sqlx::query_as::<_, Category>(
        "SELECT * FROM categories WHERE is_active = true ORDER BY name ASC"
    )
    .fetch_all(&pool)
    .await;

    match result {
        Ok(mut categories) => {
            if crate::store::is_storefront_audience(filter.audience.as_ref()) {
                match sqlx::query_as::<_, Product>("SELECT * FROM products WHERE is_active = true").fetch_all(&pool).await {
                    Ok(mut products) => {
                        let mut slug_map = std::collections::HashMap::new();
                        for cat in &categories {
                            slug_map.insert(cat.id.clone(), cat.slug.clone());
                        }
                        for product in &mut products {
                            if let Some(cat_id) = &product.category_id {
                                if let Some(slug) = slug_map.get(cat_id) {
                                    product.category_slug = Some(slug.clone());
                                }
                            }
                        }
                        categories = crate::store::build_storefront_categories(categories, &products);
                    },
                    Err(e) => {
                        eprintln!("Failed to fetch products for storefront categories: {}", e);
                    }
                }
            }
            Json(ApiResponse {
                ok: true,
                data: Some(categories),
                message: None,
            })
        },
        Err(e) => {
            eprintln!("DB Error: {}", e);
            Json(ApiResponse {
                ok: false,
                data: None,
                message: Some("Internal Server Error".to_string()),
            })
        }
    }
}

#[derive(Deserialize)]
pub struct ProductFilter {
    #[serde(alias = "category")]
    pub category_id: Option<String>,
    pub audience: Option<String>,
    pub dedupe: Option<String>,
}

pub async fn get_products(
    State(pool): State<PgPool>,
    Query(filter): Query<ProductFilter>,
) -> impl IntoResponse {
    
    // Fetch all active products
    let result = sqlx::query_as::<_, Product>(
        "SELECT * FROM products WHERE is_active = true ORDER BY selling_price ASC"
    )
    .fetch_all(&pool)
    .await;

    match result {
        Ok(mut products) => {
            // Attach category_slug manually
            if let Ok(categories) = sqlx::query_as::<_, Category>("SELECT * FROM categories").fetch_all(&pool).await {
                let mut slug_map = std::collections::HashMap::new();
                for cat in categories {
                    slug_map.insert(cat.id, cat.slug);
                }
                for product in &mut products {
                    if let Some(cat_id) = &product.category_id {
                        if let Some(slug) = slug_map.get(cat_id) {
                            product.category_slug = Some(slug.clone());
                        }
                    }
                }
            }

            // In-memory filter for category (to support both UUID and slug like Node API)
            if let Some(cat_filter) = &filter.category_id {
                products.retain(|p| {
                    let matches_id = p.category_id.as_deref() == Some(cat_filter);
                    let matches_slug = p.category_slug.as_deref() == Some(cat_filter);
                    matches_id || matches_slug
                });
            }

            if crate::store::is_storefront_audience(filter.audience.as_ref()) {
                products.retain(crate::store::is_storefront_product);
            }
            if filter.dedupe.as_deref() == Some("true") {
                products = crate::store::dedupe_and_sort_products(products);
            }
            
            Json(ApiResponse {
                ok: true,
                data: Some(products),
                message: None,
            })
        },
        Err(e) => {
            eprintln!("DB Error: {}", e);
            Json(ApiResponse {
                ok: false,
                data: None,
                message: Some("Internal Server Error".to_string()),
            })
        }
    }
}

pub async fn get_payment_methods(State(pool): State<PgPool>) -> impl IntoResponse {
    let result = sqlx::query_as::<_, PaymentMethod>(
        "SELECT * FROM payment_methods WHERE is_enabled = true ORDER BY name ASC"
    )
    .fetch_all(&pool)
    .await;

    match result {
        Ok(methods) => Json(ApiResponse {
            ok: true,
            data: Some(methods),
            message: None,
        }),
        Err(e) => {
            eprintln!("DB Error: {}", e);
            Json(ApiResponse {
                ok: false,
                data: None,
                message: Some("Internal Server Error".to_string()),
            })
        }
    }
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PlnInquiryReq {
    pub customer_no: Option<String>,
}

pub async fn pln_inquiry(
    State(_pool): State<PgPool>,
    Json(payload): Json<PlnInquiryReq>,
) -> impl IntoResponse {
    let customer_no = payload.customer_no.unwrap_or_default();
    let sanitized_no = customer_no.replace(" ", "");
    
    if sanitized_no.len() < 6 {
        return (
            axum::http::StatusCode::BAD_REQUEST,
            Json(ApiResponse::<()> {
                ok: false,
                data: None,
                message: Some("ID pelanggan / nomor meter PLN tidak valid.".to_string()),
            }),
        ).into_response();
    }

    let digiflazz = crate::providers::DigiflazzClient::new();
    match digiflazz.inquiry_pln(&sanitized_no).await {
        Ok(result) => {
            let rc = result["data"]["rc"].as_str().unwrap_or("");
            if rc == "00" {
                let d = &result["data"];
                let name = d["name"].as_str().unwrap_or("").trim();
                let cno = d["customer_no"].as_str().unwrap_or("");
                let mno = d["meter_no"].as_str().unwrap_or("");
                let spower = d["segment_power"].as_str().unwrap_or("");
                
                (
                    axum::http::StatusCode::OK,
                    Json(ApiResponse {
                        ok: true,
                        data: Some(serde_json::json!({
                            "valid": true,
                            "name": name,
                            "customerName": name,
                            "customerNoMasked": cno,
                            "meterNoMasked": mno,
                            "segmentPower": spower,
                            "raw": result
                        })),
                        message: Some("Inquiry PLN sukses.".to_string()),
                    }),
                ).into_response()
            } else {
                (
                    axum::http::StatusCode::BAD_REQUEST,
                    Json(ApiResponse {
                        ok: false,
                        data: Some(serde_json::json!({
                            "valid": false,
                            "raw": result
                        })),
                        message: Some("Inquiry PLN gagal.".to_string()),
                    }),
                ).into_response()
            }
        }
        Err(e) => {
            (
                axum::http::StatusCode::BAD_REQUEST,
                Json(ApiResponse::<()> {
                    ok: false,
                    data: None,
                    message: Some(format!("Gagal menghubungi provider: {}", e)),
                }),
            ).into_response()
        }
    }
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateOrderReq {
    #[serde(alias = "buyerSkuCode", alias = "product_id")]
    pub product_id: Option<String>,
    #[serde(alias = "customer_no")]
    pub customer_no: Option<String>,
    #[serde(alias = "paymentMethodId", alias = "paymentMethod", alias = "payment_method_id")]
    pub payment_method_id: Option<String>,
}

fn mask_customer_no(no: &str) -> String {
    if no.len() <= 4 { return no.to_string(); }
    let start = &no[0..4];
    let end = if no.len() > 7 { &no[no.len()-3..] } else { "" };
    format!("{}***{}", start, end)
}

pub async fn create_order(
    State(pool): State<PgPool>,
    Json(payload): Json<CreateOrderReq>,
) -> impl IntoResponse {
    let product_id = payload.product_id.unwrap_or_default();
    let customer_no = payload.customer_no.unwrap_or_default();
    let payment_method_id = payload.payment_method_id.unwrap_or_else(|| "manual-qris".to_string());

    if product_id.is_empty() || customer_no.is_empty() {
        return (
            axum::http::StatusCode::BAD_REQUEST,
            Json(ApiResponse::<()> {
                ok: false, data: None, message: Some("Missing fields".to_string())
            })
        ).into_response();
    }

    // Fetch product
    let product_res = sqlx::query_as::<_, Product>(
        "SELECT * FROM products WHERE (id = $1 OR buyer_sku_code = $1) AND is_active = true LIMIT 1"
    )
    .bind(&product_id)
    .fetch_optional(&pool).await;

    let product = match product_res {
        Ok(Some(p)) => p,
        _ => return (
            axum::http::StatusCode::BAD_REQUEST,
            Json(ApiResponse::<()> {
                ok: false, data: None, message: Some("Produk tidak valid atau nonaktif".to_string())
            })
        ).into_response()
    };

    // Fetch payment method
    let method_res = sqlx::query_as::<_, PaymentMethod>(
        "SELECT * FROM payment_methods WHERE id = $1 AND is_enabled = true LIMIT 1"
    )
    .bind(&payment_method_id)
    .fetch_optional(&pool).await;

    let payment_method = match method_res {
        Ok(Some(m)) => m,
        _ => return (
            axum::http::StatusCode::BAD_REQUEST,
            Json(ApiResponse::<()> {
                ok: false, data: None, message: Some("Payment method tidak valid".to_string())
            })
        ).into_response()
    };

    // Generate IDs
    let uuid_str = uuid::Uuid::new_v4().to_string().replace("-", "");
    let invoice = format!("INV-{}", &uuid_str[0..12].to_uppercase());
    let ref_id = format!("PRE-{}", &uuid_str[12..24].to_uppercase());

    let admin_fee = payment_method.admin_fee.unwrap_or(0);
    let total_amount = product.selling_price + admin_fee;

    // Insert Order
    let insert_res = sqlx::query(
        r#"
        INSERT INTO orders (
            id, invoice, ref_id, type, product_id, payment_method_id, buyer_sku_code,
            customer_no, customer_no_masked, amount, admin_fee, total_amount,
            payment_method, payment_status, order_status, provider_status
        ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16
        )
        "#
    )
    .bind(&invoice)
    .bind(&invoice)
    .bind(&ref_id)
    .bind("prepaid")
    .bind(&product.id)
    .bind(&payment_method.id)
    .bind(&product.buyer_sku_code)
    .bind(&customer_no)
    .bind(mask_customer_no(&customer_no))
    .bind(product.selling_price)
    .bind(admin_fee)
    .bind(total_amount)
    .bind(&payment_method.id)
    .bind("unpaid")
    .bind("pending")
    .bind("waiting_payment")
    .execute(&pool).await;

    if insert_res.is_err() {
        return (
            axum::http::StatusCode::INTERNAL_SERVER_ERROR,
            Json(ApiResponse::<()> {
                ok: false, data: None, message: Some("Failed to create order".to_string())
            })
        ).into_response();
    }

    // Insert Payment Log
    let log_id = uuid::Uuid::new_v4().to_string();
    let payload_json = serde_json::json!({
        "invoice": invoice,
        "paymentMethod": payment_method.id,
        "totalAmount": total_amount
    });
    let _ = sqlx::query(
        "INSERT INTO payment_logs (id, type, payload) VALUES ($1, $2, $3)"
    )
    .bind(&log_id)
    .bind("invoice-created")
    .bind(payload_json)
    .execute(&pool).await;

    // Call Midtrans if it is a midtrans method
    let mut midtrans_data = None;
    if payment_method.provider == "midtrans" {
        let mid_client = crate::providers::MidtransClient::new();
        let mid_input = crate::providers::MidtransOrderInput {
            invoice: &invoice,
            product_name: &product.name,
            customer_no: Some(&customer_no),
            customer_name: Some("Pelanggan"),
            amount: product.selling_price,
            admin_fee,
            total_amount,
        };

        match mid_client.create_snap_transaction(mid_input).await {
            Ok(snap) => { midtrans_data = Some(snap); },
            Err(e) => {
                eprintln!("Midtrans Error: {}", e);
            }
        }
    }

    let response_data = serde_json::json!({
        "order": {
            "invoice": invoice,
            "refId": ref_id,
            "productName": product.name,
            "customerNo": customer_no,
            "totalAmount": total_amount,
            "paymentStatus": "unpaid",
            "orderStatus": "pending"
        },
        "paymentMethod": payment_method,
        "midtrans": midtrans_data
    });

    (
        axum::http::StatusCode::CREATED,
        Json(ApiResponse {
            ok: true,
            data: Some(response_data),
            message: Some("Order created".to_string())
        })
    ).into_response()
}


use axum::extract::Path;

pub async fn pay_midtrans(
    State(pool): State<PgPool>,
    Path(invoice): Path<String>,
) -> impl IntoResponse {
    let order_res = sqlx::query_as::<_, crate::models::Order>(
        "SELECT * FROM orders WHERE invoice = $1 OR ref_id = $1 LIMIT 1"
    )
    .bind(&invoice)
    .fetch_optional(&pool)
    .await;

    let order = match order_res {
        Ok(Some(o)) => o,
        _ => return (
            axum::http::StatusCode::NOT_FOUND,
            Json(ApiResponse::<()> { ok: false, data: None, message: Some("Invoice tidak ditemukan".to_string()) })
        ).into_response()
    };

    if order.payment_status == "paid" {
        return (
            axum::http::StatusCode::BAD_REQUEST,
            Json(ApiResponse::<()> { ok: false, data: None, message: Some("Pesanan sudah dibayar".to_string()) })
        ).into_response();
    }

    let product_res = sqlx::query_as::<_, Product>(
        "SELECT * FROM products WHERE id = $1 LIMIT 1"
    )
    .bind(&order.product_id)
    .fetch_optional(&pool)
    .await;

    let product_name = match product_res {
        Ok(Some(p)) => p.name,
        _ => "Produk Digital".to_string()
    };

    let mid_client = crate::providers::MidtransClient::new();
    let customer_no_str = if order.customer_no.is_empty() { "080000000000" } else { &order.customer_no };

    let mid_input = crate::providers::MidtransOrderInput {
        invoice: &order.invoice,
        product_name: &product_name,
        customer_no: Some(customer_no_str),
        customer_name: Some("Pelanggan"),
        amount: order.amount,
        admin_fee: order.admin_fee.unwrap_or(0),
        total_amount: order.total_amount,
    };

    match mid_client.create_snap_transaction(mid_input).await {
        Ok(snap) => {
            let response_data = serde_json::json!({
                "order": { "invoice": order.invoice },
                "midtrans": snap
            });
            
            (
                axum::http::StatusCode::OK,
                Json(ApiResponse { ok: true, data: Some(response_data), message: Some("Midtrans payment link generated".to_string()) })
            ).into_response()
        },
        Err(e) => {
            (
                axum::http::StatusCode::INTERNAL_SERVER_ERROR,
                Json(ApiResponse::<()> { ok: false, data: None, message: Some(format!("Gagal membuat pembayaran Midtrans: {}", e)) })
            ).into_response()
        }
    }
}


pub async fn get_order(
    State(pool): State<PgPool>,
    Path(invoice): Path<String>,
) -> impl IntoResponse {
    let order_res = sqlx::query_as::<_, crate::models::Order>(
        "SELECT * FROM orders WHERE invoice = $1 OR ref_id = $1 LIMIT 1"
    )
    .bind(&invoice)
    .fetch_optional(&pool)
    .await;

    let order = match order_res {
        Ok(Some(o)) => o,
        _ => return (
            axum::http::StatusCode::NOT_FOUND,
            Json(ApiResponse::<()> {
                ok: false, data: None, message: Some("Invoice tidak ditemukan".to_string())
            })
        ).into_response()
    };

    let method_res = sqlx::query_as::<_, PaymentMethod>(
        "SELECT * FROM payment_methods WHERE id = $1 LIMIT 1"
    )
    .bind(&order.payment_method_id)
    .fetch_optional(&pool)
    .await;

    let payment_method = method_res.unwrap_or_default();

    // Fetch the actual product to get the real name and provider
    let product_name = if let Some(pid) = &order.product_id {
        let product_res = sqlx::query!("SELECT name FROM products WHERE id = $1", pid).fetch_optional(&pool).await;
        if let Ok(Some(row)) = product_res {
            row.name
        } else {
            order.buyer_sku_code.clone()
        }
    } else {
        order.buyer_sku_code.clone()
    };

    let response_data = serde_json::json!({
        "order": {
            "invoice": order.invoice,
            "refId": order.ref_id,
            "productName": product_name,
            "buyerSkuCode": order.buyer_sku_code,
            "customerNo": order.customer_no_masked,
            "amount": order.amount,
            "adminFee": order.admin_fee.unwrap_or(0),
            "totalAmount": order.total_amount,
            "paymentStatus": order.payment_status,
            "orderStatus": order.order_status,
            "providerStatus": order.provider_status.unwrap_or_default(),
            "providerRc": order.provider_rc.unwrap_or_default(),
            "providerMessage": order.provider_message.unwrap_or_default(),
            "createdAt": order.created_at,
            "sn": order.sn.unwrap_or_default(),
        },
        "paymentMethod": payment_method
    });

    (
        axum::http::StatusCode::OK,
        Json(ApiResponse {
            ok: true,
            data: Some(response_data),
            message: None,
        })
    ).into_response()
}


pub async fn get_settings_public(State(pool): State<PgPool>) -> impl IntoResponse {
    let site = sqlx::query_as::<_, SiteSetting>("SELECT * FROM site_settings LIMIT 1").fetch_optional(&pool).await.unwrap_or(None);
    let theme = sqlx::query_as::<_, crate::models::ThemeSetting>("SELECT * FROM theme_settings LIMIT 1").fetch_optional(&pool).await.unwrap_or(None);
    let methods = sqlx::query_as::<_, PaymentMethod>("SELECT * FROM payment_methods WHERE is_enabled = true").fetch_all(&pool).await.unwrap_or_default();

    let site_val = site.map_or(serde_json::json!({}), |s| serde_json::to_value(s).unwrap_or(serde_json::json!({})));
    let theme_val = theme.map_or(serde_json::json!({}), |t| serde_json::to_value(t).unwrap_or(serde_json::json!({})));

    Json(ApiResponse {
        ok: true,
        data: Some(serde_json::json!({
            "site": site_val,
            "theme": theme_val,
            "paymentMethods": methods
        })),
        message: None,
    })
}

pub async fn get_maintenance_status(State(pool): State<PgPool>) -> impl IntoResponse {
    let site = sqlx::query_as::<_, SiteSetting>("SELECT * FROM site_settings LIMIT 1").fetch_optional(&pool).await.unwrap_or(None);

    let data = if let Some(s) = site {
        serde_json::json!({
            "maintenanceMode": s.maintenance_mode.unwrap_or(false),
            "maintenanceTitle": s.maintenance_title.unwrap_or_else(|| "Web Sedang Maintenance".to_string()),
            "maintenanceMessage": s.maintenance_message.unwrap_or_else(|| "Kami sedang melakukan perawatan sistem agar layanan PPOB lebih stabil dan aman.".to_string()),
            "maintenanceEta": s.maintenance_eta.unwrap_or_else(|| "Silakan cek kembali beberapa saat lagi.".to_string()),
            "maintenanceWhatsapp": s.maintenance_whatsapp.unwrap_or_else(|| s.whatsapp_number.unwrap_or_default())
        })
    } else {
        serde_json::json!({
            "maintenanceMode": false,
            "maintenanceTitle": "Web Sedang Maintenance",
            "maintenanceMessage": "Kami sedang melakukan perawatan.",
            "maintenanceEta": "Silakan cek kembali nanti.",
            "maintenanceWhatsapp": ""
        })
    };

    Json(ApiResponse {
        ok: true,
        data: Some(data),
        message: None,
    })
}
