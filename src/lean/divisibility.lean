import Mathlib

/-! Divisibility is transitive.
In Mathlib, `a ∣ b` means `∃ k, b = a * k`. -/

example : ∀ a b c : ℤ, a ∣ b → b ∣ c → a ∣ c := by
  intro a b c          -- Let a, b, c be arbitrary integers.
  intro h1 h2          -- Suppose a ∣ b and b ∣ c.
  obtain ⟨d, hd⟩ := h1 -- Name the multiplier: b = a * d.
  obtain ⟨e, he⟩ := h2 -- Name the other one:  c = b * e.
  use d * e            -- Witness: c = a * (d * e).
  rw [he, hd]          -- Substitute for c, then for b.
  ring                 -- The algebra closes the goal.
