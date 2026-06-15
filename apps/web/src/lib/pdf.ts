import { createMortgagePlanPdfDocument, type MortgagePlanPdfParams } from '../../../../packages/core/src'

export const downloadMortgagePlanPdf = (params: MortgagePlanPdfParams) => {
  const pdfDocument = createMortgagePlanPdfDocument(params)
  const pdfBlob = new Blob([pdfDocument], { type: 'application/pdf' })
  const pdfDownloadUrl = URL.createObjectURL(pdfBlob)
  const linkElement = document.createElement('a')
  linkElement.href = pdfDownloadUrl
  linkElement.download = `mortgage-plan-${new Date().toISOString().slice(0, 10)}.pdf`
  linkElement.click()
  URL.revokeObjectURL(pdfDownloadUrl)
}
