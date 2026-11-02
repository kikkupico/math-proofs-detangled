import Mathlib

/-! √2 is irrational, in integer form: if p/q is in lowest terms
(gcd p q = 1), then p² ≠ 2q². Mathlib also has this as `irrational_sqrt_two`. -/

example (p q : ℕ) (hpq : Nat.Coprime p q) : p ^ 2 ≠ 2 * q ^ 2 := by
  intro h                                 -- Suppose p² = 2q².
  -- p² is even, so p is even: p = 2k.
  have hp : 2 ∣ p := Nat.Prime.dvd_of_dvd_pow Nat.prime_two ⟨q ^ 2, h⟩
  obtain ⟨k, rfl⟩ := hp
  -- Then 4k² = 2q², so q² = 2k², and q is even too.
  have hq2 : q ^ 2 = 2 * k ^ 2 := by
    ring_nf at h ⊢
    linarith
  have hq : 2 ∣ q := Nat.Prime.dvd_of_dvd_pow Nat.prime_two ⟨k ^ 2, hq2⟩
  -- 2 divides both, so it divides gcd(2k, q) = 1. Contradiction.
  have h2 : 2 ∣ Nat.gcd (2 * k) q := Nat.dvd_gcd (dvd_mul_right 2 k) hq
  rw [Nat.Coprime.gcd_eq_one hpq] at h2
  omega
