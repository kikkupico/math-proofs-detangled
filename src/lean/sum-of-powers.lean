import Mathlib

/-! 2⁰ + 2¹ + ⋯ + 2ⁿ = 2ⁿ⁺¹ − 1, written with "+ 1" on the left
to avoid subtraction on natural numbers. -/

example (n : ℕ) : (∑ i ∈ Finset.range (n + 1), 2 ^ i) + 1 = 2 ^ (n + 1) := by
  induction n with
  | zero => simp            -- Base case: 2⁰ + 1 = 2¹.
  | succ k ih =>            -- Induction step: assume it for k.
    -- Split off the last term, then use the inductive hypothesis.
    rw [Finset.sum_range_succ, add_right_comm, ih]
    ring                    -- 2ᵏ⁺¹ + 2ᵏ⁺¹ = 2ᵏ⁺²
