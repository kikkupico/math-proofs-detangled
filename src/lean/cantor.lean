import Mathlib

/-! Cantor's theorem: no function from A onto 𝒫(A).
Mathlib also has this as `Function.cantor_surjective`. -/

example {α : Type*} (f : α → Set α) : ¬ Function.Surjective f := by
  intro hf                              -- Suppose f is onto.
  -- The diagonal set D = {x | x ∉ f x} is hit by some a.
  obtain ⟨a, ha⟩ := hf {x | x ∉ f x}
  -- Is a in D?
  by_cases h : a ∈ f a
  · have h2 := h
    rw [ha] at h2                       -- a ∈ D, so a ∉ f a
    simp only [Set.mem_setOf_eq] at h2
    exact h2 h
  · apply h
    rw [ha]                             -- a ∉ f a, so a ∈ D = f a
    exact h
