// KYA Signal — Email Service (Zepto Mail)

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const ZEPTO_API_URL = 'https://api.zeptomail.com/v1.1/email';
const FROM_ADDRESS = 'noreply@kya.signal';
const FROM_NAME = 'KYA Signal';

interface EmailPayload {
  to: { email_address: { address: string; name?: string } }[];
  from: { address: string; name: string };
  subject: string;
  htmlbody: string;
}

async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  try {
    const payload: EmailPayload = {
      from: { address: FROM_ADDRESS, name: FROM_NAME },
      to: [{ email_address: { address: to } }],
      subject,
      htmlbody: html,
    };

    const res = await fetch(ZEPTO_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Zoho-enczapikey ${process.env.ZEPTO_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    return res.ok;
  } catch (err) {
    console.error('[email] Send failed:', err);
    return false;
  }
}

// ── EMAIL TEMPLATES ──────────────────────────────────────────────────

const BASE_STYLE = `
  font-family: 'Space Grotesk', sans-serif;
  background: #0A0A0A;
  color: #ffffff;
  padding: 40px;
  max-width: 600px;
  margin: 0 auto;
`;

const ACCENT = '#cafd00';
const ORANGE = '#F7931A';

function wrapTemplate(content: string): string {
  return `
    <div style="${BASE_STYLE}">
      <div style="margin-bottom: 32px;">
        <span style="color: ${ORANGE}; font-size: 20px; font-weight: 700;">KYA</span>
        <span style="color: ${ACCENT}; font-size: 20px; font-weight: 700;">Signal</span>
      </div>
      ${content}
      <hr style="border-color: #222; margin: 32px 0;" />
      <p style="color: #555; font-size: 12px;">
        Know Your Agent · Bitcoin-anchored reputation · kya.signal
      </p>
    </div>
  `;
}

export function registrationEmail(geid: string, btcBlock: number): string {
  return wrapTemplate(`
    <h1 style="font-size: 24px; margin-bottom: 8px;">Agent Registered</h1>
    <p style="color: #aaa; margin-bottom: 24px;">Your GEID has been minted and anchored to Bitcoin block <strong style="color: white;">${btcBlock}</strong>.</p>

    <div style="background: #111; border: 1px solid #222; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
      <p style="font-size: 12px; color: #555; margin: 0 0 4px;">GLOBAL ENTITY ID</p>
      <p style="font-family: monospace; font-size: 13px; color: ${ACCENT}; word-break: break-all; margin: 0;">${geid}</p>
    </div>

    <p style="color: #aaa; font-size: 14px;">
      Your GEID is deterministic — derived as <code>sha256(sourceChainKey:stacksKey)</code>.
      Any verifier can reproduce it independently.
    </p>

    <a href="${process.env.FRONTEND_URL}/dashboard/${geid}"
       style="display: inline-block; background: ${ORANGE}; color: #000; padding: 12px 24px;
              border-radius: 6px; font-weight: 700; text-decoration: none; margin-top: 24px;">
      View Dashboard →
    </a>
  `);
}

export function scoreThresholdEmail(geid: string, score: number, direction: 'above' | 'below'): string {
  const crossed = direction === 'above';
  const badge = score >= 95 ? 'KYA Premium' : 'KYA Verified';
  const color = crossed ? ACCENT : '#F59E0B';

  return wrapTemplate(`
    <h1 style="font-size: 24px; margin-bottom: 8px; color: ${color};">
      ${crossed ? `🟢 ${badge} Status Achieved` : '🟡 Verification Status Lost'}
    </h1>
    <p style="color: #aaa; margin-bottom: 24px;">
      Your agent's score has ${crossed ? 'crossed above' : 'dropped below'} the ${score >= 95 ? '95' : '85'} threshold.
    </p>

    <div style="background: #111; border: 1px solid ${color}33; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
      <p style="font-size: 12px; color: #555; margin: 0 0 4px;">CURRENT SCORE</p>
      <p style="font-size: 48px; font-weight: 700; color: ${color}; margin: 0;">${score}</p>
    </div>

    <p style="color: #aaa; font-size: 14px;">
      ${crossed
        ? `Your agent now qualifies for ${score >= 95 ? '90%' : '80%'} LTV on MUSD borrowing against BTC collateral.`
        : 'Your borrowing limit has reverted to the base 60% LTV. Maintain consistent on-chain activity to re-qualify.'
      }
    </p>

    <a href="${process.env.FRONTEND_URL}/dashboard/${geid}"
       style="display: inline-block; background: ${ORANGE}; color: #000; padding: 12px 24px;
              border-radius: 6px; font-weight: 700; text-decoration: none; margin-top: 24px;">
      View Score →
    </a>
  `);
}

export function disputeOpenedEmail(geid: string, disputeId: string, reason: string): string {
  return wrapTemplate(`
    <h1 style="font-size: 24px; margin-bottom: 8px; color: #F59E0B;">Score Dispute Opened</h1>
    <p style="color: #aaa; margin-bottom: 24px;">A score event for your agent has been flagged for review.</p>

    <div style="background: #111; border: 1px solid #F59E0B33; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
      <p style="font-size: 12px; color: #555; margin: 0 0 4px;">DISPUTE ID</p>
      <p style="font-family: monospace; color: white; margin: 0 0 16px;">${disputeId}</p>
      <p style="font-size: 12px; color: #555; margin: 0 0 4px;">REASON</p>
      <p style="color: #aaa; margin: 0;">${reason}</p>
    </div>

    <a href="${process.env.FRONTEND_URL}/dashboard/${geid}/disputes"
       style="display: inline-block; background: ${ORANGE}; color: #000; padding: 12px 24px;
              border-radius: 6px; font-weight: 700; text-decoration: none;">
      View Dispute →
    </a>
  `);
}

// ── EMAIL WORKER ─────────────────────────────────────────────────────

export async function processEmailQueue(): Promise<void> {
  const pending = await prisma.alertLog.findMany({
    where: { success: false },
    take: 50,
    orderBy: { sentAt: 'asc' },
  });

  for (const log of pending) {
    if (!log.recipientHash) continue;

    // In production: decrypt/look up actual email from secure store
    // Here we use recipientHash as a placeholder for the email address
    const email = log.recipientHash;

    let subject = '';
    let html = '';

    const agent = await prisma.agent.findUnique({ where: { id: log.agentId } });
    if (!agent) continue;

    switch (log.type) {
      case 'REGISTRATION_CONFIRM':
        subject = 'Your KYA Signal agent is registered';
        html = registrationEmail(agent.geid, agent.registeredAtBlock);
        break;
      case 'SCORE_THRESHOLD_CROSSED':
        const latest = await prisma.scoreEvent.findFirst({
          where: { agentId: agent.id },
          orderBy: { createdAt: 'desc' },
        });
        if (!latest) continue;
        subject = `KYA Score Update — ${latest.normalizedScore}/100`;
        html = scoreThresholdEmail(agent.geid, latest.normalizedScore, latest.normalizedScore >= 85 ? 'above' : 'below');
        break;
      case 'DISPUTE_OPENED':
        const dispute = await prisma.scoreDispute.findFirst({
          where: { agentId: agent.id, status: 'OPEN' },
          orderBy: { createdAt: 'desc' },
        });
        if (!dispute) continue;
        subject = 'A score dispute has been opened for your agent';
        html = disputeOpenedEmail(agent.geid, dispute.id, dispute.reason);
        break;
      default:
        continue;
    }

    const success = await sendEmail(email, subject, html);
    await prisma.alertLog.update({ where: { id: log.id }, data: { success } });
  }
}

