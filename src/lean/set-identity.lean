import Mathlib

/-! A ∖ (B ∪ C) = (A ∖ B) ∩ (A ∖ C). -/

example {α : Type*} (A B C : Set α) : A \ (B ∪ C) = (A \ B) ∩ (A \ C) := by
  ext x                     -- Let x be arbitrary.
  -- Unpack ∖, ∪ and ∩ into "and", "or" and "not".
  simp only [Set.mem_diff, Set.mem_inter_iff, Set.mem_union]
  constructor
  · rintro ⟨hA, hBC⟩        -- x ∈ A and not (x ∈ B or x ∈ C)
    exact ⟨⟨hA, fun hB => hBC (Or.inl hB)⟩, ⟨hA, fun hC => hBC (Or.inr hC)⟩⟩
  · rintro ⟨⟨hA, hB⟩, -, hC⟩ -- x ∈ A, x ∉ B, x ∉ C
    exact ⟨hA, fun h => h.elim hB hC⟩
