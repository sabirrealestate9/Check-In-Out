const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// Generate checklist PDF
const generateChecklistPDF = (checklistData, tenantData, studioName) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const chunks = [];

      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(chunks);
        resolve(pdfBuffer);
      });

      // Header
      doc.fontSize(24).font('Helvetica-Bold');
      doc.text('Sabir Amin Real Estate LLC SPC', 50, 50);
      
      doc.fontSize(16).font('Helvetica');
      doc.text(`${checklistData.checklist_type === 'check_in' ? 'Check-In' : 'Check-Out'} Report`, 50, 80);

      // Horizontal line
      doc.moveTo(50, 110).lineTo(550, 110).stroke();

      // Tenant Information
      doc.fontSize(14).font('Helvetica-Bold');
      doc.text('Tenant Information', 50, 130);
      
      doc.fontSize(11).font('Helvetica');
      let y = 155;
      
      doc.text(`Full Name: ${tenantData.full_name || 'N/A'}`, 50, y);
      y += 20;
      doc.text(`Passport/ID: ${tenantData.passport_id || 'N/A'}`, 50, y);
      y += 20;
      doc.text(`Contact Number: ${tenantData.contact_number || 'N/A'}`, 50, y);
      y += 20;
      doc.text(`Email: ${tenantData.email || 'N/A'}`, 50, y);
      y += 20;
      doc.text(`Studio: ${studioName || 'N/A'}`, 50, y);
      y += 20;
      doc.text(`Check-In Date: ${tenantData.check_in_date || 'N/A'}`, 50, y);
      y += 20;
      doc.text(`Check-Out Date: ${tenantData.check_out_date || 'N/A'}`, 50, y);
      y += 20;
      doc.text(`Duration: ${tenantData.duration_days || 'N/A'} days`, 50, y);

      // Checklist Details
      y += 40;
      doc.fontSize(14).font('Helvetica-Bold');
      doc.text('Property Condition Checklist', 50, y);
      
      y += 25;
      doc.fontSize(11).font('Helvetica');
      
      const checklistItems = [
        { label: 'Furniture Condition', value: checklistData.furniture_condition },
        { label: 'Appliances Condition', value: checklistData.appliances_condition },
        { label: 'Walls/Paint Condition', value: checklistData.walls_paint_condition },
        { label: 'AC Condition', value: checklistData.ac_condition },
        { label: 'Utilities Status', value: checklistData.utilities_status },
        { label: 'Cleanliness Status', value: checklistData.cleanliness_status },
      ];

      checklistItems.forEach(item => {
        doc.font('Helvetica-Bold').text(`${item.label}:`, 50, y);
        doc.font('Helvetica').text(item.value || 'Not specified', 200, y);
        y += 20;
      });

      // Additional Notes
      if (checklistData.additional_notes) {
        y += 20;
        doc.font('Helvetica-Bold');
        doc.text('Additional Notes:', 50, y);
        y += 20;
        doc.font('Helvetica');
        doc.text(checklistData.additional_notes, 50, y, { width: 500, align: 'left' });
      }

      // Digital Signature
      if (checklistData.digital_signature) {
        y += 60;
        doc.font('Helvetica-Bold');
        doc.text('Digital Signature:', 50, y);
        y += 25;
        
        // Draw signature box
        doc.rect(50, y, 200, 60).stroke();
        
        // Add signature image if available
        try {
          const signatureData = checklistData.digital_signature.replace(/^data:image\/\w+;base64,/, '');
          const signatureBuffer = Buffer.from(signatureData, 'base64');
          doc.image(signatureBuffer, 55, y + 5, { width: 190, height: 50 });
        } catch (e) {
          doc.font('Helvetica').text('[Signature captured]', 60, y + 25);
        }
      }

      // Footer
      doc.fontSize(10).font('Helvetica');
      doc.text(
        `Generated on: ${new Date().toLocaleString()}`,
        50,
        doc.page.height - 50,
        { align: 'center', width: 500 }
      );

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

// Generate tenant details PDF
const generateTenantPDF = (tenantData, studioName) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const chunks = [];

      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(chunks);
        resolve(pdfBuffer);
      });

      // Header
      doc.fontSize(24).font('Helvetica-Bold');
      doc.text('Sabir Amin Real Estate LLC SPC', 50, 50);
      
      doc.fontSize(16).font('Helvetica');
      doc.text('Tenant Details', 50, 80);

      // Horizontal line
      doc.moveTo(50, 110).lineTo(550, 110).stroke();

      // Tenant Information
      doc.fontSize(14).font('Helvetica-Bold');
      doc.text('Personal Information', 50, 130);
      
      doc.fontSize(11).font('Helvetica');
      let y = 155;
      
      const fields = [
        { label: 'Full Name', value: tenantData.full_name },
        { label: 'Passport/ID', value: tenantData.passport_id },
        { label: 'Contact Number', value: tenantData.contact_number },
        { label: 'Email', value: tenantData.email },
        { label: 'Studio', value: studioName },
        { label: 'Check-In Date', value: tenantData.check_in_date },
        { label: 'Check-Out Date', value: tenantData.check_out_date },
        { label: 'Duration', value: `${tenantData.duration_days} days` },
        { label: 'Status', value: tenantData.status },
      ];

      fields.forEach(field => {
        doc.font('Helvetica-Bold').text(`${field.label}:`, 50, y);
        doc.font('Helvetica').text(field.value || 'N/A', 200, y);
        y += 22;
      });

      // Company Policies Section
      y += 30;
      doc.fontSize(14).font('Helvetica-Bold');
      doc.text('Company Policies & Instructions', 50, y);
      
      y += 25;
      doc.fontSize(10).font('Helvetica');
      
      const policies = [
        '1. All tenants must provide valid identification.',
        '2. Check-in time is from 3:00 PM onwards.',
        '3. Check-out time is before 11:00 AM.',
        '4. Any damages must be reported within 24 hours.',
        '5. Smoking is prohibited inside the premises.',
        '6. Pets are not allowed without prior written consent.',
        '7. Noise levels must be kept to a minimum after 10:00 PM.',
        '8. The property must be returned in the same condition as received.',
      ];

      policies.forEach(policy => {
        doc.text(policy, 50, y, { width: 500 });
        y += 18;
      });

      // Footer
      doc.fontSize(10).font('Helvetica');
      doc.text(
        `Document generated on: ${new Date().toLocaleString()}`,
        50,
        doc.page.height - 50,
        { align: 'center', width: 500 }
      );

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

module.exports = {
  generateChecklistPDF,
  generateTenantPDF,
};
