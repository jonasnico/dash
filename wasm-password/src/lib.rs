use wasm_bindgen::prelude::*;

#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = performance)]
    fn now() -> f64;
}

fn charset_size(password: &str) -> f64 {
    let has_lower = password.chars().any(|c| c.is_ascii_lowercase());
    let has_upper = password.chars().any(|c| c.is_ascii_uppercase());
    let has_digit = password.chars().any(|c| c.is_ascii_digit());
    let has_symbol = password.chars().any(|c| !c.is_alphanumeric());

    let mut size = 0.0f64;
    if has_lower { size += 26.0; }
    if has_upper { size += 26.0; }
    if has_digit { size += 10.0; }
    if has_symbol { size += 32.0; }
    size
}

fn has_repeated_chars(password: &str) -> bool {
    let chars: Vec<char> = password.chars().collect();
    chars.windows(3).any(|w| w[0] == w[1] && w[1] == w[2])
}

fn has_keyboard_pattern(lower: &str) -> bool {
    let patterns = ["qwerty", "asdfgh", "zxcvbn", "123456", "654321", "abcdef"];
    patterns.iter().any(|p| lower.contains(p))
}

fn compute_score(password: &str) -> i32 {
    if password.is_empty() {
        return 0;
    }

    let lower = password.to_lowercase();
    let length = password.chars().count();
    let cs = charset_size(password);

    let entropy = if cs > 0.0 {
        (length as f64) * cs.log2()
    } else {
        0.0
    };

    let entropy_score = (entropy * 0.8).min(80.0) as i32;

    let has_lower = password.chars().any(|c| c.is_ascii_lowercase());
    let has_upper = password.chars().any(|c| c.is_ascii_uppercase());
    let has_digit = password.chars().any(|c| c.is_ascii_digit());
    let has_symbol = password.chars().any(|c| !c.is_alphanumeric());

    let variety_count = [has_lower, has_upper, has_digit, has_symbol]
        .iter()
        .filter(|&&v| v)
        .count() as i32;
    let variety_bonus = variety_count * 5;

    let mut penalties = 0i32;
    if lower.contains("password") { penalties += 20; }
    if password.contains("123") || password.contains("1234") { penalties += 10; }
    if has_keyboard_pattern(&lower) { penalties += 10; }
    if has_repeated_chars(password) { penalties += 10; }

    (entropy_score + variety_bonus - penalties).max(0).min(100)
}

#[wasm_bindgen]
pub fn analyze_password_score(password: String) -> i32 {
    console_error_panic_hook::set_once();
    compute_score(&password)
}

#[wasm_bindgen]
pub fn get_strength_level(score: i32) -> String {
    match score {
        0..=29 => "Very Weak".to_string(),
        30..=49 => "Weak".to_string(),
        50..=69 => "Fair".to_string(),
        70..=84 => "Strong".to_string(),
        _ => "Very Strong".to_string(),
    }
}

#[wasm_bindgen]
pub fn calculate_entropy(password: String) -> f64 {
    let cs = charset_size(&password);
    if cs == 0.0 {
        return 0.0;
    }
    (password.chars().count() as f64) * cs.log2()
}

#[wasm_bindgen]
pub fn get_time_to_crack(password: String) -> String {
    let cs = charset_size(&password);
    if cs == 0.0 {
        return "Instantly".to_string();
    }
    let length = password.chars().count() as u32;
    let guesses_per_second = 1_000_000_000.0f64;
    let combinations = cs.powi(length as i32);
    let seconds = combinations / (2.0 * guesses_per_second);

    if seconds < 1.0 {
        "Instantly".to_string()
    } else if seconds < 60.0 {
        format!("{:.1} seconds", seconds)
    } else if seconds < 3600.0 {
        format!("{:.1} minutes", seconds / 60.0)
    } else if seconds < 86400.0 {
        format!("{:.1} hours", seconds / 3600.0)
    } else if seconds < 31_536_000.0 {
        format!("{:.1} days", seconds / 86400.0)
    } else if seconds < 31_536_000.0 * 1000.0 {
        format!("{:.1} years", seconds / 31_536_000.0)
    } else {
        "Centuries".to_string()
    }
}

#[wasm_bindgen]
pub fn get_feedback(password: String) -> String {
    if password.is_empty() {
        return "Enter a password to analyze".to_string();
    }

    let lower = password.to_lowercase();
    let length = password.chars().count();
    let has_lower = password.chars().any(|c| c.is_ascii_lowercase());
    let has_upper = password.chars().any(|c| c.is_ascii_uppercase());
    let has_digit = password.chars().any(|c| c.is_ascii_digit());
    let has_symbol = password.chars().any(|c| !c.is_alphanumeric());

    let mut parts: Vec<&str> = Vec::new();

    if lower.contains("password") { parts.push("Avoid the word 'password'"); }
    if password.contains("123") { parts.push("Avoid sequential numbers"); }
    if has_keyboard_pattern(&lower) { parts.push("Avoid keyboard patterns (qwerty, asdf)"); }
    if has_repeated_chars(&password) { parts.push("Avoid repeating characters"); }
    if length < 8 { parts.push("Use at least 8 characters"); }
    if !has_lower { parts.push("Add lowercase letters"); }
    if !has_upper { parts.push("Add uppercase letters"); }
    if !has_digit { parts.push("Add numbers"); }
    if !has_symbol { parts.push("Add special characters"); }

    if parts.is_empty() {
        if compute_score(&password) >= 85 {
            "Excellent password!".to_string()
        } else {
            "Good password — consider making it longer for extra security".to_string()
        }
    } else {
        parts.join(". ")
    }
}

#[wasm_bindgen]
pub fn benchmark_computation(password: String, iterations: u32) -> f64 {
    let start = now();
    for _ in 0..iterations {
        compute_score(&password);
    }
    now() - start
}

extern crate console_error_panic_hook;

