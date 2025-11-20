// Quick test script for PDF generation
// Run: node test-pdf.js

const invoiceId = 'ABoWQDdR8RAj6UB4InXI'; // From your logs

async function testPDF() {
  try {
    console.log(`Testing PDF generation for invoice: ${invoiceId}`);
    console.log(`URL: http://localhost:3000/api/pdf/invoice/${invoiceId}`);
    
    const response = await fetch(`http://localhost:3000/api/pdf/invoice/${invoiceId}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error:', response.status, errorText);
      return;
    }
    
    const blob = await response.blob();
    console.log('✅ PDF generated successfully!');
    console.log(`📄 Size: ${blob.size} bytes`);
    console.log(`📄 Type: ${blob.type}`);
    
    // Save to file
    const fs = require('fs');
    const buffer = Buffer.from(await blob.arrayBuffer());
    fs.writeFileSync('test-invoice.pdf', buffer);
    console.log('💾 Saved to test-invoice.pdf');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testPDF();

