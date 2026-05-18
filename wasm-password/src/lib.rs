use wasm_bindgen::prelude::*;

#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = performance)]
    fn now() -> f64;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

fn has_repeated_chars(password: &str) -> bool {
    let mut prev2: char = '\0';
    let mut prev1: char = '\0';
    for c in password.chars() {
        if c == prev1 && c == prev2 { return true; }
        prev2 = prev1;
        prev1 = c;
    }
    false
}

fn has_keyboard_pattern(lower: &str) -> bool {
    ["qwerty", "asdfgh", "zxcvbn", "123456", "654321", "abcdef"]
        .iter()
        .any(|p| lower.contains(p))
}

// ── Single-pass full analysis (used by both benchmark and exported API) ───────

struct Analysis {
    score: i32,
    entropy: f64,
    time_to_crack: String,
    feedback: String,
}

fn analyze_once(password: &str) -> Analysis {
    if password.is_empty() {
        return Analysis {
            score: 0,
            entropy: 0.0,
            time_to_crack: "Instantly".to_string(),
            feedback: "Enter a password to analyze".to_string(),
        };
    }

    let lower = password.to_lowercase();
    let length = password.chars().count();

    // ── Single pass: charset flags ──
    let has_lower  = password.chars().any(|c| c.is_ascii_lowercase());
    let has_upper  = password.chars().any(|c| c.is_ascii_uppercase());
    let has_digit  = password.chars().any(|c| c.is_ascii_digit());
    let has_symbol = password.chars().any(|c| !c.is_alphanumeric());
    let cs = (if has_lower { 26.0_f64 } else { 0.0 })
           + (if has_upper { 26.0 } else { 0.0 })
           + (if has_digit { 10.0 } else { 0.0 })
           + (if has_symbol { 32.0 } else { 0.0 });

    // ── Pattern flags (computed once, reused everywhere) ──
    let has_repeat   = has_repeated_chars(password);
    let has_keyboard = has_keyboard_pattern(&lower);
    let has_pwd_word = lower.contains("password");
    let has_123      = password.contains("123") || password.contains("1234");

    // ── Score ──
    let entropy = if cs > 0.0 { (length as f64) * cs.log2() } else { 0.0 };
    let entropy_score = (entropy * 0.8).min(80.0) as i32;
    let variety_bonus = [has_lower, has_upper, has_digit, has_symbol]
        .iter().filter(|&&v| v).count() as i32 * 5;
    let mut penalties = 0i32;
    if has_pwd_word  { penalties += 20; }
    if has_123       { penalties += 10; }
    if has_keyboard  { penalties += 10; }
    if has_repeat    { penalties += 10; }
    let score = (entropy_score + variety_bonus - penalties).max(0).min(100);

    // ── Strength level (computed for score only, not stored in Analysis) ──
    // Equivalent to JS strengthLevel(score) — trivial branch, no allocation.
    let _strength = match score {
        0..=29 => "Very Weak", 30..=49 => "Weak",
        50..=69 => "Fair",     70..=84 => "Strong",
        _ => "Very Strong",
    };

    // ── Time to crack (reuse cs and length) ──
    let time_to_crack = if cs == 0.0 {
        "Instantly".to_string()
    } else {
        let seconds = cs.powi(length as i32) / (2.0 * 1_000_000_000.0);
        if seconds < 1.0                   { "Instantly".to_string() }
        else if seconds < 60.0             { format!("{:.1} seconds", seconds) }
        else if seconds < 3_600.0          { format!("{:.1} minutes", seconds / 60.0) }
        else if seconds < 86_400.0         { format!("{:.1} hours", seconds / 3_600.0) }
        else if seconds < 31_536_000.0     { format!("{:.1} days", seconds / 86_400.0) }
        else if seconds < 31_536_000_000.0 { format!("{:.1} years", seconds / 31_536_000.0) }
        else                               { "Centuries".to_string() }
    };

    // ── Feedback (reuse all flags — no re-computation) ──
    let mut parts: Vec<&str> = Vec::new();
    if has_pwd_word  { parts.push("Avoid the word 'password'"); }
    if has_123       { parts.push("Avoid sequential numbers"); }
    if has_keyboard  { parts.push("Avoid keyboard patterns (qwerty, asdf)"); }
    if has_repeat    { parts.push("Avoid repeating characters"); }
    if length < 8    { parts.push("Use at least 8 characters"); }
    if !has_lower    { parts.push("Add lowercase letters"); }
    if !has_upper    { parts.push("Add uppercase letters"); }
    if !has_digit    { parts.push("Add numbers"); }
    if !has_symbol   { parts.push("Add special characters"); }
    let feedback = if parts.is_empty() {
        if score >= 85 { "Excellent password!".to_string() }
        else { "Good password — consider making it longer for extra security".to_string() }
    } else {
        parts.join(". ")
    };

    Analysis { score, entropy, time_to_crack, feedback }
}

// ── WASM-exported API ─────────────────────────────────────────────────────────

#[wasm_bindgen]
pub fn analyze_password_score(password: String) -> i32 {
    console_error_panic_hook::set_once();
    analyze_once(&password).score
}

#[wasm_bindgen]
pub fn get_strength_level(score: i32) -> String {
    match score {
        0..=29 => "Very Weak",
        30..=49 => "Weak",
        50..=69 => "Fair",
        70..=84 => "Strong",
        _ => "Very Strong",
    }.to_string()
}

#[wasm_bindgen]
pub fn calculate_entropy(password: String) -> f64 {
    analyze_once(&password).entropy
}

#[wasm_bindgen]
pub fn get_time_to_crack(password: String) -> String {
    analyze_once(&password).time_to_crack
}

#[wasm_bindgen]
pub fn get_feedback(password: String) -> String {
    analyze_once(&password).feedback
}

/// Benchmarks the full analysis pipeline in a single pass per iteration —
/// equivalent algorithmic work to `analyzePasswordJS` on the JS side.
/// Timed inside WASM to exclude JS↔WASM boundary overhead.
#[wasm_bindgen]
pub fn benchmark_full_analysis(password: String, iterations: u32) -> f64 {
    let start = now();
    for _ in 0..iterations {
        let _ = analyze_once(&password);
    }
    now() - start
}

extern crate console_error_panic_hook;

