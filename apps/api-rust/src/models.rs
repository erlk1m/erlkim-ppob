use chrono::NaiveDateTime;
use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Serialize, Deserialize, FromRow)]
#[serde(rename_all = "camelCase")]
pub struct Category {
    pub id: String,
    pub name: String,
    pub slug: String,
    pub description: Option<String>,
    pub icon: Option<String>,
    pub r#type: String, // 'type' is a keyword in Rust
    pub is_active: Option<bool>,
    pub auto_margin_type: Option<String>,
    pub auto_margin_value: Option<i32>,
    pub created_at: Option<NaiveDateTime>,
    pub updated_at: Option<NaiveDateTime>,
}

#[derive(Debug, Serialize, Deserialize, FromRow)]
#[serde(rename_all = "camelCase")]
pub struct Product {
    pub id: String,
    pub provider: String,
    pub provider_product_id: Option<String>,
    pub category_id: Option<String>,
    #[sqlx(default)]
    pub category_slug: Option<String>,
    pub r#type: String,
    pub brand: String,
    pub name: String,
    pub buyer_sku_code: String,
    pub description: Option<String>,
    pub provider_price: i32,
    pub selling_price: i32,
    pub margin: i32,
    pub is_manual_margin: Option<bool>,
    pub buyer_product_status: Option<bool>,
    pub seller_product_status: Option<bool>,
    pub is_active: Option<bool>,
    pub is_popular: Option<bool>,
    pub is_flashsale: Option<bool>,
    pub created_at: Option<NaiveDateTime>,
    pub updated_at: Option<NaiveDateTime>,
}

#[derive(Debug, Serialize, Deserialize, FromRow)]
#[serde(rename_all = "camelCase")]
pub struct PaymentMethod {
    pub id: String,
    pub provider: String,
    pub name: String,
    pub merchant_name: Option<String>,
    pub admin_fee: Option<i32>,
    pub qris_image_url: Option<String>,
    pub qris_payload: Option<String>,
    pub is_enabled: Option<bool>,
    pub created_at: Option<NaiveDateTime>,
    pub updated_at: Option<NaiveDateTime>,
}

#[derive(Debug, Serialize, Deserialize, FromRow)]
#[serde(rename_all = "camelCase")]
pub struct SiteSetting {
    pub id: String,
    pub brand_name: String,
    pub logo_url: Option<String>,
    pub hero_title: String,
    pub hero_subtitle: String,
    pub running_text: Option<String>,
    pub footer_text: Option<String>,
    pub whatsapp_number: Option<String>,
    pub seo_title: Option<String>,
    pub seo_description: Option<String>,
    pub maintenance_mode: Option<bool>,
    pub maintenance_title: Option<String>,
    pub maintenance_message: Option<String>,
    pub maintenance_eta: Option<String>,
    pub maintenance_whatsapp: Option<String>,
    pub environment_badge_enabled: Option<bool>,
    pub environment_badge_text: Option<String>,
    pub environment_badge_description: Option<String>,
    pub environment_badge_variant: Option<String>,
    pub environment_badge_show_on_invoice: Option<bool>,
    pub global_auto_margin_type: Option<String>,
    pub global_auto_margin_value: Option<i32>,
    pub created_at: Option<NaiveDateTime>,
    pub updated_at: Option<NaiveDateTime>,
}

#[derive(Debug, Serialize, Deserialize, FromRow)]
#[serde(rename_all = "camelCase")]
pub struct Order {
    pub id: String,
    pub invoice: String,
    pub ref_id: String,
    pub r#type: String,
    pub product_id: Option<String>,
    pub payment_method_id: String,
    pub buyer_sku_code: String,
    pub customer_no: String,
    pub customer_no_masked: String,
    pub amount: i32,
    pub admin_fee: Option<i32>,
    pub total_amount: i32,
    pub payment_method: String,
    pub payment_status: String,
    pub order_status: String,
    pub provider_status: Option<String>,
    pub provider_rc: Option<String>,
    pub provider_message: Option<String>,
    pub sn: Option<String>,
    pub raw_provider_response: Option<serde_json::Value>,
    pub created_at: Option<NaiveDateTime>,
    pub paid_at: Option<NaiveDateTime>,
    pub completed_at: Option<NaiveDateTime>,
    pub updated_at: Option<NaiveDateTime>,
}

#[derive(Debug, Serialize, Deserialize, FromRow)]
#[serde(rename_all = "camelCase")]
pub struct PaymentLog {
    pub id: String,
    pub r#type: String,
    pub payload: Option<serde_json::Value>,
    pub created_at: Option<NaiveDateTime>,
}

#[derive(Debug, Serialize, Deserialize, FromRow)]
#[serde(rename_all = "camelCase")]
pub struct ProviderLog {
    pub id: String,
    pub direction: String,
    pub action: String,
    pub payload: Option<serde_json::Value>,
    pub created_at: Option<NaiveDateTime>,
}

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
#[serde(rename_all = "camelCase")]
pub struct ThemeSetting {
    pub id: String,
    pub primary_color: String,
    pub accent_color: String,
    pub background_color: String,
    pub surface_color: String,
    pub text_color: String,
    pub border_radius: String,
    pub shadow_style: String,
    pub font_heading: String,
    pub font_body: String,
    pub created_at: Option<chrono::NaiveDateTime>,
    pub updated_at: Option<chrono::NaiveDateTime>,
}
