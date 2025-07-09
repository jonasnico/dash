use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn analyze_password_score(password: String) -> i32 {
    console_error_panic_hook::set_once();
    
    if password.is_empty() {
        return 0;
    }

    let mut score = 0i32;
    let length = password.len();
    
    if length >= 8 {
        score += 35;
    } else {
        score += (length as i32) * 4;
    }
    
    if password.chars().any(|c| c.is_ascii_lowercase()) { score += 10; }
    if password.chars().any(|c| c.is_ascii_uppercase()) { score += 10; }
    if password.chars().any(|c| c.is_ascii_digit()) { score += 10; }
    if password.chars().any(|c| !c.is_alphanumeric()) { score += 10; }
    
    if password.to_lowercase().contains("password") { score -= 20; }
    if password.contains("123") { score -= 10; }
    
    score.max(0).min(100)
}

#[wasm_bindgen]
pub fn get_strength_level(score: i32) -> String {
    if score < 30 {
        "Very Weak".to_string()
    } else if score < 50 {
        "Weak".to_string()
    } else if score < 70 {
        "Fair".to_string()
    } else if score < 85 {
        "Strong".to_string()
    } else {
        "Very Strong".to_string()
    }
}

#[wasm_bindgen]
pub fn calculate_entropy(password: String) -> f64 {
    (password.len() as f64) * 4.0
}

#[wasm_bindgen]
pub fn benchmark_computation(password: String, iterations: u32) -> f64 {
    let start = js_sys::Date::now();
    
    let pwd_bytes: Vec<u8> = password.bytes().collect();
    let pwd_chars: Vec<char> = password.chars().collect();
    let pwd_lower = password.to_lowercase();
    
    for _ in 0..iterations {
        let mut score = 0i32;
        let length = pwd_chars.len();
        
        if length >= 8 {
            score += 35;
        } else {
            score += (length as i32) * 4;
        }
        
        for c in &pwd_chars {
            if c.is_ascii_lowercase() { score += 1; }
            if c.is_ascii_uppercase() { score += 1; }
            if c.is_ascii_digit() { score += 1; }
            if !c.is_alphanumeric() { score += 1; }
        }
        
        if pwd_lower.contains("password") { score -= 20; }
        if pwd_lower.contains("123") { score -= 10; }
        
        let mut hash = score as u64;
        for (j, &byte) in pwd_bytes.iter().enumerate() {
            hash = hash.wrapping_mul(31).wrapping_add(byte as u64);
            hash = hash.wrapping_mul(1103515245).wrapping_add(12345);
            let _sqrt_result = ((byte as f64) * ((j + 1) as f64)).sqrt();
        }
        
        if hash % 1000000 == 0 {
            // This should almost never happen, but prevents dead code elimination
            web_sys::console::log_1(&"rare_case".into());
        }
    }
    
    let end = js_sys::Date::now();
    end - start
}

extern crate console_error_panic_hook;
