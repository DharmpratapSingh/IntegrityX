"""
Create an example PDF loan document for testing IntegrityX upload
"""

try:
    from reportlab.lib.pagesizes import letter
    from reportlab.lib import colors
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
    from reportlab.lib.units import inch
    HAS_REPORTLAB = True
except ImportError:
    HAS_REPORTLAB = False

def create_pdf_with_reportlab():
    """Create PDF using reportlab library"""
    from datetime import datetime
    
    # Create PDF
    pdf_path = "IntegrityX-clean/example_loan_document.pdf"
    doc = SimpleDocTemplate(pdf_path, pagesize=letter)
    story = []
    styles = getSampleStyleSheet()
    
    # Title
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        textColor=colors.HexColor('#1a237e'),
        spaceAfter=30,
        alignment=1  # Center
    )
    story.append(Paragraph("LOAN APPLICATION DOCUMENT", title_style))
    story.append(Spacer(1, 0.3*inch))
    
    # Loan Information
    story.append(Paragraph("Loan Information", styles['Heading2']))
    loan_data = [
        ['Loan ID:', 'LOAN-2024-001'],
        ['Application Date:', '2024-01-15'],
        ['Loan Amount:', '$450,000.00'],
        ['Interest Rate:', '6.5%'],
        ['Loan Term:', '30 years (360 months)'],
        ['Loan Type:', 'Conventional'],
        ['Purpose:', 'Primary Residence Purchase']
    ]
    
    loan_table = Table(loan_data, colWidths=[2*inch, 4*inch])
    loan_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.grey),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
        ('BACKGROUND', (1, 0), (1, -1), colors.beige),
        ('GRID', (0, 0), (-1, -1), 1, colors.black)
    ]))
    story.append(loan_table)
    story.append(Spacer(1, 0.3*inch))
    
    # Borrower Information
    story.append(Paragraph("Borrower Information", styles['Heading2']))
    borrower_data = [
        ['Full Name:', 'John Michael Smith'],
        ['Date of Birth:', '1985-03-15'],
        ['Email:', 'john.smith@email.com'],
        ['Phone:', '(555) 123-4567'],
        ['SSN (Last 4):', '6789']
    ]
    
    borrower_table = Table(borrower_data, colWidths=[2*inch, 4*inch])
    borrower_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.grey),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
        ('BACKGROUND', (1, 0), (1, -1), colors.beige),
        ('GRID', (0, 0), (-1, -1), 1, colors.black)
    ]))
    story.append(borrower_table)
    story.append(Spacer(1, 0.3*inch))
    
    # Address Information
    story.append(Paragraph("Property Address", styles['Heading2']))
    address_text = "123 Main Street<br/>Springfield, IL 62701"
    story.append(Paragraph(address_text, styles['Normal']))
    story.append(Spacer(1, 0.3*inch))
    
    # Employment Information
    story.append(Paragraph("Employment Information", styles['Heading2']))
    employment_data = [
        ['Employer:', 'Tech Solutions Inc'],
        ['Job Title:', 'Software Engineer'],
        ['Employment Status:', 'Employed'],
        ['Annual Income:', '$85,000.00'],
        ['Years Employed:', '5 years']
    ]
    
    emp_table = Table(employment_data, colWidths=[2*inch, 4*inch])
    emp_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.grey),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
        ('BACKGROUND', (1, 0), (1, -1), colors.beige),
        ('GRID', (0, 0), (-1, -1), 1, colors.black)
    ]))
    story.append(emp_table)
    story.append(Spacer(1, 0.3*inch))
    
    # Footer
    story.append(Spacer(1, 0.5*inch))
    footer_text = f"<i>Document generated on {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</i>"
    story.append(Paragraph(footer_text, styles['Normal']))
    
    # Build PDF
    doc.build(story)
    print(f"[SUCCESS] PDF created: {pdf_path}")
    return pdf_path

def create_simple_text_pdf():
    """Create a simple text-based PDF using basic approach"""
    # For now, let's create a simple text file that can be converted
    # or use a minimal PDF approach
    pdf_path = "IntegrityX-clean/example_loan_document.pdf"
    
    # Create a minimal PDF structure
    pdf_content = """%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj
2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj
3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
/Resources <<
/Font <<
/F1 <<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica-Bold
>>
/F2 <<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
>>
>>
>>
>>
endobj
4 0 obj
<<
/Length 200
>>
stream
BT
/F1 24 Tf
100 700 Td
(LOAN APPLICATION DOCUMENT) Tj
0 -30 Td
/F2 12 Tf
(Loan ID: LOAN-2024-001) Tj
0 -20 Td
(Borrower: John Michael Smith) Tj
0 -20 Td
(Loan Amount: $450,000.00) Tj
0 -20 Td
(Interest Rate: 6.5%) Tj
0 -20 Td
(Loan Term: 30 years) Tj
0 -20 Td
(Property: 123 Main Street, Springfield, IL) Tj
ET
endstream
endobj
xref
0 5
0000000000 65535 f
0000000009 00000 n
0000000058 00000 n
0000000115 00000 n
0000000306 00000 n
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
506
%%EOF"""
    
    with open(pdf_path, 'wb') as f:
        f.write(pdf_content.encode('utf-8'))
    
    print(f"[SUCCESS] Simple PDF created: {pdf_path}")
    return pdf_path

if __name__ == "__main__":
    import sys
    
    if HAS_REPORTLAB:
        try:
            create_pdf_with_reportlab()
        except Exception as e:
            print(f"[ERROR] Failed to create PDF with reportlab: {e}")
            print("Trying simple PDF approach...")
            create_simple_text_pdf()
    else:
        print("reportlab not available, creating simple PDF...")
        create_simple_text_pdf()

