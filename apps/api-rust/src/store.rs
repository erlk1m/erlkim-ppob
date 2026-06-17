use crate::models::{Category, Product};
use std::collections::{HashMap, HashSet};

const STOREFRONT_CATEGORY_ORDER: [&str; 13] = [
    "pulsa", "paket-data", "token-pln", "emoney", "game", "paket-sms-telpon", "masa-aktif",
    "aktivasi-perdana", "aktivasi-voucher", "esim", "streaming", "tv", "tagihan",
];

const STOREFRONT_BRAND_ORDER: [&str; 20] = [
    "TELKOMSEL", "INDOSAT", "XL", "AXIS", "TRI", "SMARTFREN", "BY.U",
    "PLN", "DANA", "OVO", "GO PAY", "SHOPEE PAY", "LINKAJA", "DOKU", "I.SAKU",
    "FREE FIRE", "MOBILE LEGENDS", "GOOGLE PLAY", "PLAYSTATION", "LAINNYA"
];

const STOREFRONT_HIDDEN_TERMS: [&str; 13] = [
    "K VISION", "K-VISION", "NEX PARABOLA", "ESIM", "TRAVEL", "VIDIO", "PERTAMINA GAS", "PERTAGAS",
    "STARHUB", "VIETNAM TOPUP", "TRUEMOVE", "SMART COMMUNICATIONS", "HOTEL"
];

const PULSA_HIDDEN_TERMS: [&str; 8] = ["DATA", "VOUCHER", "AKTIVASI", "PERDANA", "MASA AKTIF", "TELEPON", "SMS", "PAKET"];
const DATA_HIDDEN_TERMS: [&str; 5] = ["AKTIVASI", "PERDANA", "VOUCHER", "ESIM", "TRAVEL"];

pub fn is_storefront_audience(audience: Option<&String>) -> bool {
    matches!(audience.map(|s| s.as_str()), Some("storefront") | Some("true"))
}

pub fn normalize_catalog_text(text: &str) -> String {
    let mut result = String::with_capacity(text.len());
    for c in text.to_uppercase().chars() {
        if c.is_ascii_alphanumeric() || c == '.' {
            result.push(c);
        } else {
            result.push(' ');
        }
    }
    result.split_whitespace().collect::<Vec<&str>>().join(" ")
}

pub fn normalize_storefront_brand(product: &Product) -> String {
    let combined = format!("{} {} {}", product.brand, product.name, product.buyer_sku_code);
    let text = normalize_catalog_text(&combined);
    
    if text.contains("TELKOMSEL") { return "TELKOMSEL".to_string(); }
    if text.contains("INDOSAT") { return "INDOSAT".to_string(); }
    if text.contains("SMARTFREN") { return "SMARTFREN".to_string(); }
    if text.contains("AXIS") { return "AXIS".to_string(); }
    if text.contains("BY.U") || text.contains("BY U") { return "BY.U".to_string(); }
    if text.contains("TRI") || text.contains("THREE") { return "TRI".to_string(); }
    if text.contains("XL") { return "XL".to_string(); }
    if text.contains("PLN") { return "PLN".to_string(); }
    if text.contains("SHOPEE PAY") || text.contains("SHOPEEPAY") { return "SHOPEE PAY".to_string(); }
    if text.contains("GO PAY") || text.contains("GOPAY") { return "GO PAY".to_string(); }
    if text.contains("LINKAJA") || text.contains("LINK AJA") { return "LINKAJA".to_string(); }
    if text.contains("I.SAKU") || text.contains("I SAKU") { return "I.SAKU".to_string(); }
    if text.contains("DANA") { return "DANA".to_string(); }
    if text.contains("OVO") { return "OVO".to_string(); }
    if text.contains("DOKU") { return "DOKU".to_string(); }
    if text.contains("FREE FIRE") { return "FREE FIRE".to_string(); }
    if text.contains("MOBILE LEGEND") { return "MOBILE LEGENDS".to_string(); }
    if text.contains("GOOGLE PLAY") { return "GOOGLE PLAY".to_string(); }
    if text.contains("PLAYSTATION") { return "PLAYSTATION".to_string(); }
    
    let brand = normalize_catalog_text(&product.brand);
    if brand.is_empty() { "LAINNYA".to_string() } else { brand }
}

fn has_hidden_term(text: &str, terms: &[&str]) -> bool {
    terms.iter().any(|&term| text.contains(term))
}

fn brand_rank(product: &Product) -> usize {
    let brand = normalize_storefront_brand(product);
    STOREFRONT_BRAND_ORDER.iter().position(|&b| b == brand).unwrap_or(STOREFRONT_BRAND_ORDER.len())
}

fn extract_storefront_nominal(product: &Product) -> i32 {
    let _text = normalize_catalog_text(&product.name);
    // Simple naive nominal extractor (find first numeric sequence over 3 digits or matching logic)
    // We'll fall back to selling price which is usually good enough for ranking
    if let Some(price) = product.selling_price.into() {
        if price > 0 {
            return price;
        }
    }
    0
}

fn compact_product_name(product: &Product) -> String {
    let text = normalize_catalog_text(&product.name);
    let remove_words = ["REGULER", "NASIONAL", "MASUKKAN", "NOMOR", "METER", "ID", "PELANGGAN", "SEBAGAI", "NO", "HP", "JUMLAH", "DIAMOND", "DIAMONDS", "NORMAL", "BONUS", "TIDAK", "DIHITUNG"];
    let mut result = Vec::new();
    for word in text.split_whitespace() {
        if !remove_words.contains(&word) {
            result.push(word);
        }
    }
    result.join(" ")
}

fn storefront_dedupe_key(product: &Product) -> String {
    let category = product.category_slug.as_deref().unwrap_or("unknown");
    let brand = normalize_storefront_brand(product);
    let nominal = extract_storefront_nominal(product);
    
    let needs_nominal = ["pulsa", "token-pln", "emoney", "voucher-game", "game", "paket-sms-telpon", "masa-aktif", "aktivasi-perdana", "aktivasi-voucher", "esim", "streaming", "tv"].contains(&category);
    
    if needs_nominal {
        let n_str = if nominal > 0 { nominal.to_string() } else { compact_product_name(product) };
        format!("{}|{}|{}", category, brand, n_str)
    } else if category == "tagihan" {
        format!("{}|{}", category, normalize_catalog_text(&product.buyer_sku_code))
    } else {
        format!("{}|{}|{}", category, brand, compact_product_name(product))
    }
}

fn product_availability_score(product: &Product) -> i32 {
    let mut score = 0;
    if product.is_active.unwrap_or(false) { score += 10; }
    if product.buyer_product_status.unwrap_or(false) { score += 5; }
    if product.seller_product_status.unwrap_or(false) { score += 5; }
    if product.is_popular.unwrap_or(false) { score += 1; }
    if product.is_flashsale.unwrap_or(false) { score += 1; }
    score
}

fn choose_better_storefront_product(current: Product, candidate: Product) -> Product {
    let current_score = product_availability_score(&current);
    let candidate_score = product_availability_score(&candidate);
    
    if candidate_score != current_score {
        return if candidate_score > current_score { candidate } else { current };
    }
    
    if candidate.selling_price != current.selling_price {
        return if candidate.selling_price < current.selling_price { candidate } else { current };
    }
    
    if candidate.buyer_sku_code.len() < current.buyer_sku_code.len() {
        candidate
    } else {
        current
    }
}

pub fn is_storefront_product(product: &Product) -> bool {
    let category_slug = product.category_slug.as_deref().unwrap_or("");
    let allowed_extra = ["game", "paket-sms-telpon", "masa-aktif", "aktivasi-perdana", "aktivasi-voucher", "esim", "streaming", "tv"];
    
    if allowed_extra.contains(&category_slug) {
        return product.is_active.unwrap_or(false) && !product.buyer_sku_code.is_empty();
    }
    
    if !product.is_active.unwrap_or(false) {
        return false;
    }
    
    let combined = format!("{} {} {} {}", product.brand, product.name, product.buyer_sku_code, product.description.as_deref().unwrap_or(""));
    let text = normalize_catalog_text(&combined);
    
    if has_hidden_term(&text, &STOREFRONT_HIDDEN_TERMS) {
        return false;
    }
    
    if product.r#type == "postpaid" {
        let sku = normalize_catalog_text(&product.buyer_sku_code);
        return category_slug == "tagihan" && ["PLNPOSTPAID", "BPJSB", "PDAM", "PDAMPOSTPAID"].contains(&sku.as_str());
    }
    
    if product.r#type != "prepaid" {
        return false;
    }
    
    let brand = normalize_catalog_text(&product.brand);
    let name = normalize_catalog_text(&product.name);
    
    match category_slug {
        "pulsa" => {
            let ops = ["TELKOMSEL", "INDOSAT", "XL", "AXIS", "TRI", "THREE", "SMARTFREN", "BY.U", "BY U"];
            ops.iter().any(|&o| brand.contains(o)) && !has_hidden_term(&name, &PULSA_HIDDEN_TERMS)
        },
        "paket-data" => {
            let ops = ["TELKOMSEL", "INDOSAT", "XL", "AXIS", "TRI", "THREE", "SMARTFREN", "BY.U", "BY U"];
            ops.iter().any(|&o| brand.contains(o)) && !has_hidden_term(&name, &DATA_HIDDEN_TERMS)
        },
        "token-pln" => brand.contains("PLN") || name.starts_with("PLN "),
        "emoney" => {
            let em = ["DANA", "OVO", "GO PAY", "GOPAY", "SHOPEE PAY", "SHOPEEPAY", "LINKAJA", "DOKU", "I.SAKU", "I SAKU"];
            em.iter().any(|&o| brand.contains(o))
        },
        "voucher-game" | "game" | "paket-sms-telpon" | "masa-aktif" | "aktivasi-perdana" | "aktivasi-voucher" | "esim" | "streaming" | "tv" => true,
        _ => false,
    }
}

pub fn dedupe_and_sort_products(list: Vec<Product>) -> Vec<Product> {
    let mut by_key: HashMap<String, Product> = HashMap::new();
    
    for product in list {
        let key = storefront_dedupe_key(&product);
        if let Some(existing) = by_key.remove(&key) {
            by_key.insert(key, choose_better_storefront_product(existing, product));
        } else {
            by_key.insert(key, product);
        }
    }
    
    let mut result: Vec<Product> = by_key.into_values().collect();
    result.sort_by(|a, b| {
        let b_diff = brand_rank(a).cmp(&brand_rank(b));
        if b_diff != std::cmp::Ordering::Equal {
            return b_diff;
        }
        let n_diff = extract_storefront_nominal(a).cmp(&extract_storefront_nominal(b));
        if n_diff != std::cmp::Ordering::Equal {
            return n_diff;
        }
        a.name.cmp(&b.name)
    });
    
    result
}

// Minimal Category meta
fn get_meta_category(slug: &str) -> Option<Category> {
    let meta = match slug {
        "pulsa" => Some(("Pulsa", "Top up pulsa semua operator.", "📱", "prepaid")),
        "paket-data" => Some(("Paket Data", "Kuota internet harian dan bulanan.", "🌐", "prepaid")),
        "token-pln" => Some(("Token PLN", "Token listrik prabayar.", "⚡", "prepaid")),
        "emoney" => Some(("E-Money", "Top up dompet digital.", "💳", "prepaid")),
        "game" => Some(("Game", "Top up game dan voucher digital.", "🎮", "prepaid")),
        "paket-sms-telpon" => Some(("Paket SMS & Telpon", "Paket SMS dan telepon semua operator.", "☎️", "prepaid")),
        "masa-aktif" => Some(("Masa Aktif", "Tambah masa aktif kartu prabayar.", "⏳", "prepaid")),
        "aktivasi-perdana" => Some(("Aktivasi Perdana", "Paket aktivasi kartu perdana.", "🆕", "prepaid")),
        "aktivasi-voucher" => Some(("Aktivasi Voucher", "Aktivasi dan cek status voucher.", "🎟️", "prepaid")),
        "esim" => Some(("eSIM", "Produk dan paket eSIM.", "📶", "prepaid")),
        "streaming" => Some(("Streaming", "Voucher dan paket streaming.", "▶️", "prepaid")),
        "tv" => Some(("TV", "Voucher dan paket TV berlangganan.", "📺", "prepaid")),
        "tagihan" => Some(("Tagihan", "PLN, PDAM, BPJS, internet, pascabayar.", "🧾", "postpaid")),
        _ => None,
    };
    
    meta.map(|(name, desc, icon, t)| Category {
        id: format!("cat-{}", slug),
        name: name.to_string(),
        slug: slug.to_string(),
        description: Some(desc.to_string()),
        icon: Some(icon.to_string()),
        r#type: t.to_string(),
        is_active: Some(true),
        auto_margin_type: None,
        auto_margin_value: None,
        created_at: None,
        updated_at: None,
    })
}

pub fn build_storefront_categories(categories: Vec<Category>, products: &[Product]) -> Vec<Category> {
    let mut visible_slugs = HashSet::new();
    for p in products {
        if is_storefront_product(p) {
            if let Some(slug) = &p.category_slug {
                visible_slugs.insert(slug.clone());
            }
        }
    }
    
    let mut by_slug = HashMap::new();
    for cat in categories {
        if visible_slugs.contains(&cat.slug) {
            by_slug.insert(cat.slug.clone(), cat);
        }
    }
    
    for slug in STOREFRONT_CATEGORY_ORDER.iter() {
        if visible_slugs.contains(*slug) && !by_slug.contains_key(*slug) {
            if let Some(meta) = get_meta_category(slug) {
                by_slug.insert(slug.to_string(), meta);
            }
        }
    }
    
    let mut result: Vec<Category> = by_slug.into_values().collect();
    result.sort_by(|a, b| {
        let ai = STOREFRONT_CATEGORY_ORDER.iter().position(|&s| s == a.slug.trim()).unwrap_or(999);
        let bi = STOREFRONT_CATEGORY_ORDER.iter().position(|&s| s == b.slug.trim()).unwrap_or(999);
        if ai != bi {
            ai.cmp(&bi)
        } else {
            a.name.cmp(&b.name)
        }
    });
    println!("Sorted {} categories for storefront", result.len());
    for cat in &result {
        let idx = STOREFRONT_CATEGORY_ORDER.iter().position(|&s| s == cat.slug).unwrap_or(999);
        println!(" - slug: {}, idx: {}", cat.slug, idx);
    }
    
    result
}
