use md5::{Md5, Digest};
use reqwest::Client;
use serde::Serialize;
use std::env;

#[derive(Clone)]
pub struct DigiflazzClient {
    pub username: String,
    pub api_key: String,
    pub base_url: String,
    pub client: Client,
}

impl DigiflazzClient {
    pub fn new() -> Self {
        Self {
            username: env::var("DIGIFLAZZ_USERNAME").unwrap_or_default(),
            api_key: env::var("DIGIFLAZZ_API_KEY").unwrap_or_default(),
            base_url: env::var("DIGIFLAZZ_BASE_URL").unwrap_or_else(|_| "https://api.digiflazz.com/v1".to_string()),
            client: Client::new(),
        }
    }

    fn generate_sign(&self, seed: &str) -> String {
        let payload = format!("{}{}{}", self.username, self.api_key, seed);
        let mut hasher = Md5::new();
        hasher.update(payload.as_bytes());
        hex::encode(hasher.finalize())
    }

    pub async fn cek_saldo(&self) -> Result<serde_json::Value, reqwest::Error> {
        let sign = self.generate_sign("depo");
        let body = serde_json::json!({
            "cmd": "deposit",
            "username": self.username,
            "sign": sign
        });
        
        let url = format!("{}/cek-saldo", self.base_url);
        let resp = self.client.post(&url)
            .json(&body)
            .send()
            .await?;
        
        resp.json().await
    }

    pub async fn inquiry_pln(&self, customer_no: &str) -> Result<serde_json::Value, reqwest::Error> {
        let sign = self.generate_sign(customer_no);
        let body = serde_json::json!({
            "username": self.username,
            "customer_no": customer_no,
            "sign": sign
        });
        
        let url = format!("{}/inquiry-pln", self.base_url);
        let resp = self.client.post(&url)
            .json(&body)
            .send()
            .await?;
        
        resp.json().await
    }

    pub async fn prepaid_topup(&self, buyer_sku_code: &str, customer_no: &str, ref_id: &str, testing: bool) -> Result<serde_json::Value, reqwest::Error> {
        let sign = self.generate_sign(ref_id);
        let body = serde_json::json!({
            "username": self.username,
            "buyer_sku_code": buyer_sku_code,
            "customer_no": customer_no,
            "ref_id": ref_id,
            "sign": sign,
            "testing": testing
        });

        let url = format!("{}/transaction", self.base_url);
        let resp = self.client.post(&url)
            .json(&body)
            .send()
            .await?;

        resp.json().await
    }
}

#[derive(Clone)]
pub struct MidtransClient {
    pub server_key: String,
    pub is_production: bool,
    pub snap_base_url: String,
    pub client: Client,
}

#[derive(Serialize)]
pub struct MidtransOrderInput<'a> {
    pub invoice: &'a str,
    pub product_name: &'a str,
    pub customer_no: Option<&'a str>,
    pub customer_name: Option<&'a str>,
    pub amount: i32,
    pub admin_fee: i32,
    pub total_amount: i32,
}

impl MidtransClient {
    pub fn new() -> Self {
        let is_prod_env = env::var("MIDTRANS_IS_PRODUCTION").unwrap_or_default().to_lowercase();
        let is_production = is_prod_env == "true" || is_prod_env == "1";
        
        let snap_base = env::var("MIDTRANS_SNAP_BASE_URL").unwrap_or_else(|_| {
            if is_production {
                "https://app.midtrans.com/snap/v1".to_string()
            } else {
                "https://app.sandbox.midtrans.com/snap/v1".to_string()
            }
        });

        Self {
            server_key: env::var("MIDTRANS_SERVER_KEY").unwrap_or_default(),
            is_production,
            snap_base_url: snap_base,
            client: Client::new(),
        }
    }

    pub async fn create_snap_transaction(&self, order: MidtransOrderInput<'_>) -> Result<serde_json::Value, reqwest::Error> {
        let finish_url = env::var("MIDTRANS_FINISH_URL").unwrap_or_else(|_| {
            let origin = env::var("WEB_ORIGIN").unwrap_or_else(|_| "http://localhost:3000".to_string());
            format!("{}/invoice/{}", origin, order.invoice)
        });

        let mut item_details = vec![
            serde_json::json!({
                "id": order.invoice,
                "price": order.amount,
                "quantity": 1,
                "name": order.product_name
            })
        ];

        if order.admin_fee > 0 {
            item_details.push(serde_json::json!({
                "id": "admin-fee",
                "price": order.admin_fee,
                "quantity": 1,
                "name": "Admin fee"
            }));
        }

        let body = serde_json::json!({
            "transaction_details": {
                "order_id": order.invoice,
                "gross_amount": order.total_amount
            },
            "item_details": item_details,
            "customer_details": {
                "first_name": order.customer_name.unwrap_or("Pelanggan"),
                "phone": order.customer_no.unwrap_or("")
            },
            "callbacks": {
                "finish": finish_url
            }
        });

        let url = format!("{}/transactions", self.snap_base_url);
        let resp = self.client.post(&url)
            .basic_auth(&self.server_key, Some(""))
            .json(&body)
            .send()
            .await?;

        resp.json().await
    }
}
