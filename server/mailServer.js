/* global process */
import 'dotenv/config'
import cors from 'cors'
import express from 'express'
import nodemailer from 'nodemailer'

const app = express()
const port = Number(process.env.MAIL_API_PORT || 8787)

app.use(cors({ origin: true }))
app.use(express.json({ limit: '15mb' }))

app.get('/api/health', (_req, res) => {
  res.json({ ok: true })
})

app.post('/api/send-confirmation-email', async (req, res) => {
  const senderEmail = process.env.SMTP_USER || 'computersciencesgc@gmail.com'
  const senderPassword = process.env.SMTP_PASS

  const {
    to,
    candidateId,
    eventName,
    eventDate,
    eventLocation,
    pdfBase64,
    pdfFileName,
  } = req.body ?? {}

  if (!to || !candidateId || !eventName || !eventDate || !eventLocation || !pdfBase64) {
    return res.status(400).json({ ok: false, message: 'Missing required email details.' })
  }

  if (!senderPassword) {
    return res.status(500).json({
      ok: false,
      message: 'SMTP_PASS is not configured. Add SMTP_PASS in your .env file.',
    })
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: senderEmail,
      pass: senderPassword,
    },
  })

  const text = `Dear Candidate,

Thank you for registering for the event organized by the Department of Computer Science.

This email confirms that your registration has been successfully completed. Please find your event details below:

Candidate ID: ${candidateId}
Candidate Name:
Event Name: ${eventName}
Date: ${eventDate}
Location: ${eventLocation}

Please keep this email for your reference. If you have any questions or require further assistance, you may contact the Department of Computer Science.

We look forward to your participation.

Kind regards,
Department of Computer Science`

  try {
    const attachments = [
      {
        filename: pdfFileName || `registration-${candidateId}.pdf`,
        content: pdfBase64,
        encoding: 'base64',
        contentType: 'application/pdf',
      },
    ]

    await transporter.sendMail({
      from: `Department of Computer Science <${senderEmail}>`,
      to,
      subject: 'Event registration confirmation',
      text,
      attachments,
    })

    return res.json({ ok: true, message: 'Confirmation email sent successfully.' })
  } catch (error) {
    const errorMessage = String(error?.message || '')
    const isBadCredential =
      error?.code === 'EAUTH' ||
      error?.responseCode === 535 ||
      /badcredentials|username and password not accepted|invalid login/i.test(errorMessage)

    if (isBadCredential) {
      return res.status(401).json({
        ok: false,
        message:
          'Gmail rejected SMTP login. Use a Gmail App Password (not your normal account password) as SMTP_PASS.',
      })
    }

    return res.status(500).json({
      ok: false,
      message: errorMessage || 'Failed to send confirmation email.',
    })
  }
})

app.listen(port, () => {
  console.log(`Mail server running on http://localhost:${port}`)
})
