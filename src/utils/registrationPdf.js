import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { formatDateTime, getParticipationLabel } from './helpers'

export function createRegistrationPdf(participant) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const left = 40
  const right = 40
  const pageWidth = doc.internal.pageSize.getWidth()
  let y = 42

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.text('Saradha Gangadharan College', left, y)

  y += 16
  doc.setFontSize(12)
  doc.text('Department of Computer Science', left, y)

  y += 20
  doc.setFontSize(14)
  doc.text('College Event Management - Registration Details', left, y)

  y += 20
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  doc.text(`Candidate ID: ${participant.candidateId}`, left, y)
  doc.text(`Status: ${participant.status}`, pageWidth - right, y, { align: 'right' })

  y += 8
  doc.setDrawColor(185, 198, 214)
  doc.line(left, y, pageWidth - right, y)

  autoTable(doc, {
    head: [['Field', 'Value']],
    body: [
      ['Name', participant.name],
      ['College', participant.college],
      ['Phone', participant.phone],
      ['Email', participant.email],
      ['Candidate ID', participant.candidateId],
      ['Status', participant.status],
      ['Registered At', formatDateTime(participant.registeredAt)],
    ],
    startY: y + 12,
    margin: { left, right },
    theme: 'grid',
    headStyles: {
      fillColor: [33, 56, 82],
      textColor: 255,
      fontSize: 10,
    },
    styles: {
      fontSize: 10,
      cellPadding: 6,
    },
    columnStyles: {
      0: { cellWidth: 150, fontStyle: 'bold' },
    },
  })

  const eventRows = participant.registrations.map((registration) => [
    registration.eventName,
    registration.eventType,
    getParticipationLabel(registration),
    registration.teamId || '-',
  ])

  const eventsStartY = doc.lastAutoTable.finalY + 18
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.text('Registered Events', left, eventsStartY)

  autoTable(doc, {
    head: [['Event', 'Type', 'Team / Individual', 'Team ID']],
    body: eventRows,
    startY: eventsStartY + 8,
    margin: { left, right },
    theme: 'grid',
    headStyles: {
      fillColor: [45, 88, 124],
      textColor: 255,
      fontSize: 10,
    },
    styles: {
      fontSize: 10,
      cellPadding: 6,
    },
  })

  return doc
}
