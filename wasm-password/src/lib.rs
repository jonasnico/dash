use wasm_bindgen::prelude::*;

// Simple functions without complex structs
#[wasm_bindgen]
pub fn analyze_password_score(password: String) -> i32 {
    console_error_panic_hook::set_once();
    
    if password.is_empty() {
        return 0;
    }

    let mut score = 0i32;
    let length = password.len();
    
    // Length scoring
    if length >= 8 {
        score += 35;
    } else {
        score += (length as i32) * 4;
    }
    
    // Character variety
    if password.chars().any(|c| c.is_ascii_lowercase()) { score += 10; }
    if password.chars().any(|c| c.is_ascii_uppercase()) { score += 10; }
    if password.chars().any(|c| c.is_ascii_digit()) { score += 10; }
    if password.chars().any(|c| !c.is_alphanumeric()) { score += 10; }
    
    // Simple penalties
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
    
    // Perform actual password analysis work for benchmarking
    for _ in 0..iterations {
        let mut score = 0i32;
        let length = password.len();
        
        // Length scoring (computational work)
        if length >= 8 {
            score += 35;
        } else {
            score += (length as i32) * 4;
        }
        
        // Character checks (iterate through password)
        for c in password.chars() {
            if c.is_ascii_lowercase() { score += 1; }
            if c.is_ascii_uppercase() { score += 1; }
            if c.is_ascii_digit() { score += 1; }
            if !c.is_alphanumeric() { score += 1; }
        }
        
        // Pattern checking
        let lower = password.to_lowercase();
        if lower.contains("password") { score -= 20; }
        if lower.contains("123") { score -= 10; }
        
        // Additional computation to ensure measurable work
        let mut hash = score as u64;
        for byte in password.bytes() {
            hash = hash.wrapping_mul(31).wrapping_add(byte as u64);
            hash = hash.wrapping_mul(1103515245).wrapping_add(12345);
        }
        
        // Prevent optimization by using the result
        if hash == 0 {
            web_sys::console::log_1(&"unlikely".into());
        }
    }
    
    let end = js_sys::Date::now();
    end - start
}

extern crate console_error_panic_hook;
