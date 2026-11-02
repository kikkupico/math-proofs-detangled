import Mathlib

/-! 𝒫(A ∩ B) = 𝒫(A) ∩ 𝒫(B). `Set.powerset` is 𝒫. -/

example {α : Type*} (A B : Set α) :
    Set.powerset (A ∩ B) = Set.powerset A ∩ Set.powerset B := by
  ext X                     -- Let X be an arbitrary set.
  simp only [Set.mem_powerset_iff, Set.mem_inter_iff]
  constructor
  · intro h                 -- (⊆) Suppose X ⊆ A ∩ B.
    exact ⟨fun x hx => (h hx).1, fun x hx => (h hx).2⟩
  · rintro ⟨hA, hB⟩ x hx    -- (⊇) Suppose X ⊆ A and X ⊆ B; let x ∈ X.
    exact ⟨hA hx, hB hx⟩
