const RECIPIENT = 'sharon@edtechinsiders.org';

function clean(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function escapeHtml(value) {
  return value.replace(/[&<>'"]/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;',
  }[character]));
}

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return response.status(405).json({ error: 'Method not allowed' });
  }

  const body = request.body || {};
  if (clean(body.website)) return response.status(200).json({ ok: true });

  const name = clean(body.name);
  const email = clean(body.email);
  const company = clean(body.company);
  const role = clean(body.role);
  const interest = clean(body.interest);
  const emailIsValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  if (!name || !emailIsValid || !company || !interest) {
    return response.status(400).json({ error: 'Please complete the required fields.' });
  }

  if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM_EMAIL) {
    console.error('Partnership email is not configured.');
    return response.status(503).json({ error: 'Email is temporarily unavailable.' });
  }

  const details = [
    ['Name', name],
    ['Email', email],
    ['Company', company],
    ['Role at company', role || 'Not provided'],
    ['Partnership interest', interest],
  ].map(([label, value]) => `<p><strong>${escapeHtml(label)}:</strong><br>${escapeHtml(value).replace(/\n/g, '<br>')}</p>`).join('');

  try {
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM_EMAIL,
        to: [RECIPIENT],
        reply_to: email,
        subject: `New Edtech Insiders partnership inquiry from ${name}`,
        html: `<h2>New partnership inquiry</h2>${details}`,
      }),
    });

    if (!resendResponse.ok) {
      console.error('Resend request failed with status', resendResponse.status);
      return response.status(502).json({ error: 'Unable to send email.' });
    }

    return response.status(200).json({ ok: true });
  } catch (error) {
    console.error('Partnership email request failed.');
    return response.status(502).json({ error: 'Unable to send email.' });
  }
}
