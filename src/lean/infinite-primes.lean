import Mathlib

/-! There are infinitely many primes, stated as: no N is at least every prime.
Instead of multiplying a finite list of primes we use N!, which every
prime p ≤ N divides. The idea is Euclid's. -/

example : ¬ ∃ N, ∀ p, Nat.Prime p → p ≤ N := by
  rintro ⟨N, hN⟩                       -- Suppose every prime is ≤ N.
  have hm : N.factorial + 1 ≠ 1 := by  -- m = N! + 1 is bigger than 1,
    have := Nat.factorial_pos N
    omega
  -- so it has a smallest prime factor q.
  have hq : Nat.Prime (Nat.minFac (N.factorial + 1)) := Nat.minFac_prime hm
  -- q is on the "list" (q ≤ N), so q divides N!.
  have h1 : Nat.minFac (N.factorial + 1) ∣ N.factorial :=
    Nat.dvd_factorial hq.pos (hN _ hq)
  -- q also divides m = N! + 1.
  have h2 : Nat.minFac (N.factorial + 1) ∣ N.factorial + 1 := Nat.minFac_dvd _
  -- So q divides the difference, 1. Contradiction.
  have h3 : Nat.minFac (N.factorial + 1) ∣ 1 := (Nat.dvd_add_right h1).mp h2
  exact hq.not_dvd_one h3
