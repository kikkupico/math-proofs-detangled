import Mathlib

/-! If n = a·b with a, b > 1 (so n is not prime), then 2ⁿ − 1 is not prime.
The "not prime" given is already unpacked into a and b here. -/

example (a b : ℕ) (ha : 1 < a) (hb : 1 < b) : ¬ Nat.Prime (2 ^ (a * b) - 1) := by
  -- The witness x = 2ᵇ − 1 divides 2^(ab) − 1 = (2ᵇ)ᵃ − 1ᵃ.
  have hx : 2 ^ b - 1 ∣ 2 ^ (a * b) - 1 := by
    have h := nat_sub_dvd_pow_sub_pow (2 ^ b) 1 a
    rw [one_pow, ← pow_mul, mul_comm b a] at h
    exact h
  -- Sizes: 4 ≤ 2ᵇ, and 2ᵇ < 2^(ab) because b < ab.
  have h4 : 4 ≤ 2 ^ b := by
    calc 4 = 2 ^ 2 := by norm_num
      _ ≤ 2 ^ b := Nat.pow_le_pow_right (by norm_num) (by omega)
  have hlt : 2 ^ b < 2 ^ (a * b) :=
    Nat.pow_lt_pow_right (by norm_num) (by nlinarith)
  -- So 1 < x < 2ⁿ − 1: a factor other than 1 and itself.
  exact Nat.not_prime_of_dvd_of_lt hx (by omega) (by omega)
