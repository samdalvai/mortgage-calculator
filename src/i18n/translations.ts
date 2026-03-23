export type SupportedLanguage = 'en' | 'it' | 'fr' | 'de'

export type Translation = {
  pageTitle: string
  pageSubtitle: string
  languageLabel: string
  summaryTitle: string
  loanPrincipal: string
  monthlyPayment: string
  monthlyRateWithoutBankCost: string
  totalCapitalPaid: string
  totalInterest: string
  totalCapitalAndInterest: string
  totalBankCosts: string
  totalPaid: string
  showPlan: string
  hidePlan: string
  exportPlanAsPdf: string
  archivePlan: string
  archiveSectionTitle: string
  archiveNameLabel: string
  archiveNamePlaceholder: string
  archiveSelectLabel: string
  selectArchivePlaceholder: string
  restoreArchivedPlan: string
  deleteArchivedPlan: string
  noArchivedPlans: string
  archivedOn: (dateLabel: string) => string
  archiveDefaultName: (date: Date) => string
  archiveSavedMessage: (name: string) => string
  archiveRestoredMessage: (name: string) => string
  archiveDeletedMessage: (name: string) => string
  monthWithNumber: (month: number) => string
  payment: string
  principal: string
  interest: string
  bankCost: string
  additionalPayment: string
  remainingCapital: string
  planTotals: string
  capitalPaid: string
  interestPaid: string
  capitalPlusInterest: string
  chartTitle: string
  chartSubtitle: string
  yearLabel: string
  chartReimbursedCapitalLegend: string
  chartRemainingCapitalLegend: string
  chartInterestLegend: string
  houseCost: string
  downPayment: string
  mortgageDurationYears: string
  annualInterestRate: string
  annualInterestRateHint: string
  monthlyBankCost: string
  additionalAnnualPayment: string
  downPaymentExceedsHouseCostError: string
  additionalPaymentExceedsLoanError: string
  additionalPaymentStrategy: string
  shortenDurationStrategy: string
  reduceMonthlyPaymentStrategy: string
  totalAdditionalPayments: string
  interestSaved: string
  durationSaved: string
  pdfTitle: string
  pdfGeneratedBy: string
  pdfHouseCost: string
  pdfDownPayment: string
  pdfDuration: string
  pdfYears: string
  pdfAnnualInterestRate: string
  pdfMonthlyBankCost: string
  pdfAdditionalAnnualPayment: string
  pdfAdditionalPaymentStrategy: string
  pdfTotalAdditionalPayments: string
  pdfInterestSaved: string
  pdfDurationSaved: string
  pdfMonthlyPayment: string
  pdfTotalCapitalPaid: string
  pdfTotalInterestPaid: string
  pdfTotalCapitalAndInterest: string
  pdfTotalPaid: string
  pdfMonthHeader: string
  pdfPaymentHeader: string
  pdfPrincipalHeader: string
  pdfInterestHeader: string
  pdfBankCostHeader: string
  pdfAdditionalPaymentHeader: string
  pdfRemainingCapitalHeader: string
  pdfTotalRow: string
}

export const TRANSLATIONS: Record<SupportedLanguage, Translation> = {
  en: {
    pageTitle: 'Mortgage Calculator (French amortization)',
    pageSubtitle: 'Simulate your mortgage plan in euro. The monthly payment includes bank monthly costs.',
    languageLabel: 'Language',
    summaryTitle: 'Summary',
    loanPrincipal: 'Loan principal',
    monthlyPayment: 'Monthly payment',
    monthlyRateWithoutBankCost: 'Monthly rate (without bank cost)',
    totalCapitalPaid: 'Total capital paid',
    totalInterest: 'Total interest',
    totalCapitalAndInterest: 'Total capital + interest',
    totalBankCosts: 'Total bank costs',
    totalPaid: 'Total paid',
    showPlan: 'Show plan',
    hidePlan: 'Hide plan',
    exportPlanAsPdf: 'Export plan as PDF',
    archivePlan: '🗂️ Archive current plan',
    archiveSectionTitle: 'Archived plans',
    archiveNameLabel: 'Archive name (optional)',
    archiveNamePlaceholder: 'e.g. Family home scenario',
    archiveSelectLabel: 'Saved plans',
    selectArchivePlaceholder: 'Select an archived plan',
    restoreArchivedPlan: 'Restore selected plan',
    deleteArchivedPlan: 'Delete selected plan',
    noArchivedPlans: 'No archived plans yet. Save one to quickly compare scenarios later.',
    archivedOn: (dateLabel: string) => `Archived on ${dateLabel}`,
    archiveDefaultName: (date: Date) =>
      `Plan ${new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short' }).format(date)}`,
    archiveSavedMessage: (name: string) => `Saved "${name}" to your archive.`,
    archiveRestoredMessage: (name: string) => `Restored "${name}".`,
    archiveDeletedMessage: (name: string) => `Deleted "${name}" from your archive.`,
    monthWithNumber: (month: number) => `Month ${month}`,
    payment: 'Payment',
    principal: 'Principal',
    interest: 'Interest',
    bankCost: 'Bank cost',
    additionalPayment: 'Additional payment',
    remainingCapital: 'Remaining capital',
    planTotals: 'Plan totals',
    capitalPaid: 'Capital paid',
    interestPaid: 'Interest paid',
    capitalPlusInterest: 'Capital + interest',
    chartTitle: 'Capital vs interest paid over time',
    chartSubtitle: 'Use the slider to inspect values over time',
    yearLabel: 'Year',
    chartReimbursedCapitalLegend: 'Reimbursed capital',
    chartRemainingCapitalLegend: 'Remaining capital',
    chartInterestLegend: 'Paid interest',
    houseCost: 'House cost (€)',
    downPayment: 'Down payment (€)',
    mortgageDurationYears: 'Mortgage duration (years)',
    annualInterestRate: 'Annual interest rate',
    annualInterestRateHint: 'Default is 3,00%',
    monthlyBankCost: 'Monthly bank cost (€)',
    additionalAnnualPayment: 'Additional annual payment (€)',
    downPaymentExceedsHouseCostError: 'Down payment cannot be higher than house cost.',
    additionalPaymentExceedsLoanError: 'Additional annual payment cannot exceed the loan principal (house cost - down payment).',
    additionalPaymentStrategy: 'Additional payment strategy',
    shortenDurationStrategy: 'Shorten mortgage duration',
    reduceMonthlyPaymentStrategy: 'Reduce monthly payment',
    totalAdditionalPayments: 'Total additional payments',
    interestSaved: 'Interest saved vs no extra payments',
    durationSaved: 'Duration saved',
    pdfTitle: 'Mortgage Plan',
    pdfGeneratedBy: 'Generated by Mortgage Calculator (French amortization)',
    pdfHouseCost: 'House cost',
    pdfDownPayment: 'Down payment',
    pdfDuration: 'Duration',
    pdfYears: 'years',
    pdfAnnualInterestRate: 'Annual interest rate',
    pdfMonthlyBankCost: 'Monthly bank cost',
    pdfAdditionalAnnualPayment: 'Additional annual payment',
    pdfAdditionalPaymentStrategy: 'Additional payment strategy',
    pdfTotalAdditionalPayments: 'Total additional payments',
    pdfInterestSaved: 'Interest saved vs no extra payments',
    pdfDurationSaved: 'Duration saved',
    pdfMonthlyPayment: 'Monthly payment',
    pdfTotalCapitalPaid: 'Total capital paid',
    pdfTotalInterestPaid: 'Total interest paid',
    pdfTotalCapitalAndInterest: 'Total capital + interest',
    pdfTotalPaid: 'Total paid',
    pdfMonthHeader: 'Month',
    pdfPaymentHeader: 'Payment',
    pdfPrincipalHeader: 'Principal',
    pdfInterestHeader: 'Interest',
    pdfBankCostHeader: 'Bank cost',
    pdfAdditionalPaymentHeader: 'Additional payment',
    pdfRemainingCapitalHeader: 'Remaining capital',
    pdfTotalRow: 'TOTAL',
  },
  it: {
    pageTitle: 'Calcolatore Mutuo (Alla Francese)',
    pageSubtitle: 'Simula il piano del tuo mutuo in euro. La rata mensile include i costi bancari mensili.',
    languageLabel: 'Lingua',
    summaryTitle: 'Riepilogo',
    loanPrincipal: 'Capitale finanziato',
    monthlyPayment: 'Rata mensile',
    monthlyRateWithoutBankCost: 'Rata mensile (senza costo banca)',
    totalCapitalPaid: 'Totale capitale pagato',
    totalInterest: 'Totale interessi',
    totalCapitalAndInterest: 'Totale capitale + interessi',
    totalBankCosts: 'Totale costi bancari',
    totalPaid: 'Totale pagato',
    showPlan: 'Mostra piano',
    hidePlan: 'Nascondi piano',
    exportPlanAsPdf: 'Esporta piano in PDF',
    archivePlan: '🗂️ Archivia piano corrente',
    archiveSectionTitle: 'Piani archiviati',
    archiveNameLabel: 'Nome archivio (opzionale)',
    archiveNamePlaceholder: 'es. Scenario casa famiglia',
    archiveSelectLabel: 'Piani salvati',
    selectArchivePlaceholder: 'Seleziona un piano archiviato',
    restoreArchivedPlan: 'Ripristina piano selezionato',
    deleteArchivedPlan: 'Elimina piano selezionato',
    noArchivedPlans: 'Nessun piano archiviato. Salva un piano per confrontare rapidamente gli scenari.',
    archivedOn: (dateLabel: string) => `Archiviato il ${dateLabel}`,
    archiveDefaultName: (date: Date) =>
      `Piano ${new Intl.DateTimeFormat('it-IT', { dateStyle: 'medium', timeStyle: 'short' }).format(date)}`,
    archiveSavedMessage: (name: string) => `"${name}" salvato nell'archivio.`,
    archiveRestoredMessage: (name: string) => `"${name}" ripristinato.`,
    archiveDeletedMessage: (name: string) => `"${name}" eliminato dall'archivio.`,
    monthWithNumber: (month: number) => `Mese ${month}`,
    payment: 'Rata',
    principal: 'Capitale',
    interest: 'Interessi',
    bankCost: 'Costo banca',
    additionalPayment: 'Pagamento extra',
    remainingCapital: 'Capitale residuo',
    planTotals: 'Totali piano',
    capitalPaid: 'Capitale pagato',
    interestPaid: 'Interessi pagati',
    capitalPlusInterest: 'Capitale + interessi',
    chartTitle: 'Capitale vs interessi pagati nel tempo',
    chartSubtitle: 'Usa il cursore per vedere i valori nel tempo',
    yearLabel: 'Anno',
    chartReimbursedCapitalLegend: 'Capitale rimborsato',
    chartRemainingCapitalLegend: 'Capitale residuo',
    chartInterestLegend: 'Interessi pagati',
    houseCost: 'Costo casa (€)',
    downPayment: 'Anticipo (€)',
    mortgageDurationYears: 'Durata mutuo (anni)',
    annualInterestRate: 'Tasso di interesse annuo',
    annualInterestRateHint: 'Valore predefinito 3,00%',
    monthlyBankCost: 'Costo banca mensile (€)',
    additionalAnnualPayment: 'Pagamento annuale extra (€)',
    downPaymentExceedsHouseCostError: "L'anticipo non può essere maggiore del costo casa.",
    additionalPaymentExceedsLoanError:
      'Il pagamento annuale extra non può superare il capitale finanziato (costo casa - anticipo).',
    additionalPaymentStrategy: 'Strategia pagamento extra',
    shortenDurationStrategy: 'Riduci durata mutuo',
    reduceMonthlyPaymentStrategy: 'Riduci rata mensile',
    totalAdditionalPayments: 'Totale pagamenti extra',
    interestSaved: 'Interessi risparmiati vs nessun extra',
    durationSaved: 'Durata risparmiata',
    pdfTitle: 'Piano Mutuo',
    pdfGeneratedBy: 'Generato da Calcolatore Mutuo (Alla Francese)',
    pdfHouseCost: 'Costo casa',
    pdfDownPayment: 'Anticipo',
    pdfDuration: 'Durata',
    pdfYears: 'anni',
    pdfAnnualInterestRate: 'Tasso di interesse annuo',
    pdfMonthlyBankCost: 'Costo banca mensile',
    pdfAdditionalAnnualPayment: 'Pagamento annuale extra',
    pdfAdditionalPaymentStrategy: 'Strategia pagamento extra',
    pdfTotalAdditionalPayments: 'Totale pagamenti extra',
    pdfInterestSaved: 'Interessi risparmiati vs nessun extra',
    pdfDurationSaved: 'Durata risparmiata',
    pdfMonthlyPayment: 'Rata mensile',
    pdfTotalCapitalPaid: 'Totale capitale pagato',
    pdfTotalInterestPaid: 'Totale interessi pagati',
    pdfTotalCapitalAndInterest: 'Totale capitale + interessi',
    pdfTotalPaid: 'Totale pagato',
    pdfMonthHeader: 'Mese',
    pdfPaymentHeader: 'Rata',
    pdfPrincipalHeader: 'Capitale',
    pdfInterestHeader: 'Interessi',
    pdfBankCostHeader: 'Costo banca',
    pdfAdditionalPaymentHeader: 'Pagamento extra',
    pdfRemainingCapitalHeader: 'Capitale residuo',
    pdfTotalRow: 'TOTALE',
  },
  fr: {
    pageTitle: 'Calculateur de Prêt Immobilier (amortissement à la française)',
    pageSubtitle:
      'Simulez votre plan de prêt en euros. La mensualité inclut les frais bancaires mensuels.',
    languageLabel: 'Langue',
    summaryTitle: 'Résumé',
    loanPrincipal: 'Capital emprunté',
    monthlyPayment: 'Mensualité',
    monthlyRateWithoutBankCost: 'Mensualité (hors frais bancaires)',
    totalCapitalPaid: 'Capital total remboursé',
    totalInterest: 'Intérêts totaux',
    totalCapitalAndInterest: 'Total capital + intérêts',
    totalBankCosts: 'Frais bancaires totaux',
    totalPaid: 'Total payé',
    showPlan: 'Afficher le plan',
    hidePlan: 'Masquer le plan',
    exportPlanAsPdf: 'Exporter le plan en PDF',
    archivePlan: '🗂️ Archiver le plan actuel',
    archiveSectionTitle: 'Plans archivés',
    archiveNameLabel: "Nom de l'archive (optionnel)",
    archiveNamePlaceholder: 'ex. Scénario maison familiale',
    archiveSelectLabel: 'Plans sauvegardés',
    selectArchivePlaceholder: 'Sélectionnez un plan archivé',
    restoreArchivedPlan: 'Restaurer le plan sélectionné',
    deleteArchivedPlan: 'Supprimer le plan sélectionné',
    noArchivedPlans: 'Aucun plan archivé pour le moment. Sauvegardez-en un pour comparer rapidement des scénarios.',
    archivedOn: (dateLabel: string) => `Archivé le ${dateLabel}`,
    archiveDefaultName: (date: Date) =>
      `Plan ${new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }).format(date)}`,
    archiveSavedMessage: (name: string) => `"${name}" enregistré dans vos archives.`,
    archiveRestoredMessage: (name: string) => `"${name}" restauré.`,
    archiveDeletedMessage: (name: string) => `"${name}" supprimé des archives.`,
    monthWithNumber: (month: number) => `Mois ${month}`,
    payment: 'Paiement',
    principal: 'Capital',
    interest: 'Intérêt',
    bankCost: 'Frais bancaires',
    additionalPayment: 'Paiement supplémentaire',
    remainingCapital: 'Capital restant',
    planTotals: 'Totaux du plan',
    capitalPaid: 'Capital remboursé',
    interestPaid: 'Intérêts payés',
    capitalPlusInterest: 'Capital + intérêts',
    chartTitle: 'Capital vs intérêts payés au fil du temps',
    chartSubtitle: 'Utilisez le curseur pour inspecter les valeurs dans le temps',
    yearLabel: 'Année',
    chartReimbursedCapitalLegend: 'Capital remboursé',
    chartRemainingCapitalLegend: 'Capital restant',
    chartInterestLegend: 'Intérêts payés',
    houseCost: 'Coût du logement (€)',
    downPayment: 'Apport (€)',
    mortgageDurationYears: 'Durée du prêt (années)',
    annualInterestRate: 'Taux d’intérêt annuel',
    annualInterestRateHint: 'Valeur par défaut : 3,00%',
    monthlyBankCost: 'Frais bancaires mensuels (€)',
    additionalAnnualPayment: 'Paiement annuel supplémentaire (€)',
    downPaymentExceedsHouseCostError: "L'apport ne peut pas être supérieur au coût du logement.",
    additionalPaymentExceedsLoanError:
      "Le paiement annuel supplémentaire ne peut pas dépasser le capital emprunté (coût du logement - apport).",
    additionalPaymentStrategy: 'Stratégie paiement supplémentaire',
    shortenDurationStrategy: 'Réduire la durée du prêt',
    reduceMonthlyPaymentStrategy: 'Réduire la mensualité',
    totalAdditionalPayments: 'Total paiements supplémentaires',
    interestSaved: 'Intérêts économisés vs sans suppléments',
    durationSaved: 'Durée économisée',
    pdfTitle: 'Plan de Prêt',
    pdfGeneratedBy: 'Généré par Calculateur de Prêt Immobilier (amortissement à la française)',
    pdfHouseCost: 'Coût du logement',
    pdfDownPayment: 'Apport',
    pdfDuration: 'Durée',
    pdfYears: 'ans',
    pdfAnnualInterestRate: 'Taux d’intérêt annuel',
    pdfMonthlyBankCost: 'Frais bancaires mensuels',
    pdfAdditionalAnnualPayment: 'Paiement annuel supplémentaire',
    pdfAdditionalPaymentStrategy: 'Stratégie paiement supplémentaire',
    pdfTotalAdditionalPayments: 'Total paiements supplémentaires',
    pdfInterestSaved: 'Intérêts économisés vs sans suppléments',
    pdfDurationSaved: 'Durée économisée',
    pdfMonthlyPayment: 'Mensualité',
    pdfTotalCapitalPaid: 'Capital total remboursé',
    pdfTotalInterestPaid: 'Intérêts totaux payés',
    pdfTotalCapitalAndInterest: 'Total capital + intérêts',
    pdfTotalPaid: 'Total payé',
    pdfMonthHeader: 'Mois',
    pdfPaymentHeader: 'Paiement',
    pdfPrincipalHeader: 'Capital',
    pdfInterestHeader: 'Intérêt',
    pdfBankCostHeader: 'Frais banque',
    pdfAdditionalPaymentHeader: 'Paiement supplémentaire',
    pdfRemainingCapitalHeader: 'Capital restant',
    pdfTotalRow: 'TOTAL',
  },
  de: {
    pageTitle: 'Hypothekenrechner (französische Tilgung)',
    pageSubtitle:
      'Simulieren Sie Ihren Hypothekenplan in Euro. Die monatliche Rate enthält monatliche Bankkosten.',
    languageLabel: 'Sprache',
    summaryTitle: 'Zusammenfassung',
    loanPrincipal: 'Darlehensbetrag',
    monthlyPayment: 'Monatliche Rate',
    monthlyRateWithoutBankCost: 'Monatliche Rate (ohne Bankkosten)',
    totalCapitalPaid: 'Insgesamt gezahltes Kapital',
    totalInterest: 'Gesamtzinsen',
    totalCapitalAndInterest: 'Gesamtes Kapital + Zinsen',
    totalBankCosts: 'Gesamte Bankkosten',
    totalPaid: 'Insgesamt gezahlt',
    showPlan: 'Plan anzeigen',
    hidePlan: 'Plan ausblenden',
    exportPlanAsPdf: 'Plan als PDF exportieren',
    archivePlan: '🗂️ Aktuellen Plan archivieren',
    archiveSectionTitle: 'Archivierte Pläne',
    archiveNameLabel: 'Archivname (optional)',
    archiveNamePlaceholder: 'z. B. Familienszenario',
    archiveSelectLabel: 'Gespeicherte Pläne',
    selectArchivePlaceholder: 'Archivierten Plan auswählen',
    restoreArchivedPlan: 'Ausgewählten Plan wiederherstellen',
    deleteArchivedPlan: 'Ausgewählten Plan löschen',
    noArchivedPlans: 'Noch keine archivierten Pläne. Speichern Sie einen Plan, um Szenarien schnell zu vergleichen.',
    archivedOn: (dateLabel: string) => `Archiviert am ${dateLabel}`,
    archiveDefaultName: (date: Date) =>
      `Plan ${new Intl.DateTimeFormat('de-DE', { dateStyle: 'medium', timeStyle: 'short' }).format(date)}`,
    archiveSavedMessage: (name: string) => `"${name}" wurde im Archiv gespeichert.`,
    archiveRestoredMessage: (name: string) => `"${name}" wurde wiederhergestellt.`,
    archiveDeletedMessage: (name: string) => `"${name}" wurde aus dem Archiv gelöscht.`,
    monthWithNumber: (month: number) => `Monat ${month}`,
    payment: 'Rate',
    principal: 'Kapital',
    interest: 'Zinsen',
    bankCost: 'Bankkosten',
    additionalPayment: 'Zusatzzahlung',
    remainingCapital: 'Restkapital',
    planTotals: 'Plan-Summen',
    capitalPaid: 'Gezahltes Kapital',
    interestPaid: 'Gezahlte Zinsen',
    capitalPlusInterest: 'Kapital + Zinsen',
    chartTitle: 'Gezahltes Kapital vs. Zinsen im Zeitverlauf',
    chartSubtitle: 'Verwenden Sie den Schieberegler, um Werte im Zeitverlauf zu sehen',
    yearLabel: 'Jahr',
    chartReimbursedCapitalLegend: 'Getilgtes Kapital',
    chartRemainingCapitalLegend: 'Restkapital',
    chartInterestLegend: 'Gezahlte Zinsen',
    houseCost: 'Immobilienpreis (€)',
    downPayment: 'Anzahlung (€)',
    mortgageDurationYears: 'Laufzeit (Jahre)',
    annualInterestRate: 'Jährlicher Zinssatz',
    annualInterestRateHint: 'Standardwert ist 3,00%',
    monthlyBankCost: 'Monatliche Bankkosten (€)',
    additionalAnnualPayment: 'Zusätzliche jährliche Zahlung (€)',
    downPaymentExceedsHouseCostError: 'Die Anzahlung darf nicht höher als der Immobilienpreis sein.',
    additionalPaymentExceedsLoanError:
      'Die zusätzliche jährliche Zahlung darf den Darlehensbetrag (Immobilienpreis - Anzahlung) nicht übersteigen.',
    additionalPaymentStrategy: 'Strategie für Zusatzzahlung',
    shortenDurationStrategy: 'Laufzeit verkürzen',
    reduceMonthlyPaymentStrategy: 'Monatsrate senken',
    totalAdditionalPayments: 'Gesamte Zusatzzahlungen',
    interestSaved: 'Gesparte Zinsen vs ohne Zusatzzahlungen',
    durationSaved: 'Gesparte Laufzeit',
    pdfTitle: 'Hypothekenplan',
    pdfGeneratedBy: 'Erstellt von Hypothekenrechner (französische Tilgung)',
    pdfHouseCost: 'Immobilienpreis',
    pdfDownPayment: 'Anzahlung',
    pdfDuration: 'Laufzeit',
    pdfYears: 'Jahre',
    pdfAnnualInterestRate: 'Jährlicher Zinssatz',
    pdfMonthlyBankCost: 'Monatliche Bankkosten',
    pdfAdditionalAnnualPayment: 'Zusätzliche jährliche Zahlung',
    pdfAdditionalPaymentStrategy: 'Strategie für Zusatzzahlung',
    pdfTotalAdditionalPayments: 'Gesamte Zusatzzahlungen',
    pdfInterestSaved: 'Gesparte Zinsen vs ohne Zusatzzahlungen',
    pdfDurationSaved: 'Gesparte Laufzeit',
    pdfMonthlyPayment: 'Monatliche Rate',
    pdfTotalCapitalPaid: 'Insgesamt gezahltes Kapital',
    pdfTotalInterestPaid: 'Insgesamt gezahlte Zinsen',
    pdfTotalCapitalAndInterest: 'Kapital + Zinsen gesamt',
    pdfTotalPaid: 'Insgesamt gezahlt',
    pdfMonthHeader: 'Monat',
    pdfPaymentHeader: 'Rate',
    pdfPrincipalHeader: 'Kapital',
    pdfInterestHeader: 'Zinsen',
    pdfBankCostHeader: 'Bankkosten',
    pdfAdditionalPaymentHeader: 'Zusatzzahlung',
    pdfRemainingCapitalHeader: 'Restkapital',
    pdfTotalRow: 'GESAMT',
  },
}

const SUPPORTED_LANGUAGES: SupportedLanguage[] = ['en', 'it', 'fr', 'de']

export const getBrowserLanguage = (): SupportedLanguage => {
  if (typeof navigator === 'undefined') {
    return 'en'
  }

  const languageCandidates = [...navigator.languages, navigator.language]

  for (const candidate of languageCandidates) {
    const normalized = candidate.toLowerCase().split('-')[0]
    if (SUPPORTED_LANGUAGES.includes(normalized as SupportedLanguage)) {
      return normalized as SupportedLanguage
    }
  }

  return 'en'
}
