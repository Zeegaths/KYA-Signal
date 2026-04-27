;; KYA Signal — mezo-lender-query.clar
;; Called by Mezo lending protocol to determine KYA-gated LTV ratios.
;; Returns { verified: bool, suggested-ltv: uint } for a given GEID.
;; Rate-limits protocol queries to prevent fishing attacks.

(define-constant KYA-SCORE-CONTRACT .kya-score)
(define-constant ERR-RATE-LIMITED (err u200))
(define-constant ERR-AGENT-NOT-FOUND (err u201))
(define-constant QUERY-RATE-LIMIT u20)        ;; max queries per BTC block per protocol
(define-constant BASE-LTV u60)                ;; 60% LTV — default, unverified
(define-constant VERIFIED-LTV u80)            ;; 80% LTV — KYA score 85-94
(define-constant PREMIUM-LTV u90)             ;; 90% LTV — KYA score 95+
(define-constant VERIFIED-THRESHOLD u85)
(define-constant PREMIUM-THRESHOLD u95)

;; Rate limiting map
(define-map query-counts
  { protocol: principal, btc-block: uint }
  { count: uint }
)

;; Query log for audit trail
(define-map query-log
  { protocol: principal, seq: uint }
  {
    geid: (string-ascii 64),
    verified: bool,
    suggested-ltv: uint,
    btc-block: uint
  }
)

(define-map protocol-seq
  { protocol: principal }
  { seq: uint }
)

;; =====================================================================
;; RATE LIMITING
;; =====================================================================

(define-private (check-and-increment-rate (caller principal))
  (let* (
    (current-block burn-block-height)
    (current-count (default-to u0
      (get count (map-get? query-counts { protocol: caller, btc-block: current-block }))))
  )
    (if (>= current-count QUERY-RATE-LIMIT)
      false
      (begin
        (map-set query-counts
          { protocol: caller, btc-block: current-block }
          { count: (+ current-count u1) }
        )
        true
      )
    )
  )
)

;; =====================================================================
;; LTV CALCULATION
;; =====================================================================

(define-private (score-to-ltv (score uint))
  (if (>= score PREMIUM-THRESHOLD)
    PREMIUM-LTV
    (if (>= score VERIFIED-THRESHOLD)
      VERIFIED-LTV
      BASE-LTV
    )
  )
)

;; =====================================================================
;; MAIN QUERY — called by Mezo or any protocol
;; =====================================================================

(define-public (mezo-lender-query (geid (string-ascii 64)))
  (begin
    ;; Enforce rate limit
    (asserts! (check-and-increment-rate tx-sender) ERR-RATE-LIMITED)

    (let* (
      (score-data (map-get? agent-scores-ref { geid: geid }))
      (verified (match score-data
        entry (>= (get score entry) VERIFIED-THRESHOLD)
        false
      ))
      (ltv (match score-data
        entry (score-to-ltv (get score entry))
        BASE-LTV
      ))
      (protocol-seq-entry (default-to u0
        (get seq (map-get? protocol-seq { protocol: tx-sender }))))
      (next-seq (+ protocol-seq-entry u1))
    )
      ;; Log the query
      (map-set query-log
        { protocol: tx-sender, seq: next-seq }
        {
          geid: geid,
          verified: verified,
          suggested-ltv: ltv,
          btc-block: burn-block-height
        }
      )
      (map-set protocol-seq { protocol: tx-sender } { seq: next-seq })

      (ok { verified: verified, suggested-ltv: ltv })
    )
  )
)

;; Read-only version (no rate limiting, no logging) for UI previews
(define-read-only (preview-ltv (geid (string-ascii 64)))
  (match (map-get? agent-scores-ref { geid: geid })
    entry (ok {
      verified: (>= (get score entry) VERIFIED-THRESHOLD),
      suggested-ltv: (score-to-ltv (get score entry)),
      score: (get score entry)
    })
    (ok { verified: false, suggested-ltv: BASE-LTV, score: u0 })
  )
)

;; Placeholder for cross-contract read — in production, use contract-call?
;; (define-map agent-scores-ref replicated from kya-score for gas efficiency)
(define-map agent-scores-ref
  { geid: (string-ascii 64) }
  { score: uint, btc-block-height: uint, config-hash: (buff 32) }
)

;; Called by KYA score contract after each submit to keep in sync
(define-public (sync-score
    (geid (string-ascii 64))
    (score uint)
    (btc-block uint)
    (config-hash (buff 32)))
  ;; In production, restrict to KYA-SCORE-CONTRACT caller
  (ok (map-set agent-scores-ref
    { geid: geid }
    { score: score, btc-block-height: btc-block, config-hash: config-hash }
  ))
)

