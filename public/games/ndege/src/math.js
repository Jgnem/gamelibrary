/* ========================================================================
   PROTECTED GAME LOGIC - DO NOT CHANGE DURING THE VISUAL REFACTOR.
   RNG, RTP, money math, outcomes, payouts, betting, balance, and shot timing
   in the marked sections are behavioral contracts. Visual work must consume
   their state without changing how that state is calculated or resolved.
   ======================================================================== */
/* =====================  MATH / RTP  =====================
   Escape point (the "crash"): r ~ U(0,1)
   escape = max(1.00, 0.94 / (1 - r))
   ⇒ P(escape ≥ m) = 0.94/m  for m ≥ 1
   ⇒ A shot at target m: hits with prob 0.94/m, pays m·stake
     EV = m · (0.94/m) = 0.94  → 94% RTP at ANY aim point,
     pre-committed or fired manually mid-flight.
   ======================================================== */
/* STRATEGY-PROOF (D4): every round is independent and identically
   distributed. For ANY aim m: EV = m × P(escape ≥ m) = m × (0.94/m) = 0.94
   per unit staked. A betting strategy (flat / martingale / anti-martingale /
   Fibonacci) only chooses STAKE SIZES s_1, s_2, ... — by linearity of
   expectation, total EV = 0.94 × Σs_i regardless of the sequence. Stake
   sizing changes variance and bust risk, never the mean. No strategy can
   beat 94% RTP. */
function genEscape(){
  const r = Math.random();
  const c = 0.94 / (1 - r);
  // D2 (corrected): FLOOR is exact here, not biased. With the ties-pay rule,
  // floor(escape) ≥ m  ⟺  raw escape ≥ m  for any 2-decimal target m, so
  // P(hit) = 0.94/m holds identically. Math.round would round raw values in
  // [m−0.005, m) UP to m and inflate RTP at low aims (verified: 94.47% @1.01x).
  return c < 1 ? 1.00 : Math.floor(c * 100) / 100;
}

/* D5: floating-point guard — all money math goes through here.
   Prevents binary FP artifacts like 2.00 × 150 = 299.99999999999994 */
// PROTECTED: payout multiplication and rounding behavior.
function safeMul(stake, mult){
  return Math.round(stake * mult * 100) / 100;
}

/* D1: RTP self-test. Statistical tolerance is 3σ of the binomial sampling
   error (a fixed ±0.05% is tighter than noise allows at high m / low n —
   at m=100 with 500k rounds, 1σ alone is ≈0.44%). With 10M+ rounds the
   3σ band shrinks under ±0.05% for m ≤ 5. */
function runRTPCheck(rounds = 500000){
  const targets = [1.01, 1.5, 2, 5, 10, 50, 100];
  let pass = true;
  for (const m of targets){
    let won = 0;
    for (let i = 0; i < rounds; i++) if (genEscape() >= m) won += m;
    const rtp = won / rounds;
    const p = 0.94 / m;
    const sigma = m * Math.sqrt(p * (1 - p) / rounds);  // SE of the mean payout
    const ok = Math.abs(rtp - 0.94) < 3 * sigma + 0.0005;
    console.log(`aim ${m}x: RTP ${(rtp*100).toFixed(3)}% (3σ=±${(3*sigma*100).toFixed(3)}%) ${ok ? 'PASS' : 'FAIL'}`);
    if (!ok) pass = false;
  }
  console.log(pass ? 'RTP CHECK: ALL PASS' : 'RTP CHECK: FAILED');
  return pass;
}

/* D3: provably-fair seed chain (demo). escape_n is fully determined by
   (serverSeed, roundNumber) — publish the seed after a session and anyone
   can verify every round with verifyRound(). */
async function hashEscape(serverSeed, roundNum){
  const data = new TextEncoder().encode(serverSeed + ':' + roundNum);
  const buf = await crypto.subtle.digest('SHA-256', data);
  const hex = [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2,'0')).join('');
  const r = Math.min(parseInt(hex.slice(0, 8), 16) / 0xFFFFFFFF, 0.999999999);
  const c = 0.94 / (1 - r);
  return c < 1 ? 1.00 : Math.floor(c * 100) / 100;
}
async function verifyRound(serverSeed, roundNum, claimedEscape){
  return Math.abs(await hashEscape(serverSeed, roundNum) - claimedEscape) < 1e-9;
}
