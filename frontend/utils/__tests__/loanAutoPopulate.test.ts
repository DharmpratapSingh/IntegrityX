import { buildAutoPopulateMetadata } from '@/utils/loanAutoPopulate'

describe('buildAutoPopulateMetadata', () => {
  it('maps deeply nested borrower information into the expected metadata shape', () => {
    const input = {
      loan_id: 'UI-LOAN-001',
      document_type: 'loan_application',
      loan_details: {
        loan_amount: 350000,
        loan_term_months: 360,
        interest_rate: 5.75,
        notes: 'Test nested structure',
      },
      property_information: {
        property_address: {
          street: '123 Main St',
          city: 'Chicago',
          state: 'IL',
          zip_code: '60616',
          country: 'US',
        },
      },
      borrower_information: {
        personal_details: {
          full_name: 'Alex Taylor',
          email: 'alex@example.com',
          phone: '+1-312-555-1234',
          date_of_birth: '1985-05-05',
          ssn_last4: '1234',
        },
        identification: {
          id_type: 'passport',
          id_last4: '5678',
        },
        employment: {
          status: 'self_employed',
          employer: 'Taylor Consulting',
          annual_income: 180000,
        },
        address: {
          street: '123 Main St',
          city: 'Chicago',
          state: 'IL',
          zip_code: '60616',
          country: 'US',
        },
      },
    };

    const result = buildAutoPopulateMetadata(input);

    expect(result.loanId).toBe('UI-LOAN-001');
    expect(result.documentType).toBe('loan_application');
    expect(result.loanAmount).toBe('350000');
    expect(result.loanTerm).toBe('360');
    expect(result.interestRate).toBe('5.75');
    expect(result.borrowerName).toBe('Alex Taylor');
    expect(result.borrowerEmail).toBe('alex@example.com');
    expect(result.borrowerPhone).toContain('312');
    expect(result.borrowerStreetAddress).toContain('123 Main');
    expect(result.borrowerCity).toBe('Chicago');
    expect(result.borrowerState).toBe('IL');
    expect(result.borrowerZipCode).toBe('60616');
    expect(result.borrowerCountry).toBe('US');
    expect(result.borrowerSSNLast4).toBe('1234');
    expect(result.borrowerGovernmentIdType).toBe('passport');
    expect(result.borrowerIdNumberLast4).toBe('5678');
    expect(result.borrowerEmploymentStatus).toBe('self_employed');
    expect(result.borrowerAnnualIncome).toBe('180000');
    expect(result.additionalNotes).toBe('Test nested structure');
  });
});
