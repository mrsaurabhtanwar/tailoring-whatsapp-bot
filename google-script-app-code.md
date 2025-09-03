// Google Apps Script for Tailoring Orders Management with Backup
// Instructions:
// 1. Open Google Apps Script (script.google.com)
// 2. Create a new project
// 3. Replace Code.gs content with this code
// 4. Create main Google Sheet with 4 tabs: "Orders", "Shirts", "Pants", "Others"
// 5. Create backup Google Sheet with 4 tabs: "Backup-Orders", "Backup-Shirts", "Backup-Pants", "Backup-Others"
// 6. Replace SPREADSHEET_ID and BACKUP_SPREADSHEET_ID below with your actual sheet IDs
// 7. Deploy as web app with execute permissions set to "Anyone"
// 8. Copy the web app URL for use in HTML form

const SPREADSHEET_ID = '128vwp1tjsej9itNAkQY1Y-5sJsMv3N1TZi5Pl9Wgn6Y'; // Main sheet ID
const BACKUP_SPREADSHEET_ID = '1HSLE-_ro-JeNPcCqa4p6Nw-hWQRGbqZuzQrONdtyDmA'; // Backup sheet ID

// ===== BACKUP CONFIG =====
const BACKUP_SHEETS = {
  'Orders': 'Backup-Orders',
  'Shirts': 'Backup-Shirts', 
  'Pants': 'Backup-Pants',
  'Others': 'Backup-Others'
};

const COPY_HEADER_FROM_SOURCE = true;
const SOURCE_HEADER_ROW_INDEX = 1;

// Main function to handle form submissions
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const result = saveOrderData(data);
    
    return ContentService
      .createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        message: 'Error processing request: ' + error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Handle GET requests (for testing)
function doGet(e) {
  return ContentService
    .createTextOutput('Tailoring Orders API is running')
    .setMimeType(ContentService.MimeType.TEXT);
}

// Save order data to appropriate sheets
function saveOrderData(orderData) {
  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  const orderId = generateOrderId();
  
  try {
    // Save to main Orders sheet
    const ordersRowData = saveToOrdersSheet(spreadsheet, orderData, orderId);
    
    // Save to specific garment sheets based on selection
    const selectedGarments = orderData.garment_type.split(', ');
    let savedSheets = [];
    let allRowsData = [];
    
    // Add orders row data for backup
    allRowsData.push({
      sheetName: 'Orders',
      rowData: ordersRowData
    });
    
    selectedGarments.forEach(garment => {
      switch(garment.toLowerCase()) {
        case 'shirt':
          if (orderData.shirt_selected === '1') {
            const shirtRowData = saveToShirtSheet(spreadsheet, orderData, orderId);
            savedSheets.push('Shirts');
            allRowsData.push({
              sheetName: 'Shirts',
              rowData: shirtRowData
            });
          }
          break;
        case 'pant':
          if (orderData.pant_selected === '1') {
            const pantRowData = saveToPantSheet(spreadsheet, orderData, orderId);
            savedSheets.push('Pants');
            allRowsData.push({
              sheetName: 'Pants',
              rowData: pantRowData
            });
          }
          break;
        case 'other':
          if (orderData.other_selected === '1') {
            const otherRowData = saveToOtherSheet(spreadsheet, orderData, orderId);
            savedSheets.push('Others');
            allRowsData.push({
              sheetName: 'Others',
              rowData: otherRowData
            });
          }
          break;
      }
    });
    
    // Backup all saved data
    try {
      allRowsData.forEach(item => {
        backupAppendRow(item.sheetName, item.rowData);
      });
    } catch (backupError) {
      console.error('Backup error: ' + backupError);
    }
    
    return {
      success: true,
      message: `Order saved successfully! Data added to: Orders, ${savedSheets.join(', ')}`,
      orderId: orderId,
      sheets: ['Orders', ...savedSheets]
    };
    
  } catch (error) {
    return {
      success: false,
      message: 'Error saving data: ' + error.toString()
    };
  }
}

// Generate unique order ID
function generateOrderId() {
  const now = new Date();
  const timestamp = now.getTime().toString().slice(-6);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return 'ORD' + timestamp + random;
}

// Save to main Orders sheet
function saveToOrdersSheet(spreadsheet, data, orderId) {
  const sheet = spreadsheet.getSheetByName('Orders');
  
  // Create headers if sheet is empty
  if (sheet.getLastRow() === 0) {
    const headers = [
      'Order ID', 'Customer Name', 'Contact Info', 'Address', 'Customer Type',
      'Garment Types', 'Order Date', 'Delivery Date', 'Delivery Status',
      'Price', 'Payment Status', 'Season', 'Festival', 'Notes', 'Created At'
    ];
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
  }
  
  const address = data.address || data.customer_address || '';
  
  const rowData = [
    orderId,
    data.customer_name,
    data.contact_info || '',
    address,
    data.customer_type,
    data.garment_type,
    data.order_date,
    data.delivery_date || '',
    data.delivery_status,
    parseFloat(data.price),
    data.payment_status,
    data.season || '',
    data.festival || '',
    data.note || '',
    new Date().toISOString()
  ];
  
  sheet.appendRow(rowData);
  return rowData;
}

// Save to Shirts sheet
function saveToShirtSheet(spreadsheet, data, orderId) {
  const sheet = spreadsheet.getSheetByName('Shirts');
  
  // Create headers if sheet is empty
  if (sheet.getLastRow() === 0) {
    const headers = [
      'Order ID', 'Customer Name', 'Address', 'Order Date', 'Delivery Date',
      'Quantity', 'Fabric Meters', 'Chest', 'Shoulder', 'Sleeve Length',
      'Shirt Length', 'Neck', 'Bicep', 'Bajoo', 'Price', 'Status', 'Notes', 'Created At'
    ];
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
  }
  
  const address = data.address || data.customer_address || '';
  
  const rowData = [
    orderId,
    data.customer_name,
    address,
    data.order_date,
    data.delivery_date || '',
    parseInt(data.shirt_quantity) || 1,
    parseFloat(data.shirt_fabric_meters) || 0,
    parseFloat(data.shirt_chest) || 0,
    parseFloat(data.shirt_shoulder) || 0,
    parseFloat(data.shirt_sleeve) || 0,
    parseFloat(data.shirt_length) || 0,
    parseFloat(data.shirt_neck) || 0,
    parseFloat(data.shirt_bicep) || 0,
    parseFloat(data.shirt_bajoo) || 0,
    parseFloat(data.price),
    data.delivery_status,
    data.note || '',
    new Date().toISOString()
  ];
  
  sheet.appendRow(rowData);
  return rowData;
}

// Save to Pants sheet
function saveToPantSheet(spreadsheet, data, orderId) {
  const sheet = spreadsheet.getSheetByName('Pants');
  
  // Create headers if sheet is empty
  if (sheet.getLastRow() === 0) {
    const headers = [
      'Order ID', 'Customer Name', 'Address', 'Order Date', 'Delivery Date',
      'Quantity', 'Fabric Meters', 'Waist', 'Hip', 'Inseam', 'Outseam',
      'Thigh', 'Knee', 'Bottom', 'Price', 'Status', 'Notes', 'Created At'
    ];
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
  }
  
  const address = data.address || data.customer_address || '';
  
  const rowData = [
    orderId,
    data.customer_name,
    address,
    data.order_date,
    data.delivery_date || '',
    parseInt(data.pant_quantity) || 1,
    parseFloat(data.pant_fabric_meters) || 0,
    parseFloat(data.pant_waist) || 0,
    parseFloat(data.pant_hip) || 0,
    parseFloat(data.pant_inseam) || 0,
    parseFloat(data.pant_outseam) || 0,
    parseFloat(data.pant_thigh) || 0,
    parseFloat(data.pant_knee) || 0,
    parseFloat(data.pant_bottom) || 0,
    parseFloat(data.price),
    data.delivery_status,
    data.note || '',
    new Date().toISOString()
  ];
  
  sheet.appendRow(rowData);
  return rowData;
}

// Save to Others sheet
function saveToOtherSheet(spreadsheet, data, orderId) {
  const sheet = spreadsheet.getSheetByName('Others');
  
  // Create headers if sheet is empty
  if (sheet.getLastRow() === 0) {
    const headers = [
      'Order ID', 'Customer Name', 'Address', 'Order Date', 'Delivery Date',
      'Quantity', 'Fabric Meters', 'Price', 'Status', 'Notes', 'Created At'
    ];
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
  }
  
  const address = data.address || data.customer_address || '';
  
  const rowData = [
    orderId,
    data.customer_name,
    address,
    data.order_date,
    data.delivery_date || '',
    parseInt(data.other_quantity) || 1,
    parseFloat(data.other_fabric_meters) || 0,
    parseFloat(data.price),
    data.delivery_status,
    data.note || '',
    new Date().toISOString()
  ];
  
  sheet.appendRow(rowData);
  return rowData;
}

// Function to get orders data (for display)
function getOrdersData() {
  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = spreadsheet.getSheetByName('Orders');
  
  if (sheet.getLastRow() <= 1) {
    return [];
  }
  
  const data = sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).getValues();
  
  return data.map(row => ({
    orderId: row[0],
    customerName: row[1],
    contactInfo: row[2],
    address: row[3],
    customerType: row[4],
    garmentTypes: row[5],
    orderDate: row[6],
    deliveryDate: row[7],
    deliveryStatus: row[8],
    price: row[9],
    paymentStatus: row[10],
    season: row[11],
    festival: row[12],
    notes: row[13],
    createdAt: row[14]
  }));
}

// ===== BACKUP FUNCTIONS =====

/**
 * Backup a single row to the specified backup sheet
 * @param {string} sourceSheetName - Name of the source sheet ('Orders', 'Shirts', 'Pants', 'Others')
 * @param {Array} rowData - Array of row data to backup
 */
function backupAppendRow(sourceSheetName, rowData) {
  if (!rowData || !Array.isArray(rowData) || rowData.length === 0) return;
  
  try {
    const backupSS = SpreadsheetApp.openById(BACKUP_SPREADSHEET_ID);
    const backupSheetName = BACKUP_SHEETS[sourceSheetName];
    
    if (!backupSheetName) {
      console.error('No backup sheet mapping found for: ' + sourceSheetName);
      return;
    }
    
    let backupSheet = backupSS.getSheetByName(backupSheetName);
    const numCols = rowData.length;

    // Create backup sheet if it doesn't exist
    if (!backupSheet) {
      backupSheet = backupSS.insertSheet(backupSheetName);
      
      if (COPY_HEADER_FROM_SOURCE) {
        try {
          const sourceSS = SpreadsheetApp.openById(SPREADSHEET_ID);
          const sourceSheet = sourceSS.getSheetByName(sourceSheetName);
          
          if (sourceSheet && sourceSheet.getLastRow() >= SOURCE_HEADER_ROW_INDEX) {
            const headerCols = Math.max(numCols, sourceSheet.getLastColumn());
            const headerRange = sourceSheet.getRange(SOURCE_HEADER_ROW_INDEX, 1, 1, headerCols);
            const header = headerRange.getValues();
            
            if (header && header[0] && header[0].length > 0) {
              backupSheet.getRange(1, 1, header.length, header[0].length).setValues(header);
              // Format header
              const headerBackupRange = backupSheet.getRange(1, 1, 1, header[0].length);
              headerBackupRange.setFontWeight('bold');
              headerBackupRange.setBackground('#f0f0f0');
            }
          }
        } catch (hErr) {
          console.log('Header copy skipped for ' + sourceSheetName + ': ' + hErr);
        }
      }
    }

    const destRow = backupSheet.getLastRow() + 1;
    backupSheet.getRange(destRow, 1, 1, numCols).setValues([rowData]);
    console.log(`Backup: appended ${sourceSheetName} data to ${backupSheetName} at row ${destRow}`);
    
  } catch (err) {
    console.error(`Backup error for ${sourceSheetName}: ${err}`);
  }
}

/**
 * Backup multiple rows to the specified backup sheet
 * @param {string} sourceSheetName - Name of the source sheet
 * @param {Array} rowsArray - Array of row data arrays to backup
 */
function backupAppendRows(sourceSheetName, rowsArray) {
  if (!rowsArray || !Array.isArray(rowsArray) || rowsArray.length === 0) return;
  
  try {
    const backupSS = SpreadsheetApp.openById(BACKUP_SPREADSHEET_ID);
    const backupSheetName = BACKUP_SHEETS[sourceSheetName];
    
    if (!backupSheetName) {
      console.error('No backup sheet mapping found for: ' + sourceSheetName);
      return;
    }
    
    let backupSheet = backupSS.getSheetByName(backupSheetName);
    const numCols = rowsArray[0].length;

    // Create backup sheet if it doesn't exist
    if (!backupSheet) {
      backupSheet = backupSS.insertSheet(backupSheetName);
      
      if (COPY_HEADER_FROM_SOURCE) {
        try {
          const sourceSS = SpreadsheetApp.openById(SPREADSHEET_ID);
          const sourceSheet = sourceSS.getSheetByName(sourceSheetName);
          
          if (sourceSheet && sourceSheet.getLastRow() >= SOURCE_HEADER_ROW_INDEX) {
            const headerCols = Math.max(numCols, sourceSheet.getLastColumn());
            const headerRange = sourceSheet.getRange(SOURCE_HEADER_ROW_INDEX, 1, 1, headerCols);
            const header = headerRange.getValues();
            
            if (header && header[0] && header[0].length > 0) {
              backupSheet.getRange(1, 1, header.length, header[0].length).setValues(header);
              // Format header
              const headerBackupRange = backupSheet.getRange(1, 1, 1, header[0].length);
              headerBackupRange.setFontWeight('bold');
              headerBackupRange.setBackground('#f0f0f0');
            }
          }
        } catch (hErr) {
          console.log('Header copy skipped for ' + sourceSheetName + ': ' + hErr);
        }
      }
    }

    const destRow = backupSheet.getLastRow() + 1;
    backupSheet.getRange(destRow, 1, rowsArray.length, numCols).setValues(rowsArray);
    console.log(`Backup: appended ${rowsArray.length} rows from ${sourceSheetName} to ${backupSheetName}`);
    
  } catch (err) {
    console.error(`Backup rows error for ${sourceSheetName}: ${err}`);
  }
}

/**
 * Setup function to initialize both main and backup spreadsheets
 * Run this once to ensure proper sheet structure
 */
function setupSheets() {
  try {
    // Setup main spreadsheet
    const mainSS = SpreadsheetApp.openById(SPREADSHEET_ID);
    const mainSheetNames = ['Orders', 'Shirts', 'Pants', 'Others'];
    
    mainSheetNames.forEach(sheetName => {
      let sheet = mainSS.getSheetByName(sheetName);
      if (!sheet) {
        sheet = mainSS.insertSheet(sheetName);
        console.log(`Created main sheet: ${sheetName}`);
      }
    });
    
    // Setup backup spreadsheet
    const backupSS = SpreadsheetApp.openById(BACKUP_SPREADSHEET_ID);
    const backupSheetNames = Object.values(BACKUP_SHEETS);
    
    backupSheetNames.forEach(sheetName => {
      let sheet = backupSS.getSheetByName(sheetName);
      if (!sheet) {
        sheet = backupSS.insertSheet(sheetName);
        console.log(`Created backup sheet: ${sheetName}`);
      }
    });
    
    return 'Setup completed successfully! All main and backup sheets are ready.';
    
  } catch (error) {
    console.error('Setup error: ' + error);
    return 'Setup error: ' + error.toString();
  }
}

/**
 * Test function to validate connections to both spreadsheets
 */
function testConnections() {
  try {
    // Test main spreadsheet
    const mainSS = SpreadsheetApp.openById(SPREADSHEET_ID);
    const mainSheets = mainSS.getSheets().map(sheet => sheet.getName());
    
    // Test backup spreadsheet  
    const backupSS = SpreadsheetApp.openById(BACKUP_SPREADSHEET_ID);
    const backupSheets = backupSS.getSheets().map(sheet => sheet.getName());
    
    return {
      success: true,
      message: 'Connection test successful!',
      mainSheets: mainSheets,
      backupSheets: backupSheets
    };
    
  } catch (error) {
    return {
      success: false,
      message: 'Connection test failed: ' + error.toString()
    };
  }
}




function onEdit(e) {
  const range = e.range;
  const sheet = e.source.getActiveSheet();
  
  // Check if Status column (F) was edited
  if (range.getColumn() === 6 && range.getValue() === 'Ready') {
    const row = range.getRow();
    const notified = sheet.getRange(row, 7).getValue(); // Column G
    
    if (notified !== 'Yes') {
      const customerData = {
        name: sheet.getRange(row, 1).getValue(),
        phone: sheet.getRange(row, 2).getValue(),
        item: sheet.getRange(row, 3).getValue(),
        orderDate: sheet.getRange(row, 4).getValue(),
        dueDate: sheet.getRange(row, 5).getValue()
      };
      
      // Send to your Render webhook
      sendToWhatsApp(customerData, row);
    }
  }
}

function sendToWhatsApp(customerData, row) {
  const webhookUrl = 'https://tailoring-whatsapp-bot.onrender.com/webhook/order-ready';
  
  const payload = {
    ...customerData,
    row: row // To mark as notified later
  };
  
  const options = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    payload: JSON.stringify(payload)
  };
  
  try {
    const response = UrlFetchApp.fetch(webhookUrl, options);
    console.log('WhatsApp API Response:', response.getContentText());
    // Mark as notified
    SpreadsheetApp.getActiveSheet().getRange(row, 7).setValue('Yes');
  } catch (error) {
    console.log('Error sending to WhatsApp:', error);
  }
}



// ===== DEPLOYMENT INSTRUCTIONS =====
/*
SETUP STEPS:
1. Create two Google Sheets:
   - Main Sheet with tabs: "Orders", "Shirts", "Pants", "Others"  
   - Backup Sheet with tabs: "Backup-Orders", "Backup-Shirts", "Backup-Pants", "Backup-Others"

2. Replace the IDs above:
   - SPREADSHEET_ID: Main sheet ID
   - BACKUP_SPREADSHEET_ID: Backup sheet ID

3. Run setupSheets() function once to initialize

4. Deploy as web app:
   - Execute as: Me
   - Access: Anyone (or Anyone with Google account)

5. Test with testConnections() function

6. Use the web app URL in your HTML forms
*/