'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function HomePage() {
  useEffect(() => {
    const t = setTimeout(() => {
      const ring = document.getElementById('heroRing') as SVGCircleElement | null;
      if (ring) {
        ring.style.transition = 'stroke-dashoffset 2s cubic-bezier(0.4,0,0.2,1)';
        ring.style.strokeDashoffset = String(339.3 - (91 / 100) * 339.3);
      }
      const counters: [string, number, string][] = [
        ['cnt1', 9000, '+'], ['cnt2', 53, 'B'], ['cnt3', 847, ''],
      ];
      counters.forEach(([id, target, suffix]) => {
        const el = document.getElementById(id);
        if (!el) return;
        let start = 0;
        const step = target / 60;
        const iv = setInterval(() => {
          start = Math.min(start + step, target);
          el.textContent = Math.floor(start).toLocaleString() + suffix;
          if (start >= target) clearInterval(iv);
        }, 16);
      });
      let n = 842914;
      setInterval(() => {
        const el = document.getElementById('btcBlk');
        if (el) el.textContent = '#' + (n++).toLocaleString();
      }, 8000);
    }, 400);
    return () => clearTimeout(t);
  }, []);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        .kp { font-family: 'Space Grotesk', sans-serif; background: #060606; color: #fff; min-height: 100vh; }

        /* ── NAV ── */
        .kp-nav { display: flex; align-items: center; justify-content: space-between; padding: 18px 48px; border-bottom: 1px solid #1a1a1a; background: rgba(6,6,6,0.95); backdrop-filter: blur(12px); position: sticky; top: 0; z-index: 100; }
        .kp-logo { display: flex; align-items: baseline; gap: 1px; }
        .kp-kya { font-size: 18px; font-weight: 700; color: #F7931A; letter-spacing: -0.5px; }
        .kp-sig { font-size: 18px; font-weight: 700; color: #cafd00; letter-spacing: -0.5px; }
        .kp-sub { font-size: 9px; color: #555; font-family: 'JetBrains Mono', monospace; margin-left: 10px; }
        .kp-navlinks { display: flex; align-items: center; gap: 32px; }
        .kp-navlinks a { font-size: 12px; color: #777; text-decoration: none; transition: color .15s; letter-spacing: 0.03em; }
        .kp-navlinks a:hover { color: #fff; }
        .kp-navcta { background: #F7931A; color: #000; font-weight: 700; font-size: 12px; border: none; border-radius: 7px; padding: 9px 20px; cursor: pointer; font-family: 'Space Grotesk', sans-serif; letter-spacing: 0.02em; }

        /* ── HERO (untouched) ── */
        .kp-hero { position: relative; overflow: hidden; padding: 100px 48px 80px; border-bottom: 1px solid #1a1a1a; text-align: center; }
        .kp-hero-bg { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; z-index: 0; }
        .kp-hero-glow { position: absolute; inset: 0; z-index: 0; background: radial-gradient(ellipse 80% 60% at 50% 50%, rgba(247,147,26,0.12) 0%, transparent 70%); }
        .kp-hero-inner { position: relative; z-index: 1; max-width: 900px; margin: 0 auto; }
        .kp-eyebrow { font-size: 9px; font-family: 'JetBrains Mono', monospace; color: #F7931A; letter-spacing: 0.2em; margin-bottom: 28px; display: flex; align-items: center; justify-content: center; gap: 16px; }
        .kp-eyebrow::before, .kp-eyebrow::after { content: ''; flex: 1; max-width: 60px; height: 1px; background: rgba(247,147,26,0.3); }
        .kp-h1 { font-size: 88px; font-weight: 700; line-height: 0.88; letter-spacing: -5px; margin-bottom: 32px; color: #fff; text-transform: uppercase; }
        .kp-h1 .o { color: #F7931A; }
        .kp-hero-desc { font-size: 17px; color: #bbb; line-height: 1.8; max-width: 520px; margin: 0 auto 40px; font-weight: 400; }
        .kp-hero-desc strong { color: #ccc; font-weight: 500; }
        .kp-hero-ctas { display: flex; align-items: center; justify-content: center; gap: 12px; margin-bottom: 64px; }
        .kp-btn-p { background: #F7931A; color: #000; font-weight: 700; font-size: 14px; border: none; border-radius: 8px; padding: 14px 32px; cursor: pointer; font-family: 'Space Grotesk', sans-serif; letter-spacing: 0.02em; transition: opacity .15s; }
        .kp-btn-p:hover { opacity: 0.88; }
        .kp-btn-s { background: transparent; color: #fff; font-size: 14px; font-weight: 500; border: 1px solid #2a2a2a; border-radius: 8px; padding: 14px 32px; cursor: pointer; font-family: 'Space Grotesk', sans-serif; transition: border-color .15s; }
        .kp-btn-s:hover { border-color: #888; }
        .kp-ltv-row { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; max-width: 680px; margin: 0 auto; }
        .kp-ltvc { background: rgba(255,255,255,0.03); border: 1px solid #1e1e1e; border-radius: 12px; padding: 24px 20px; text-align: center; transition: border-color .2s; position: relative; overflow: hidden; }
        .kp-ltvc::before { content: ''; position: absolute; inset: 0; background: linear-gradient(135deg, rgba(255,255,255,0.02) 0%, transparent 60%); }
        .kp-ltvc.active { border-color: rgba(202,253,0,0.25); background: rgba(202,253,0,0.04); }
        .kp-ltvc.premium { border-color: rgba(247,147,26,0.25); background: rgba(247,147,26,0.04); }
        .kp-ltvc:hover { border-color: #666; }
        .kp-ltvc-n { font-size: 40px; font-weight: 700; line-height: 1; margin-bottom: 6px; }
        .kp-ltvc-label { font-size: 11px; font-weight: 600; margin-bottom: 4px; letter-spacing: 0.05em; }
        .kp-ltvc-req { font-size: 9px; font-family: 'JetBrains Mono', monospace; color: #666; }
        .kp-ltvc-bar { height: 2px; border-radius: 1px; margin-top: 14px; background: #1a1a1a; overflow: hidden; }
        .kp-ltvc-bar-fill { height: 100%; border-radius: 1px; }

        /* ── STATS ── */
        .kp-stats { display: grid; grid-template-columns: repeat(3,1fr); border-top: 1px solid #1a1a1a; border-bottom: 1px solid #1a1a1a; background: #080808; }
        .kp-stat { padding: 36px 48px; border-right: 1px solid #1a1a1a; }
        .kp-stat:last-child { border-right: none; }
        .kp-stat-n { font-size: 48px; font-weight: 700; line-height: 1; color: #fff; margin-bottom: 6px; }
        .kp-stat-n .o { color: #F7931A; }
        .kp-stat-n .g { color: #cafd00; }
        .kp-stat-l { font-size: 11px; font-family: 'JetBrains Mono', monospace; color: #666; letter-spacing: 0.05em; }

        /* ── PROBLEM / SOLUTION ── */
        .kp-probgrid { display: grid; grid-template-columns: 1fr 1fr; border-bottom: 1px solid #1a1a1a; }
        .kp-pcol { padding: 64px 48px; }
        .kp-pcol.dark { background: #080808; border-left: 1px solid #1a1a1a; }
        .kp-slabel { font-size: 9px; font-family: 'JetBrains Mono', monospace; color: #F7931A; letter-spacing: 0.18em; margin-bottom: 16px; display: flex; align-items: center; gap: 10px; }
        .kp-slabel::before { content: ''; width: 20px; height: 1px; background: #F7931A; }
        .kp-slabel.g { color: #cafd00; }
        .kp-slabel.g::before { background: #cafd00; }
        .kp-sh { font-size: 36px; font-weight: 700; letter-spacing: -1.5px; line-height: 1.05; margin-bottom: 20px; color: #fff; border-left: 3px solid #F7931A; padding-left: 18px; text-transform: uppercase; }
        .kp-sh.g { border-left-color: #cafd00; }
        .kp-body-text { font-size: 14px; color: #999; line-height: 1.85; margin-bottom: 28px; }
        .kp-journey { display: flex; flex-direction: column; gap: 10px; margin-bottom: 28px; }
        .kp-jcard { display: flex; align-items: center; gap: 14px; background: #0d0d0d; border: 1px solid #1a1a1a; border-radius: 10px; padding: 16px 18px; }
        .kp-jav { width: 42px; height: 42px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 700; font-family: 'JetBrains Mono', monospace; flex-shrink: 0; }
        .kp-jav.sol { background: rgba(153,69,255,.1); color: #9945FF; border: 1px solid rgba(153,69,255,.2); }
        .kp-jav.eth { background: rgba(98,126,234,.1); color: #627EEA; border: 1px solid rgba(98,126,234,.2); }
        .kp-jname { font-size: 13px; font-weight: 600; color: #fff; margin-bottom: 3px; }
        .kp-jsub { font-size: 10px; font-family: 'JetBrains Mono', monospace; color: #666; }
        .kp-jscore { margin-left: auto; text-align: right; }
        .kp-jsval { font-size: 26px; font-weight: 700; line-height: 1; }
        .kp-jsval.k { color: #cafd00; }
        .kp-jsval.u { color: #1e1e1e; }
        .kp-jslbl { font-size: 9px; font-family: 'JetBrains Mono', monospace; }
        .kp-jslbl.k { color: #cafd00; }
        .kp-jslbl.u { color: #444; }
        .kp-jarrow { display: flex; align-items: center; gap: 10px; padding: 0 16px; }
        .kp-jline { flex: 1; height: 1px; background: #1a1a1a; }
        .kp-jtxt { font-size: 9px; font-family: 'JetBrains Mono', monospace; color: #555; white-space: nowrap; }
        .kp-pstats { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
        .kp-ps { background: #0d0d0d; border: 1px solid #1a1a1a; border-radius: 8px; padding: 18px; }
        .kp-psn { font-size: 30px; font-weight: 700; line-height: 1; margin-bottom: 4px; }
        .kp-psn.o { color: #F7931A; }
        .kp-psn.g { color: #cafd00; }
        .kp-psn.w { color: #fff; }
        .kp-psl { font-size: 10px; font-family: 'JetBrains Mono', monospace; color: #666; }
        .kp-sol-ltvcards { display: flex; flex-direction: column; gap: 8px; margin-bottom: 16px; }
        .kp-sltvc { background: #0d0d0d; border: 1px solid #1a1a1a; border-radius: 10px; padding: 16px 18px; display: flex; align-items: center; gap: 16px; }
        .kp-sltvc.a { border-color: rgba(202,253,0,.2); background: rgba(202,253,0,.02); }
        .kp-sltvc.p { border-color: rgba(247,147,26,.2); background: rgba(247,147,26,.02); }
        .kp-sltvcn { font-size: 36px; font-weight: 700; min-width: 72px; line-height: 1; }
        .kp-sltvname { font-size: 13px; font-weight: 600; color: #fff; margin-bottom: 3px; }
        .kp-sltvreq { font-size: 10px; font-family: 'JetBrains Mono', monospace; color: #666; }
        .kp-sltvbar { width: 56px; height: 3px; background: #1a1a1a; border-radius: 2px; overflow: hidden; }
        .kp-sltvbf { height: 100%; border-radius: 2px; }
        .kp-coderesp { background: #0a0a0a; border: 1px solid #1a1a1a; border-radius: 10px; padding: 18px; font-family: 'JetBrains Mono', monospace; font-size: 11px; line-height: 2; }
        .cr{color:#222}.ck{color:#627EEA}.cv{color:#cafd00}.cb{color:#F7931A}

        /* ── PIPELINE ── */
        .kp-pipeline { padding: 80px 48px; border-bottom: 1px solid #1a1a1a; }
        .kp-pipe-head { text-align: center; margin-bottom: 64px; }
        .kp-pipe-h { font-size: 13px; font-family: 'JetBrains Mono', monospace; color: #F7931A; letter-spacing: 0.2em; margin-bottom: 20px; display: flex; align-items: center; justify-content: center; gap: 12px; }
        .kp-pipe-h::before, .kp-pipe-h::after { content: ''; flex: 1; max-width: 80px; height: 1px; background: rgba(247,147,26,.25); }
        .kp-pipe-title { font-size: 42px; font-weight: 700; letter-spacing: -2px; color: #fff; text-transform: uppercase; line-height: 0.9; }
        .kp-pipe-title span { color: #F7931A; }
        .kp-steps { display: flex; flex-direction: column; gap: 0; max-width: 760px; margin: 0 auto; }
        .kp-step { display: grid; grid-template-columns: 80px 1fr; gap: 0; position: relative; }
        .kp-step:not(:last-child)::after { content: ''; position: absolute; left: 39px; top: 52px; bottom: 0; width: 1px; background: #1a1a1a; }
        .kp-step-num { display: flex; flex-direction: column; align-items: center; padding-top: 14px; }
        .kp-step-circle { width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; font-family: 'JetBrains Mono', monospace; background: #0d0d0d; border: 1px solid #1e1e1e; color: #666; position: relative; z-index: 1; transition: all .25s; flex-shrink: 0; }
        .kp-step:hover .kp-step-circle { border-color: #F7931A; color: #F7931A; background: rgba(247,147,26,.05); }
        .kp-step-circle.btc { border-color: rgba(247,147,26,.35); color: #F7931A; background: rgba(247,147,26,.06); }
        .kp-step-circle.end { border-color: rgba(202,253,0,.35); color: #cafd00; background: rgba(202,253,0,.06); }
        .kp-step-body { padding: 12px 0 32px 24px; border-left: 1px solid #111; margin-left: -1px; }
        .kp-step-title { font-size: 16px; font-weight: 600; color: #fff; margin-bottom: 5px; }
        .kp-step-title.btc { color: #F7931A; }
        .kp-step-title.end { color: #cafd00; }
        .kp-step-desc { font-size: 13px; color: #888; line-height: 1.7; font-family: 'JetBrains Mono', monospace; }
        .kp-step-desc strong { color: #bbb; font-weight: 500; }

        /* ── MARKET ── */
        .kp-market { padding: 80px 48px; border-bottom: 1px solid #1a1a1a; }
        .kp-market-head { margin-bottom: 48px; }
        .kp-mgrid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .kp-mc { background: #0a0a0a; border: 1px solid #1a1a1a; border-radius: 12px; padding: 28px; transition: border-color .2s; }
        .kp-mc:hover { border-color: rgba(247,147,26,.2); }
        .kp-mc-top { display: flex; align-items: center; gap: 14px; margin-bottom: 14px; }
        .kp-mc-icon { width: 40px; height: 40px; border-radius: 9px; background: rgba(247,147,26,.08); border: 1px solid rgba(247,147,26,.15); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .kp-mc h3 { font-size: 15px; font-weight: 600; color: #fff; }
        .kp-mc p { font-size: 13px; color: #888; line-height: 1.75; margin-bottom: 14px; }
        .kp-mc-tag { font-size: 9px; font-family: 'JetBrains Mono', monospace; color: #444; background: #111; padding: 3px 9px; border-radius: 3px; border: 1px solid #1a1a1a; }

        /* ── QUERY ── */
        .kp-qsec { padding: 80px 48px; border-bottom: 1px solid #1a1a1a; display: grid; grid-template-columns: 1fr 1fr; gap: 64px; align-items: center; }
        .kp-qh { font-size: 36px; font-weight: 700; letter-spacing: -2px; line-height: 1.0; color: #fff; margin-bottom: 16px; text-transform: uppercase; }
        .kp-qh span { color: #cafd00; }
        .kp-qp { font-size: 14px; color: #999; line-height: 1.8; margin-bottom: 28px; }
        .kp-rrow { display: flex; gap: 8px; }
        .kp-rc { flex: 1; background: #0d0d0d; border: 1px solid #1a1a1a; border-radius: 8px; padding: 14px; text-align: center; }
        .kp-rn { font-size: 24px; font-weight: 700; margin-bottom: 4px; }
        .kp-rl { font-size: 9px; font-family: 'JetBrains Mono', monospace; color: #666; }
        .kp-qcode { background: #080808; border: 1px solid #1a1a1a; border-radius: 12px; overflow: hidden; }
        .kp-qbar { background: #0d0d0d; border-bottom: 1px solid #1a1a1a; padding: 12px 18px; display: flex; align-items: center; gap: 7px; }
        .kp-qbd { width: 8px; height: 8px; border-radius: 50%; }
        .kp-qbarlabel { font-size: 10px; font-family: 'JetBrains Mono', monospace; color: #444; margin-left: 8px; }
        .kp-qbody { padding: 24px; font-family: 'JetBrains Mono', monospace; font-size: 11px; line-height: 2.2; }
        .qc{color:#1e1e1e}.qk{color:#627EEA}.qv{color:#cafd00}.qbo{color:#F7931A}.qn{color:#9945FF}

        /* ── FOOTER ── */
        .kp-footer { padding: 32px 48px; display: flex; justify-content: space-between; align-items: center; }
        .kp-fl a { font-size: 11px; color: #555; text-decoration: none; margin-right: 20px; transition: color .15s; }
        .kp-fl a:hover { color: #fff; }
        .kp-fanc { display: flex; align-items: center; gap: 6px; font-size: 10px; font-family: 'JetBrains Mono', monospace; color: #555; }
        .kp-fdot { width: 6px; height: 6px; border-radius: 50%; background: #cafd00; animation: blink 2s infinite; }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:.2} }

        /* ── MOBILE OVERRIDES ── */
        @media (max-width: 767px) {
          .kp-nav { padding: 14px 20px; }
          .kp-sub { display: none; }
          .kp-navlinks { display: none; }
          .kp-navcta { font-size: 11px; padding: 8px 14px; }

          .kp-hero { padding: 56px 20px 48px; }
          .kp-h1 { font-size: 48px; letter-spacing: -3px; }
          .kp-hero-desc { font-size: 14px; }
          .kp-hero-ctas { flex-direction: column; align-items: stretch; gap: 10px; margin-bottom: 40px; }
          .kp-btn-p, .kp-btn-s { width: 100%; padding: 13px 20px; }
          .kp-ltv-row { gap: 8px; }
          .kp-ltvc { padding: 16px 10px; }
          .kp-ltvc-n { font-size: 26px; }
          .kp-ltvc-label { font-size: 9px; }

          .kp-stats { grid-template-columns: 1fr; }
          .kp-stat { padding: 20px 24px; border-right: none; border-bottom: 1px solid #1a1a1a; }
          .kp-stat:last-child { border-bottom: none; }
          .kp-stat-n { font-size: 36px; }

          .kp-probgrid { grid-template-columns: 1fr; }
          .kp-pcol { padding: 40px 24px; }
          .kp-pcol.dark { border-left: none; border-top: 1px solid #1a1a1a; }
          .kp-sh { font-size: 24px; }

          .kp-pipeline { padding: 48px 24px; }
          .kp-pipe-title { font-size: 28px; }
          .kp-pipe-head { margin-bottom: 40px; }
          .kp-step { grid-template-columns: 56px 1fr; }
          .kp-step:not(:last-child)::after { left: 27px; top: 44px; }
          .kp-step-circle { width: 34px; height: 34px; font-size: 10px; }
          .kp-step-body { padding: 8px 0 24px 16px; }
          .kp-step-title { font-size: 14px; }
          .kp-step-desc { font-size: 12px; }

          .kp-market { padding: 48px 24px; }
          .kp-mgrid { grid-template-columns: 1fr; gap: 10px; }
          .kp-mc { padding: 20px; }
          .kp-market-head { margin-bottom: 28px; }

          .kp-qsec { padding: 48px 24px; grid-template-columns: 1fr; gap: 32px; }
          .kp-qh { font-size: 26px; }

          .kp-footer { padding: 24px; flex-direction: column; align-items: flex-start; gap: 20px; }
          .kp-fl { flex-wrap: wrap; gap: 12px; }
          .kp-fl a { margin-right: 0; }
        }
      `}</style>

      <div className="kp">
        <nav className="kp-nav">
          <div className="kp-logo">
            <span className="kp-kya">KYA</span>
            <span className="kp-sig">Signal</span>
            <span className="kp-sub">know your agent</span>
          </div>
          <div className="kp-navlinks">
            <Link href="/dashboard">Network</Link>
            <Link href="/audit">Protocol</Link>
            <Link href="/disputes">Markets</Link>
            <Link href="/configs">Process</Link>
            <Link href="/configs">Docs</Link>
            <button className="kp-navcta" onClick={() => window.location.href='/register'}>Connect Wallet</button>
            <button className="kp-navcta" style={{ background:'#cafd00' }} onClick={() => window.location.href='/register'}>Register Agent</button>
          </div>
          <button className="kp-navcta" style={{ display: 'none' }} onClick={() => window.location.href='/register'}>Register</button>
        </nav>

        <div className="kp-hero">
          <div className="kp-hero-glow" />
          <svg className="kp-hero-bg" viewBox="0 0 1400 700" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
            <defs><pattern id="g1" width="48" height="48" patternUnits="userSpaceOnUse"><path d="M 48 0 L 0 0 0 48" fill="none" stroke="#1c1c1c" strokeWidth="0.6"/></pattern></defs>
            <rect width="1400" height="700" fill="url(#g1)"/>
            <line x1="0" y1="700" x2="1400" y2="0" stroke="#F7931A" strokeWidth="0.5" opacity="0.1"/>
            <line x1="200" y1="700" x2="1400" y2="100" stroke="#F7931A" strokeWidth="0.3" opacity="0.06"/>
            <line x1="0" y1="500" x2="1200" y2="0" stroke="#F7931A" strokeWidth="0.3" opacity="0.06"/>
            <circle cx="700" cy="350" r="280" fill="none" stroke="#F7931A" strokeWidth="0.5" opacity="0.06"/>
            <circle cx="700" cy="350" r="420" fill="none" stroke="#cafd00" strokeWidth="0.4" opacity="0.03"/>
            <circle cx="700" cy="350" r="180" fill="none" stroke="#F7931A" strokeWidth="0.5" opacity="0.09"/>
            <circle cx="700" cy="350" r="90"  fill="none" stroke="#F7931A" strokeWidth="0.5" opacity="0.14"/>
            <circle cx="0"    cy="0"   r="2" fill="#F7931A" opacity="0.15"/>
            <circle cx="1400" cy="0"   r="2" fill="#F7931A" opacity="0.15"/>
            <circle cx="0"    cy="700" r="2" fill="#F7931A" opacity="0.15"/>
            <circle cx="1400" cy="700" r="2" fill="#F7931A" opacity="0.15"/>
          </svg>
          <div className="kp-hero-inner">
            <div className="kp-eyebrow">REPUTATION PROTOCOL · v1.0</div>
            <h1 className="kp-h1">KNOW YOUR<br/><span className="o">AGENT.</span></h1>
            <p className="kp-hero-desc">Portable reputation for autonomous agents. <strong>Real-time trust metrics anchored to Bitcoin&apos;s immutable ledger.</strong></p>
            <div className="kp-hero-ctas">
              <button className="kp-btn-p" onClick={() => window.location.href='/register'}>Register Agent</button>
              <button className="kp-btn-s" onClick={() => window.location.href='/dashboard'}>View Score</button>
            </div>
            <div className="kp-ltv-row">
              <div className="kp-ltvc">
                <div className="kp-ltvc-n" style={{color:'#444'}}>60%</div>
                <div className="kp-ltvc-label" style={{color:'#555'}}>BASE LTV</div>
                <div className="kp-ltvc-req">score &lt; 85 · unverified</div>
                <div className="kp-ltvc-bar"><div className="kp-ltvc-bar-fill" style={{width:'60%',background:'#2a2a2a'}}/></div>
              </div>
              <div className="kp-ltvc active">
                <div className="kp-ltvc-n" style={{color:'#cafd00'}}>80%</div>
                <div className="kp-ltvc-label" style={{color:'#cafd00'}}>KYA VERIFIED</div>
                <div className="kp-ltvc-req" style={{color:'rgba(202,253,0,0.4)'}}>score ≥ 85</div>
                <div className="kp-ltvc-bar"><div className="kp-ltvc-bar-fill" style={{width:'80%',background:'#cafd00'}}/></div>
              </div>
              <div className="kp-ltvc premium">
                <div className="kp-ltvc-n" style={{color:'#F7931A'}}>90%</div>
                <div className="kp-ltvc-label" style={{color:'#F7931A'}}>KYA PREMIUM</div>
                <div className="kp-ltvc-req" style={{color:'rgba(247,147,26,0.4)'}}>score ≥ 95</div>
                <div className="kp-ltvc-bar"><div className="kp-ltvc-bar-fill" style={{width:'90%',background:'#F7931A'}}/></div>
              </div>
            </div>
          </div>
        </div>

        <div className="kp-stats">
          <div className="kp-stat"><div className="kp-stat-n"><span id="cnt1" className="o">0+</span></div><div className="kp-stat-l">AGENTS ON SOLANA</div></div>
          <div className="kp-stat"><div className="kp-stat-n"><span id="cnt2" className="g">0B</span></div><div className="kp-stat-l">ETH TVL REACHABLE</div></div>
          <div className="kp-stat"><div className="kp-stat-n"><span id="cnt3">0</span></div><div className="kp-stat-l">EVENTS INDEXED LIVE</div></div>
        </div>

        <div className="kp-probgrid">
          <div className="kp-pcol">
            <div className="kp-slabel">MARKET INEFFICIENCY</div>
            <div className="kp-sh" style={{marginBottom:'20px'}}>AGENT REPUTATION<br/>DOESN&apos;T TRAVEL.</div>
            <p className="kp-body-text">On-chain performance data creates friction for cross-chain agents. Without a unified score, capital efficiency is capped at the network level.</p>
            <div className="kp-journey">
              <div className="kp-jcard">
                <div className="kp-jav sol">S</div>
                <div><div className="kp-jname">Agent #4021</div><div className="kp-jsub">Solana · 847 txs · 99.1% success</div></div>
                <div className="kp-jscore"><div className="kp-jsval k">94</div><div className="kp-jslbl k">known ✓</div></div>
              </div>
              <div className="kp-jarrow"><div className="kp-jline"/><div className="kp-jtxt">moves to Ethereum</div><div className="kp-jline"/></div>
              <div className="kp-jcard" style={{opacity:.55}}>
                <div className="kp-jav eth">E</div>
                <div><div className="kp-jname">Agent #4021</div><div className="kp-jsub">Ethereum · 0 txs · no history</div></div>
                <div className="kp-jscore"><div className="kp-jsval u">?</div><div className="kp-jslbl u">stranger</div></div>
              </div>
            </div>
            <div className="kp-pstats">
              {[{n:'60%',c:'o',l:'LTV without KYA'},{n:'90%',c:'g',l:'LTV with KYA Premium'},{n:'9K+',c:'w',l:'agents hitting this daily'},{n:'$53B',c:'w',l:'TVL locked behind it'}].map((s,i)=>(
                <div key={i} className="kp-ps"><div className={`kp-psn ${s.c}`}>{s.n}</div><div className="kp-psl">{s.l}</div></div>
              ))}
            </div>
          </div>
          <div className="kp-pcol dark">
            <div className="kp-slabel g">SOLUTION DEPLOYED</div>
            <div className="kp-sh g" style={{marginBottom:'20px'}}>A PORTABLE,<br/>BITCOIN-ANCHORED SCORE.</div>
            <p className="kp-body-text">By settling reputation proofs on Bitcoin, KYA Signal provides an immutable, permissionless identity layer that any protocol can query permissionlessly.</p>
            <div className="kp-sol-ltvcards">
              {[{pct:'60%',col:'#444',name:'Base LTV',req:'score < 85 · default',bw:'60%',bc:'#2a2a2a',cls:''},{pct:'80%',col:'#cafd00',name:'KYA Verified',req:'score ≥ 85',bw:'80%',bc:'#cafd00',cls:'a'},{pct:'90%',col:'#F7931A',name:'KYA Premium',req:'score ≥ 95',bw:'90%',bc:'#F7931A',cls:'p'}].map((t,i)=>(
                <div key={i} className={`kp-sltvc ${t.cls}`}>
                  <div className="kp-sltvcn" style={{color:t.col}}>{t.pct}</div>
                  <div><div className="kp-sltvname">{t.name}</div><div className="kp-sltvreq" style={{color:t.col+'88'}}>{t.req}</div></div>
                  <div className="kp-sltvbar" style={{marginLeft:'auto'}}><div className="kp-sltvbf" style={{width:t.bw,background:t.bc}}/></div>
                </div>
              ))}
            </div>
            <div className="kp-coderesp">
              <div><span className="cr">{'// contract returns'}</span></div>
              <div><span className="cr">{'{'}</span></div>
              <div>&nbsp;&nbsp;<span className="ck">&quot;verified&quot;</span><span className="cr">: </span><span className="cb">true</span><span className="cr">,</span></div>
              <div>&nbsp;&nbsp;<span className="ck">&quot;suggested-ltv&quot;</span><span className="cr">: </span><span className="cv">80</span></div>
              <div><span className="cr">{'}'}</span></div>
            </div>
          </div>
        </div>

        <div className="kp-pipeline">
          <div className="kp-pipe-head">
            <div className="kp-pipe-h">PROTOCOL LIFECYCLE</div>
            <div className="kp-pipe-title">EXECUTION<br/><span>PIPELINE</span></div>
          </div>
          <div className="kp-steps">
            {[
              {n:'01',t:'Agent Registers',d:'Signs a handshake linking source chain key to Stacks key. GEID minted as <strong>sha256(sourceKey:stacksKey)</strong> — deterministic, no DB required.',cls:''},
              {n:'02',t:'Agent Acts',d:'Executes on the source chain — vault rebalances, liquidations, protocol interactions across <strong>Solana and Ethereum</strong>.',cls:''},
              {n:'03',t:'Oracle Detects',d:'Chain listeners classify events, run them through the <strong>versioned normalization engine</strong>. Config hash committed before submission.',cls:''},
              {n:'04',t:'submit-score',d:'Oracle calls the Clarity contract. Score, config hash, and raw inputs hash are <strong>anchored to the current Bitcoin block height</strong> via Stacks.',cls:'btc'},
              {n:'05',t:'Agent Moves Chains',d:'Agent deploys to a new protocol on Ethereum. No coordination required. <strong>GEID travels with the agent.</strong>',cls:''},
              {n:'06',t:'Protocol Queries',d:'Protocol calls <strong>/protocol/query</strong>. Gets back verified: bool + suggested-ltv: uint in one round trip. Rate-limited to 20 queries per BTC block.',cls:''},
              {n:'07',t:'Trust Unlocked',d:'Protocol grants elevated access. <strong>No KYC. No bridge delay. No whitelist.</strong> Math-based green light.',cls:'end'},
            ].map((s,i)=>(
              <div key={i} className="kp-step">
                <div className="kp-step-num"><div className={`kp-step-circle ${s.cls}`}>{s.n}</div></div>
                <div className="kp-step-body">
                  <div className={`kp-step-title ${s.cls}`}>{s.t}</div>
                  <div className="kp-step-desc" dangerouslySetInnerHTML={{__html:s.d}}/>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="kp-market">
          <div className="kp-market-head">
            <div className="kp-slabel">TARGET VERTICALS</div>
            <div className="kp-sh" style={{fontSize:'40px',borderLeft:'none',paddingLeft:0}}>ASYMMETRIC TRUST<br/>IN AGENTIC ECONOMIES.</div>
          </div>
          <div className="kp-mgrid">
            {[
              {t:'DeFi Risk Engines',p:'Aave, Kamino — adjust collateral ratios dynamically from live on-chain score. Replace static whitelists with verifiable math.',tag:'Aave · Kamino · Compound'},
              {t:'Agent Marketplaces',p:'Morpheus, Venice — rank agents with verifiable on-chain evidence. Evidence-backed ratings replace unverified reputation systems.',tag:'Morpheus · Venice · Fetch.ai'},
              {t:'Strategy Agents',p:'Auto-reject sub-agents scoring below 80 before routing execution capital. One permissionless query, zero trust assumptions.',tag:'score ≥ 80 threshold'},
              {t:'Insurance Protocols',p:'Nexus Mutual — price premiums from historical uptime, success rates, and error logs. Actuarial pricing without the actuary.',tag:'Nexus Mutual · InsurAce'},
            ].map((m,i)=>(
              <div key={i} className="kp-mc">
                <div className="kp-mc-top">
                  <div className="kp-mc-icon"><svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 2L14 5v4c0 3-2.5 4.5-6 5-3.5-.5-6-2-6-5V5l6-3z" stroke="#F7931A" strokeWidth="1.2"/></svg></div>
                  <h3>{m.t}</h3>
                </div>
                <p>{m.p}</p>
                <div className="kp-mc-tag">{m.tag}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="kp-qsec">
          <div>
            <div className="kp-slabel">$1.1B UNTAPPED LIQUIDITY</div>
            <div className="kp-qh">ONE QUERY.<br/><span>MATH-BASED</span><br/>GREEN LIGHT.</div>
            <p className="kp-qp">Any protocol. Any chain. No whitelist, no partnership. Post a GEID — get back verified + suggested LTV. Rate-limited to 20 queries per BTC block per protocol address.</p>
            <div className="kp-rrow">
              <div className="kp-rc"><div className="kp-rn" style={{color:'#F7931A'}}>20</div><div className="kp-rl">queries / BTC block</div></div>
              <div className="kp-rc"><div className="kp-rn" style={{color:'#cafd00'}}>&lt;50ms</div><div className="kp-rl">cached response</div></div>
              <div className="kp-rc"><div className="kp-rn" style={{color:'#627EEA'}}>∞</div><div className="kp-rl">protocols supported</div></div>
            </div>
          </div>
          <div className="kp-qcode">
            <div className="kp-qbar">
              <div className="kp-qbd" style={{background:'#F7931A'}}/><div className="kp-qbd" style={{background:'#cafd00'}}/><div className="kp-qbd" style={{background:'#222'}}/>
              <span className="kp-qbarlabel">POST /protocol/query</span>
            </div>
            <div className="kp-qbody">
              <div><span className="qc">{'// request'}</span></div>
              <div><span className="qc">{'{'}</span></div>
              <div>&nbsp;&nbsp;<span className="qk">&quot;geid&quot;</span><span className="qc">: </span><span className="qv">&quot;a3f8c291...b2e&quot;</span><span className="qc">,</span></div>
              <div>&nbsp;&nbsp;<span className="qk">&quot;protocolAddress&quot;</span><span className="qc">: </span><span className="qv">&quot;0x87870B...&quot;</span></div>
              <div><span className="qc">{'}'}</span></div>
              <div>&nbsp;</div>
              <div><span className="qc">{'// → 200 OK · 34ms'}</span></div>
              <div><span className="qc">{'{'}</span></div>
              <div>&nbsp;&nbsp;<span className="qk">&quot;verified&quot;</span><span className="qc">: </span><span className="qbo">true</span><span className="qc">,</span></div>
              <div>&nbsp;&nbsp;<span className="qk">&quot;suggested-ltv&quot;</span><span className="qc">: </span><span className="qn">80</span><span className="qc">,</span></div>
              <div>&nbsp;&nbsp;<span className="qk">&quot;btcBlock&quot;</span><span className="qc">: </span><span className="qn" id="btcBlk">#842,914</span></div>
              <div><span className="qc">{'}'}</span></div>
            </div>
          </div>
        </div>

        <footer className="kp-footer">
          <div className="kp-logo"><span className="kp-kya">KYA</span><span className="kp-sig">Signal</span></div>
          <div className="kp-fl">
            <Link href="/register">Register</Link>
            <Link href="/dashboard">Dashboard</Link>
            <Link href="/audit">Audit Trail</Link>
            <Link href="/disputes">Disputes</Link>
            <Link href="/configs">Config Versions</Link>
          </div>
          <div className="kp-fanc"><span className="kp-fdot"/>Bitcoin anchored · Mezo Hackathon 2025</div>
        </footer>
      </div>
    </>
  );
}g