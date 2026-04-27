;; KYA Signal — kya-score.clar
;; Stores agent reputation scores anchored to Bitcoin blocks via Stacks.
;; Each score submission includes a config-hash that fingerprints the
;; normalization weights used, making the oracle auditable on-chain.

;; =====================================================================
;; CONSTANTS
;; =====================================================================

(define-constant CONTRACT-OWNER tx-sender)
(define-constant ERR-NOT-AUTHORIZED (err u100))
(define-constant ERR-AGENT-NOT-FOUND (err u101))
(define-constant ERR-INVALID-SCORE (err u102))
(define-constant ERR-ALREADY-REGISTERED (err u103))
(define-constant ERR-RATE-LIMITED (err u104))
(define-constant VERIFIED-THRESHOLD u85)
(define-constant QUERY-RATE-LIMIT u10) ;; max queries per block per protocol

;; =====================================================================
;; DATA MAPS
;; =====================================================================

;; Agent registry: GEID -> agent data
(define-map agents
  { geid: (string-ascii 64) }
  {
    source-chain-key: (string-ascii 128),
    stacks-key: principal,
    mezo-wallet: (optional (string-ascii 42)),
    registered-at-block: uint,
    active: bool
  }
)

;; Latest score per agent
(define-map agent-scores
  { geid: (string-ascii 64) }
  {
    score: uint,                        ;; 0-100 normalized
    btc-block-height: uint,             ;; Bitcoin block this was anchored to
    stacks-block-height: uint,          ;; Stacks block of submission
    config-hash: (buff 32),             ;; SHA-256 of normalization config used
    raw-inputs-hash: (buff 32),         ;; SHA-256 of raw chain event inputs
    submitted-by: principal,            ;; oracle address
    timestamp: uint
  }
)

;; Score history: agent + sequence -> historical score entry
(define-map score-history
  { geid: (string-ascii 64), seq: uint }
  {
    score: uint,
    btc-block-height: uint,
    config-hash: (buff 32),
    raw-inputs-hash: (buff 32),
    timestamp: uint
  }
)

;; Sequence counter per agent
(define-map agent-seq
  { geid: (string-ascii 64) }
  { seq: uint }
)

;; Authorized oracle addresses
(define-map authorized-oracles
  { oracle: principal }
  { active: bool }
)

;; Protocol query rate limiting: (protocol, block) -> count
(define-map query-counts
  { protocol: principal, block-height: uint }
  { count: uint }
)

;; Dispute flags
(define-map score-disputes
  { geid: (string-ascii 64), seq: uint }
  {
    flagged-by: principal,
    reason: (string-ascii 256),
    resolved: bool
  }
)

;; =====================================================================
;; ORACLE MANAGEMENT
;; =====================================================================

(define-public (add-oracle (oracle principal))
  (begin
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-NOT-AUTHORIZED)
    (ok (map-set authorized-oracles { oracle: oracle } { active: true }))
  )
)

(define-public (remove-oracle (oracle principal))
  (begin
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-NOT-AUTHORIZED)
    (ok (map-set authorized-oracles { oracle: oracle } { active: false }))
  )
)

(define-private (is-oracle (caller principal))
  (match (map-get? authorized-oracles { oracle: caller })
    entry (get active entry)
    false
  )
)

;; =====================================================================
;; AGENT REGISTRATION
;; =====================================================================

(define-public (register-agent
    (geid (string-ascii 64))
    (source-chain-key (string-ascii 128)))
  (begin
    (asserts! (is-none (map-get? agents { geid: geid })) ERR-ALREADY-REGISTERED)
    (map-set agents
      { geid: geid }
      {
        source-chain-key: source-chain-key,
        stacks-key: tx-sender,
        mezo-wallet: none,
        registered-at-block: burn-block-height,
        active: true
      }
    )
    (map-set agent-seq { geid: geid } { seq: u0 })
    (ok geid)
  )
)

(define-public (link-mezo-wallet (geid (string-ascii 64)) (wallet (string-ascii 42)))
  (let ((agent (unwrap! (map-get? agents { geid: geid }) ERR-AGENT-NOT-FOUND)))
    (asserts! (is-eq (get stacks-key agent) tx-sender) ERR-NOT-AUTHORIZED)
    (ok (map-set agents
      { geid: geid }
      (merge agent { mezo-wallet: (some wallet) })
    ))
  )
)

;; =====================================================================
;; SCORE SUBMISSION
;; =====================================================================

(define-public (submit-score
    (geid (string-ascii 64))
    (score uint)
    (config-hash (buff 32))
    (raw-inputs-hash (buff 32)))
  (let (
    (seq-entry (unwrap! (map-get? agent-seq { geid: geid }) ERR-AGENT-NOT-FOUND))
    (next-seq (+ (get seq seq-entry) u1))
    (current-btc-block burn-block-height)
    (current-stacks-block block-height)
  )
    ;; Only authorized oracles can submit
    (asserts! (is-oracle tx-sender) ERR-NOT-AUTHORIZED)
    ;; Score must be 0-100
    (asserts! (<= score u100) ERR-INVALID-SCORE)
    ;; Agent must exist
    (asserts! (is-some (map-get? agents { geid: geid })) ERR-AGENT-NOT-FOUND)

    ;; Write latest score
    (map-set agent-scores
      { geid: geid }
      {
        score: score,
        btc-block-height: current-btc-block,
        stacks-block-height: current-stacks-block,
        config-hash: config-hash,
        raw-inputs-hash: raw-inputs-hash,
        submitted-by: tx-sender,
        timestamp: block-height
      }
    )

    ;; Append to history
    (map-set score-history
      { geid: geid, seq: next-seq }
      {
        score: score,
        btc-block-height: current-btc-block,
        config-hash: config-hash,
        raw-inputs-hash: raw-inputs-hash,
        timestamp: block-height
      }
    )

    ;; Increment sequence
    (map-set agent-seq { geid: geid } { seq: next-seq })
    (ok { score: score, btc-block: current-btc-block, seq: next-seq })
  )
)

;; =====================================================================
;; SCORE READS
;; =====================================================================

(define-read-only (get-score (geid (string-ascii 64)))
  (map-get? agent-scores { geid: geid })
)

(define-read-only (get-agent (geid (string-ascii 64)))
  (map-get? agents { geid: geid })
)

(define-read-only (get-history-entry (geid (string-ascii 64)) (seq uint))
  (map-get? score-history { geid: geid, seq: seq })
)

(define-read-only (get-current-seq (geid (string-ascii 64)))
  (match (map-get? agent-seq { geid: geid })
    entry (some (get seq entry))
    none
  )
)

(define-read-only (is-verified (geid (string-ascii 64)))
  (match (map-get? agent-scores { geid: geid })
    score-entry (>= (get score score-entry) VERIFIED-THRESHOLD)
    false
  )
)

;; =====================================================================
;; DISPUTE MECHANISM
;; =====================================================================

(define-public (flag-score
    (geid (string-ascii 64))
    (seq uint)
    (reason (string-ascii 256)))
  (begin
    (asserts! (is-some (map-get? score-history { geid: geid, seq: seq })) ERR-AGENT-NOT-FOUND)
    (ok (map-set score-disputes
      { geid: geid, seq: seq }
      { flagged-by: tx-sender, reason: reason, resolved: false }
    ))
  )
)

(define-public (resolve-dispute (geid (string-ascii 64)) (seq uint))
  (begin
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-NOT-AUTHORIZED)
    (let ((dispute (unwrap! (map-get? score-disputes { geid: geid, seq: seq }) ERR-AGENT-NOT-FOUND)))
      (ok (map-set score-disputes
        { geid: geid, seq: seq }
        (merge dispute { resolved: true })
      ))
    )
  )
)

(define-read-only (get-dispute (geid (string-ascii 64)) (seq uint))
  (map-get? score-disputes { geid: geid, seq: seq })
)

