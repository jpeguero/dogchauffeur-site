import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

// ── Config — update with your real Google Business review link ────────────────
const GOOGLE_REVIEW_URL = "https://g.page/r/YOUR_PLACE_ID/review";
const BUSINESS_NAME     = "DogChauffeur";
const BUSINESS_PHONE    = "(708) 773-5958";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Must be called by admin or via service role (scheduled automation)
    const user = await base44.auth.me().catch(() => null);
    const isServiceCall = !user; // scheduled automations call without user token

    if (user && user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const client = isServiceCall
      ? base44.asServiceRole
      : (user?.role === 'admin' ? base44.asServiceRole : base44);

    // Find completed trips from 23–25 hours ago that haven't had an email sent
    const now          = Date.now();
    const windowStart  = new Date(now - 25 * 60 * 60 * 1000).toISOString();
    const windowEnd    = new Date(now - 23 * 60 * 60 * 1000).toISOString();

    const trips = await client.entities.Trip.filter({ status: 'completed', review_email_sent: false });

    const eligible = trips.filter(t => {
      const completedAt = t.completed_at || t.updated_date;
      return completedAt >= windowStart && completedAt <= windowEnd;
    });

    let sent = 0;
    for (const trip of eligible) {
      if (!trip.owner_email) continue;

      const petName = trip.pet_name || "your pet";

      const emailBody = `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto; background: #fff; border-radius: 16px; overflow: hidden; border: 1px solid #D8F3DC;">
  <div style="background: linear-gradient(135deg, #1B4332 0%, #2D6A4F 100%); padding: 32px 32px 24px; text-align: center;">
    <div style="font-size: 36px; margin-bottom: 8px;">🐾</div>
    <h1 style="color: #fff; margin: 0; font-size: 22px; font-weight: 700;">${BUSINESS_NAME}</h1>
    <p style="color: #95D5B2; margin: 6px 0 0; font-size: 14px;">Safe &amp; Professional Pet Transport</p>
  </div>

  <div style="padding: 32px;">
    <h2 style="color: #1B4332; font-size: 20px; margin: 0 0 12px;">Thanks for trusting us with ${petName}! 🐶</h2>
    <p style="color: #4B5563; line-height: 1.6; margin: 0 0 20px;">
      We hope ${petName} arrived happy, safe, and wagging! Your support means the world to a small, 
      owner-operated business like ours.
    </p>
    <p style="color: #4B5563; line-height: 1.6; margin: 0 0 28px;">
      If you had a great experience, would you take 30 seconds to leave us a quick Google review? 
      It helps other pet parents find a driver they can trust. 🙏
    </p>

    <div style="text-align: center; margin-bottom: 28px;">
      <a href="${GOOGLE_REVIEW_URL}" 
         style="display: inline-block; background: #1B4332; color: #fff; text-decoration: none; 
                padding: 14px 32px; border-radius: 12px; font-weight: 700; font-size: 15px;">
        ⭐ Leave a Google Review
      </a>
    </div>

    <div style="background: #EDF7F0; border-radius: 12px; padding: 16px; text-align: center;">
      <p style="color: #2D6A4F; margin: 0; font-size: 13px; font-weight: 600;">
        Love our service? Share us with a friend! 🐾
      </p>
      <p style="color: #6B5B4F; margin: 6px 0 0; font-size: 13px;">
        They'll get <strong>$10 off</strong> their first ride — ask them to mention your name at booking.
      </p>
    </div>
  </div>

  <div style="background: #F9F7F3; padding: 20px 32px; text-align: center; border-top: 1px solid #EDF7F0;">
    <p style="color: #9CA3AF; margin: 0; font-size: 12px;">
      ${BUSINESS_NAME} · Chicago, IL · <a href="tel:+17087735958" style="color: #40916C;">${BUSINESS_PHONE}</a>
    </p>
  </div>
</div>
      `.trim();

      await client.integrations.Core.SendEmail({
        to:      trip.owner_email,
        subject: `How did ${petName} do? 🐾 Leave us a quick review!`,
        body:    emailBody,
      });

      await client.entities.Trip.update(trip.id, { review_email_sent: true });
      sent++;
    }

    return Response.json({ checked: trips.length, eligible: eligible.length, sent });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});