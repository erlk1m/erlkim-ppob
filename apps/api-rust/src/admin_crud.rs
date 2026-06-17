pub async fn get_categories(_auth: AdminAuth, State(pool): State<PgPool>) -> impl IntoResponse {
    let cats = sqlx::query_as::<_, crate::models::Category>("SELECT * FROM categories ORDER BY created_at DESC").fetch_all(&pool).await.unwrap_or_default();
    Json(ApiResponse { ok: true, data: Some(cats), message: None })
}

pub async fn patch_category(_auth: AdminAuth, State(pool): State<PgPool>, Path(id): Path<String>, Json(payload): Json<serde_json::Value>) -> impl IntoResponse {
    let _ = sqlx::query("UPDATE categories SET auto_margin_type = COALESCE($1, auto_margin_type), auto_margin_value = COALESCE($2, auto_margin_value) WHERE id = $3")
        .bind(payload.get("autoMarginType").and_then(|v| v.as_str()))
        .bind(payload.get("autoMarginValue").and_then(|v| v.as_i64()).map(|v| v as i32))
        .bind(&id)
        .execute(&pool).await;
    let updated = sqlx::query_as::<_, crate::models::Category>("SELECT * FROM categories WHERE id = $1 LIMIT 1").bind(&id).fetch_optional(&pool).await.unwrap_or_default();
    Json(ApiResponse { ok: true, data: updated, message: None })
}

pub async fn get_products(_auth: AdminAuth, State(pool): State<PgPool>) -> impl IntoResponse {
    let prods = sqlx::query_as::<_, crate::models::Product>("SELECT * FROM products ORDER BY created_at DESC").fetch_all(&pool).await.unwrap_or_default();
    Json(ApiResponse { ok: true, data: Some(prods), message: None })
}

pub async fn patch_product(_auth: AdminAuth, State(pool): State<PgPool>, Path(id): Path<String>, Json(payload): Json<serde_json::Value>) -> impl IntoResponse {
    let _ = sqlx::query(
        "UPDATE products SET 
         is_active = COALESCE($1, is_active), 
         is_popular = COALESCE($2, is_popular), 
         is_flashsale = COALESCE($3, is_flashsale), 
         selling_price = COALESCE($4, selling_price), 
         margin = COALESCE($5, margin), 
         category_id = COALESCE($6, category_id), 
         description = COALESCE($7, description) 
         WHERE id = $8"
    )
    .bind(payload.get("isActive").and_then(|v| v.as_bool()))
    .bind(payload.get("isPopular").and_then(|v| v.as_bool()))
    .bind(payload.get("isFlashsale").and_then(|v| v.as_bool()))
    .bind(payload.get("sellingPrice").and_then(|v| v.as_i64()).map(|v| v as i32))
    .bind(payload.get("margin").and_then(|v| v.as_i64()).map(|v| v as i32))
    .bind(payload.get("categoryId").and_then(|v| v.as_str()))
    .bind(payload.get("description").and_then(|v| v.as_str()))
    .bind(&id)
    .execute(&pool).await;

    let updated = sqlx::query_as::<_, crate::models::Product>("SELECT * FROM products WHERE id = $1 LIMIT 1").bind(&id).fetch_optional(&pool).await.unwrap_or_default();
    Json(ApiResponse { ok: true, data: updated, message: None })
}

pub async fn get_payment_methods(_auth: AdminAuth, State(pool): State<PgPool>) -> impl IntoResponse {
    let methods = sqlx::query_as::<_, crate::models::PaymentMethod>("SELECT * FROM payment_methods ORDER BY admin_fee ASC").fetch_all(&pool).await.unwrap_or_default();
    Json(ApiResponse { ok: true, data: Some(methods), message: None })
}

pub async fn patch_payment_method(_auth: AdminAuth, State(pool): State<PgPool>, Path(id): Path<String>, Json(payload): Json<serde_json::Value>) -> impl IntoResponse {
    let _ = sqlx::query("UPDATE payment_methods SET is_enabled = COALESCE($1, is_enabled), admin_fee = COALESCE($2, admin_fee), qris_payload = COALESCE($3, qris_payload), merchant_name = COALESCE($4, merchant_name) WHERE id = $5")
        .bind(payload.get("isEnabled").and_then(|v| v.as_bool()))
        .bind(payload.get("adminFee").and_then(|v| v.as_i64()).map(|v| v as i32))
        .bind(payload.get("qrisPayload").and_then(|v| v.as_str()).map(|v| v.to_string()))
        .bind(payload.get("merchantName").and_then(|v| v.as_str()).map(|v| v.to_string()))
        .bind(&id)
        .execute(&pool).await;
    let updated = sqlx::query_as::<_, crate::models::PaymentMethod>("SELECT * FROM payment_methods WHERE id = $1 LIMIT 1").bind(&id).fetch_optional(&pool).await.unwrap_or_default();
    Json(ApiResponse { ok: true, data: updated, message: None })
}

pub async fn get_site_settings(_auth: AdminAuth, State(pool): State<PgPool>) -> impl IntoResponse {
    let site = sqlx::query_as::<_, crate::models::SiteSetting>("SELECT * FROM site_settings LIMIT 1").fetch_optional(&pool).await.unwrap_or_default();
    Json(ApiResponse { ok: true, data: site, message: None })
}

pub async fn patch_site_settings(_auth: AdminAuth, State(pool): State<PgPool>, Json(payload): Json<serde_json::Value>) -> impl IntoResponse {
    let _ = sqlx::query(
        "UPDATE site_settings SET 
         brand_name = COALESCE($1, brand_name), 
         hero_title = COALESCE($2, hero_title),
         hero_subtitle = COALESCE($3, hero_subtitle),
         logo_url = COALESCE($4, logo_url),
         running_text = COALESCE($5, running_text),
         whatsapp_number = COALESCE($6, whatsapp_number),
         footer_text = COALESCE($7, footer_text),
         seo_title = COALESCE($8, seo_title),
         global_auto_margin_type = COALESCE($9, global_auto_margin_type),
         global_auto_margin_value = COALESCE($10, global_auto_margin_value),
         maintenance_mode = COALESCE($11, maintenance_mode),
         maintenance_title = COALESCE($12, maintenance_title),
         maintenance_message = COALESCE($13, maintenance_message),
         maintenance_eta = COALESCE($14, maintenance_eta),
         maintenance_whatsapp = COALESCE($15, maintenance_whatsapp)"
    )
        .bind(payload.get("brandName").and_then(|v| v.as_str()))
        .bind(payload.get("featuredTitle").and_then(|v| v.as_str()).or_else(|| payload.get("heroTitle").and_then(|v| v.as_str())))
        .bind(payload.get("categoryTitle").and_then(|v| v.as_str()))
        .bind(payload.get("bannerImageUrl").and_then(|v| v.as_str()))
        .bind(payload.get("runningText").and_then(|v| v.as_str()))
        .bind(payload.get("whatsappNumber").and_then(|v| v.as_str()))
        .bind(payload.get("footerText").and_then(|v| v.as_str()))
        .bind(payload.get("whatsappLabel").and_then(|v| v.as_str()))
        .bind(payload.get("globalAutoMarginType").and_then(|v| v.as_str()))
        .bind(payload.get("globalAutoMarginValue").and_then(|v| v.as_i64()).map(|v| v as i32))
        .bind(payload.get("maintenanceMode").and_then(|v| v.as_bool()))
        .bind(payload.get("maintenanceTitle").and_then(|v| v.as_str()))
        .bind(payload.get("maintenanceMessage").and_then(|v| v.as_str()))
        .bind(payload.get("maintenanceEta").and_then(|v| v.as_str()))
        .bind(payload.get("maintenanceWhatsapp").and_then(|v| v.as_str()))
        .execute(&pool).await;
        
    let site = sqlx::query_as::<_, crate::models::SiteSetting>("SELECT * FROM site_settings LIMIT 1").fetch_optional(&pool).await.unwrap_or_default();
    Json(ApiResponse { ok: true, data: site, message: None })
}

pub async fn patch_environment_badge(_auth: AdminAuth, State(pool): State<PgPool>, Json(payload): Json<serde_json::Value>) -> impl IntoResponse {
    let _ = sqlx::query(
        "UPDATE site_settings SET 
         environment_badge_enabled = COALESCE($1, environment_badge_enabled),
         environment_badge_text = COALESCE($2, environment_badge_text),
         environment_badge_description = COALESCE($3, environment_badge_description),
         environment_badge_variant = COALESCE($4, environment_badge_variant),
         environment_badge_show_on_invoice = COALESCE($5, environment_badge_show_on_invoice)"
    )
        .bind(payload.get("environmentBadgeEnabled").and_then(|v| v.as_bool()))
        .bind(payload.get("environmentBadgeText").and_then(|v| v.as_str()))
        .bind(payload.get("environmentBadgeDescription").and_then(|v| v.as_str()))
        .bind(payload.get("environmentBadgeVariant").and_then(|v| v.as_str()))
        .bind(payload.get("environmentBadgeShowOnInvoice").and_then(|v| v.as_bool()))
        .execute(&pool).await;

    let site = sqlx::query_as::<_, crate::models::SiteSetting>("SELECT * FROM site_settings LIMIT 1").fetch_optional(&pool).await.unwrap_or_default();
    Json(ApiResponse { ok: true, data: site, message: None })
}


pub async fn get_orders(_auth: AdminAuth, State(pool): State<PgPool>) -> impl IntoResponse {
    let orders = sqlx::query_as::<_, crate::models::Order>("SELECT * FROM orders ORDER BY created_at DESC LIMIT 50").fetch_all(&pool).await.unwrap_or_default();
    Json(ApiResponse { ok: true, data: Some(orders), message: None })
}

pub async fn cancel_order(_auth: AdminAuth, State(pool): State<PgPool>, Path(invoice): Path<String>) -> impl IntoResponse {
    let order_res = sqlx::query_as::<_, crate::models::Order>("SELECT * FROM orders WHERE invoice = $1 LIMIT 1").bind(&invoice).fetch_optional(&pool).await;
    let order = match order_res {
        Ok(Some(o)) => o,
        _ => return (StatusCode::NOT_FOUND, Json(ApiResponse::<()> { ok: false, data: None, message: Some("Pesanan tidak ditemukan".to_string()) })).into_response()
    };
    if order.payment_status == "paid" {
        return (StatusCode::BAD_REQUEST, Json(ApiResponse::<()> { ok: false, data: None, message: Some("Pesanan sudah dibayar".to_string()) })).into_response();
    }
    let _ = sqlx::query("UPDATE orders SET payment_status = 'canceled', order_status = 'canceled' WHERE invoice = $1").bind(&invoice).execute(&pool).await;
    Json(ApiResponse::<()> { ok: true, data: None, message: Some("Pesanan dibatalkan".to_string()) }).into_response()
}
