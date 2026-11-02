import Mathlib

/-! lim_{x → 3} (2x + 1) = 7, written out as ε–δ. -/

example : ∀ ε > 0, ∃ δ > 0, ∀ x : ℝ,
    0 < |x - 3| ∧ |x - 3| < δ → |(2 * x + 1) - 7| < ε := by
  intro ε hε                         -- Let ε > 0 be arbitrary.
  refine ⟨ε / 2, half_pos hε, ?_⟩    -- Let δ = ε/2, which is positive.
  rintro x ⟨-, hx⟩                   -- Let x be within δ of 3.
  have h : (2 * x + 1) - 7 = 2 * (x - 3) := by ring
  rw [h, abs_mul, abs_two]           -- |(2x + 1) − 7| = 2|x − 3|
  linarith                           -- < 2δ = ε
