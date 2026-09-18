/**
 * ==============================================================================
 * ระบบบริหารจัดการร้านนวดแผนไทย (JM Thai Massage Management System)
 * Backend Google Apps Script (Code.gs)
 * ==============================================================================
 */

// ------------------------------------------------------------------------------
// การตั้งค่าระบบ (System Configuration)
// ------------------------------------------------------------------------------
const GOOGLE_SHEET_ID = "1seXuWUYbsSL8VoyDlMj1V9vfuGPQtDoYGwjuGBzOlaU";
const SHEET_NAME_ADMIN = "ข้อมูลผู้ดูแลระบบ";
const SHEET_NAME_CUSTOMER = "ข้อมูลลูกค้า";

/**
 * ให้บริการหน้าเว็บ Web Application (Entry point)
 */
function doGet(e) {
  try {
    // ตรวจสอบและสร้างชีตพร้อมข้อมูลเริ่มต้นหากยังไม่มี
    initSheetIfNeeded();

    var htmlOutput = HtmlService.createTemplateFromFile('index').evaluate();
    htmlOutput.setTitle("JM Thai Massage Management System");
    htmlOutput.addMetaTag('viewport', 'width=device-width, initial-scale=1, shrink-to-fit=no');
    htmlOutput.setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
    return htmlOutput;
  } catch (error) {
    return HtmlService.createHtmlOutput("<h3 style='color:red;font-family:sans-serif;padding:20px;'>เกิดข้อผิดพลาดในการโหลดระบบ: " + error.message + "</h3>");
  }
}

/**
 * ดึงการตั้งค่าระบบส่งกลับไปยัง Frontend
 */
function getSystemSettings() {
  return {
    systemName: "JM Thai Massage Management System",
    systemSubName: "ระบบบริหารจัดการร้านนวดแผนไทย",
    sheetNameAdmin: SHEET_NAME_ADMIN,
    sheetNameCustomer: SHEET_NAME_CUSTOMER,
    googleSheetId: GOOGLE_SHEET_ID
  };
}

/**
 * Helper: ดึง Spreadsheet Object
 */
function getSpreadsheet() {
  try {
    return SpreadsheetApp.openById(GOOGLE_SHEET_ID);
  } catch (err) {
    throw new Error("ไม่สามารถเชื่อมต่อ Google Sheet ได้ กรุณาตรวจสอบสิทธิ์และ Sheet ID: " + err.message);
  }
}

/**
 * Helper: ดึงหรือสร้างชีต "ข้อมูลผู้ดูแลระบบ"
 */
function getAdminSheet() {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME_ADMIN);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME_ADMIN);
  }
  return sheet;
}

/**
 * Helper: ดึงหรือสร้างชีต "ข้อมูลลูกค้า"
 */
function getCustomerSheet() {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME_CUSTOMER);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME_CUSTOMER);
  }
  return sheet;
}

/**
 * เริ่มต้นโครงสร้างตารางและสร้างบัญชี Admin / ชีตลูกค้า เริ่มต้น (หากยังไม่มี)
 */
function initSheetIfNeeded() {
  var nowStr = Utilities.formatDate(new Date(), "Asia/Bangkok", "yyyy-MM-dd HH:mm:ss");

  // 1. ตรวจสอบชีตผู้ดูแลระบบ
  var adminSheet = getAdminSheet();
  var adminLastRow = adminSheet.getLastRow();
  var adminHeaders = ["ชื่อผู้ใช้", "รหัสผ่าน", "ชื่อเล่น", "ชื่อจริง", "นามสกุล", "วันที่สร้าง", "อัปเดตล่าสุด"];

  if (adminLastRow === 0) {
    adminSheet.appendRow(adminHeaders);
    var headerRange = adminSheet.getRange(1, 1, 1, adminHeaders.length);
    headerRange.setBackground("#1B3B36");
    headerRange.setFontColor("#FFFFFF");
    headerRange.setFontWeight("bold");
    headerRange.setHorizontalAlignment("center");
    headerRange.setVerticalAlignment("middle");
    adminSheet.setRowHeight(1, 40);
    adminSheet.setFrozenRows(1);

    // บัญชีเริ่มต้น: username = 'admin', password = '1234'
    adminSheet.appendRow(["admin", "1234", "แอดมิน", "ผู้ดูแลระบบ", "JM Thai Massage", nowStr, nowStr]);

    for (var col = 1; col <= adminHeaders.length; col++) {
      adminSheet.autoResizeColumn(col);
    }
  } else {
    var adminData = adminSheet.getDataRange().getValues();
    var hasAdmin = false;
    for (var i = 1; i < adminData.length; i++) {
      if (String(adminData[i][0]).trim().toLowerCase() === "admin") {
        hasAdmin = true;
        break;
      }
    }
    if (!hasAdmin) {
      adminSheet.appendRow(["admin", "1234", "แอดมิน", "ผู้ดูแลระบบ", "JM Thai Massage", nowStr, nowStr]);
    }
  }

  // 2. ตรวจสอบชีตข้อมูลลูกค้า (Sheet_Name_Customer)
  var customerSheet = getCustomerSheet();
  var customerLastRow = customerSheet.getLastRow();
  var customerHeaders = ["ชื่อเล่น", "ชื่อจริง", "นามสกุล", "เบอร์โทร", "วันที่สร้าง", "อัปเดตล่าสุด"];

  if (customerLastRow === 0) {
    customerSheet.appendRow(customerHeaders);
    var custHeaderRange = customerSheet.getRange(1, 1, 1, customerHeaders.length);
    custHeaderRange.setBackground("#1B3B36");
    custHeaderRange.setFontColor("#FFFFFF");
    custHeaderRange.setFontWeight("bold");
    custHeaderRange.setHorizontalAlignment("center");
    custHeaderRange.setVerticalAlignment("middle");
    customerSheet.setRowHeight(1, 40);
    customerSheet.setFrozenRows(1);

    // เพิ่มข้อมูลลูกค้าตัวอย่างเริ่มต้น
    customerSheet.appendRow(["คุณนิด", "นิตยา", "สุขใจ", "081-234-5678", nowStr, nowStr]);

    for (var c = 1; c <= customerHeaders.length; c++) {
      customerSheet.autoResizeColumn(c);
    }
  }
}

/**
 * ตรวจสอบการเข้าสู่ระบบ (Login)
 */
function loginUser(username, password) {
  try {
    initSheetIfNeeded();
    var sheet = getAdminSheet();
    var data = sheet.getDataRange().getValues();
    
    if (data.length <= 1) {
      return { success: false, message: "ไม่พบข้อมูลผู้ใช้งานในระบบ" };
    }

    var cleanUsername = String(username || "").trim().toLowerCase();
    var cleanPassword = String(password || "").trim();

    for (var i = 1; i < data.length; i++) {
      var rowUser = String(data[i][0] || "").trim().toLowerCase();
      var rowPass = String(data[i][1] || "").trim();
      var nickname = String(data[i][2] || "").trim();
      var firstname = String(data[i][3] || "").trim();
      var lastname = String(data[i][4] || "").trim();

      if (rowUser === cleanUsername) {
        if (rowPass === cleanPassword) {
          return {
            success: true,
            user: {
              username: data[i][0],
              nickname: nickname || data[i][0],
              firstname: firstname,
              lastname: lastname,
              displayName: nickname ? (nickname + (firstname ? " (" + firstname + ")" : "")) : data[i][0]
            }
          };
        } else {
          return { success: false, message: "รหัสผ่านไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง" };
        }
      }
    }

    return { success: false, message: "ไม่พบชื่อผู้ใช้งานนี้ในระบบ" };
  } catch (err) {
    return { success: false, message: "เกิดข้อผิดพลาดในการเข้าสู่ระบบ: " + err.message };
  }
}

// ==============================================================================
// CRUD: ข้อมูลผู้ดูแลระบบ (Admin Management)
// ==============================================================================

/**
 * ดึงรายการผู้ดูแลระบบทั้งหมด
 */
function getAdminUsers() {
  try {
    initSheetIfNeeded();
    var sheet = getAdminSheet();
    var data = sheet.getDataRange().getValues();
    var userList = [];

    if (data.length > 1) {
      for (var i = 1; i < data.length; i++) {
        var username = String(data[i][0] || "").trim();
        if (!username) continue;

        var nickname = String(data[i][2] || "").trim();
        var firstname = String(data[i][3] || "").trim();
        var lastname = String(data[i][4] || "").trim();
        var createdAt = data[i][5] ? formatDateDisplay(data[i][5]) : "-";
        var isSystemAdmin = (username.toLowerCase() === "admin");

        userList.push({
          rowId: i + 1,
          username: username,
          nickname: nickname,
          firstname: firstname,
          lastname: lastname,
          createdAt: createdAt,
          isProtected: isSystemAdmin // แอดมินหลักห้ามลบ
        });
      }
    }

    return {
      success: true,
      sheetName: SHEET_NAME_ADMIN,
      data: userList
    };
  } catch (err) {
    return { success: false, message: "ไม่สามารถดึงข้อมูลได้: " + err.message };
  }
}

/**
 * เพิ่มข้อมูลผู้ดูแลระบบใหม่
 */
function addAdminUser(userData) {
  try {
    var sheet = getAdminSheet();
    var username = String(userData.username || "").trim();
    var password = String(userData.password || "").trim();
    var nickname = String(userData.nickname || "").trim();
    var firstname = String(userData.firstname || "").trim();
    var lastname = String(userData.lastname || "").trim();

    if (!username) return { success: false, message: "กรุณากรอก 'ชื่อผู้ใช้'" };
    if (!password) return { success: false, message: "กรุณากรอก 'รหัสผ่าน'" };
    if (!nickname) return { success: false, message: "กรุณากรอก 'ชื่อเล่น'" };

    var data = sheet.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][0]).trim().toLowerCase() === username.toLowerCase()) {
        return { success: false, message: "ชื่อผู้ใช้ '" + username + "' มีอยู่ในระบบแล้ว กรุณาใช้ชื่ออื่น" };
      }
    }

    var nowStr = Utilities.formatDate(new Date(), "Asia/Bangkok", "yyyy-MM-dd HH:mm:ss");
    sheet.appendRow([username, password, nickname, firstname, lastname, nowStr, nowStr]);

    return {
      success: true,
      message: "เพิ่มข้อมูลผู้ดูแลระบบ '" + username + "' เรียบร้อยแล้ว"
    };
  } catch (err) {
    return { success: false, message: "เกิดข้อผิดพลาดในการเพิ่มข้อมูล: " + err.message };
  }
}

/**
 * แก้ไขข้อมูลผู้ดูแลระบบ
 */
function updateAdminUser(userData) {
  try {
    var sheet = getAdminSheet();
    var username = String(userData.username || "").trim();
    var password = String(userData.password || "").trim();
    var nickname = String(userData.nickname || "").trim();
    var firstname = String(userData.firstname || "").trim();
    var lastname = String(userData.lastname || "").trim();

    if (!username) return { success: false, message: "ไม่พบชื่อผู้ใช้ที่ต้องการแก้ไข" };
    if (!nickname) return { success: false, message: "กรุณากรอก 'ชื่อเล่น'" };

    var data = sheet.getDataRange().getValues();
    var targetRowIndex = -1;

    for (var i = 1; i < data.length; i++) {
      if (String(data[i][0]).trim().toLowerCase() === username.toLowerCase()) {
        targetRowIndex = i + 1;
        break;
      }
    }

    if (targetRowIndex === -1) {
      return { success: false, message: "ไม่พบข้อมูลผู้ใช้ '" + username + "' ในระบบ" };
    }

    var nowStr = Utilities.formatDate(new Date(), "Asia/Bangkok", "yyyy-MM-dd HH:mm:ss");

    if (password) {
      sheet.getRange(targetRowIndex, 2).setValue(password);
    }
    sheet.getRange(targetRowIndex, 3).setValue(nickname);
    sheet.getRange(targetRowIndex, 4).setValue(firstname);
    sheet.getRange(targetRowIndex, 5).setValue(lastname);
    sheet.getRange(targetRowIndex, 7).setValue(nowStr);

    return {
      success: true,
      message: "แก้ไขข้อมูลผู้ดูแลระบบ '" + username + "' เรียบร้อยแล้ว"
    };
  } catch (err) {
    return { success: false, message: "เกิดข้อผิดพลาดในการแก้ไขข้อมูล: " + err.message };
  }
}

/**
 * ลบข้อมูลผู้ดูแลระบบ (ห้ามลบ username = 'admin')
 */
function deleteAdminUser(username) {
  try {
    var cleanUsername = String(username || "").trim();

    // กฎสำคัญ: ห้ามลบ admin เด็ดขาด!
    if (cleanUsername.toLowerCase() === "admin") {
      return {
        success: false,
        message: "ไม่อนุญาตให้ลบผู้ดูแลระบบหลัก (admin) โดยเด็ดขาด"
      };
    }

    var sheet = getAdminSheet();
    var data = sheet.getDataRange().getValues();
    var targetRowIndex = -1;

    for (var i = 1; i < data.length; i++) {
      if (String(data[i][0]).trim().toLowerCase() === cleanUsername.toLowerCase()) {
        targetRowIndex = i + 1;
        break;
      }
    }

    if (targetRowIndex === -1) {
      return { success: false, message: "ไม่พบข้อมูลผู้ใช้ '" + cleanUsername + "' ในระบบ" };
    }

    sheet.deleteRow(targetRowIndex);

    return {
      success: true,
      message: "ลบข้อมูลผู้ดูแลระบบ '" + cleanUsername + "' เรียบร้อยแล้ว"
    };
  } catch (err) {
    return { success: false, message: "เกิดข้อผิดพลาดในการลบข้อมูล: " + err.message };
  }
}

// ==============================================================================
// CRUD: ข้อมูลลูกค้า (Customer Management - Sheet_Name_Customer)
// ฟิลด์: 1.ชื่อเล่น(Req) 2.ชื่อจริง(Opt) 3.นามสกุล(Opt) 4.เบอร์โทร(Req) 5.วันที่สร้าง 6.อัปเดตล่าสุด
// ==============================================================================

/**
 * ดึงรายการข้อมูลลูกค้าทั้งหมดเพื่อแสดงใน Data Table
 */
function getCustomers() {
  try {
    initSheetIfNeeded();
    var sheet = getCustomerSheet();
    var data = sheet.getDataRange().getValues();
    var customerList = [];

    if (data.length > 1) {
      for (var i = 1; i < data.length; i++) {
        var nickname = String(data[i][0] || "").trim();
        var firstname = String(data[i][1] || "").trim();
        var lastname = String(data[i][2] || "").trim();
        var phone = String(data[i][3] || "").trim();
        var createdAt = data[i][4] ? formatDateDisplay(data[i][4]) : "-";
        var updatedAt = data[i][5] ? formatDateDisplay(data[i][5]) : "-";

        // หากแถวว่างเปล่าให้ข้าม
        if (!nickname && !phone) continue;

        customerList.push({
          rowId: i + 1, // 1-based row index in Google Sheet
          nickname: nickname,
          firstname: firstname,
          lastname: lastname,
          phone: phone,
          createdAt: createdAt,
          updatedAt: updatedAt
        });
      }
    }

    return {
      success: true,
      sheetName: SHEET_NAME_CUSTOMER,
      data: customerList
    };
  } catch (err) {
    return { success: false, message: "ไม่สามารถดึงข้อมูลลูกค้าได้: " + err.message };
  }
}

/**
 * เพิ่มข้อมูลลูกค้าใหม่
 * @param {object} customerData { nickname, firstname, lastname, phone }
 */
function addCustomer(customerData) {
  try {
    var sheet = getCustomerSheet();
    var nickname = String(customerData.nickname || "").trim();
    var firstname = String(customerData.firstname || "").trim();
    var lastname = String(customerData.lastname || "").trim();
    var phone = String(customerData.phone || "").trim();

    // ข้อกำหนด 1.1: ชื่อเล่น (เป็น required)
    if (!nickname) {
      return { success: false, message: "กรุณากรอก 'ชื่อเล่น' ของลูกค้า" };
    }
    // ข้อกำหนด 1.4: เบอร์โทร (เป็น required)
    if (!phone) {
      return { success: false, message: "กรุณากรอก 'เบอร์โทร' ของลูกค้า" };
    }

    var nowStr = Utilities.formatDate(new Date(), "Asia/Bangkok", "yyyy-MM-dd HH:mm:ss");

    // ฟิลด์ตามข้อกำหนด: 1.ชื่อเล่น, 2.ชื่อจริง, 3.นามสกุล, 4.เบอร์โทร, 5.วันที่สร้าง, 6.อัปเดตล่าสุด
    sheet.appendRow([nickname, firstname, lastname, phone, nowStr, nowStr]);

    return {
      success: true,
      message: "เพิ่มข้อมูลลูกค้า '" + nickname + "' เรียบร้อยแล้ว"
    };
  } catch (err) {
    return { success: false, message: "เกิดข้อผิดพลาดในการเพิ่มข้อมูลลูกค้า: " + err.message };
  }
}

/**
 * แก้ไขข้อมูลลูกค้า
 * @param {object} customerData { rowId, nickname, firstname, lastname, phone }
 */
function updateCustomer(customerData) {
  try {
    var sheet = getCustomerSheet();
    var rowId = parseInt(customerData.rowId, 10);
    var nickname = String(customerData.nickname || "").trim();
    var firstname = String(customerData.firstname || "").trim();
    var lastname = String(customerData.lastname || "").trim();
    var phone = String(customerData.phone || "").trim();

    if (isNaN(rowId) || rowId < 2 || rowId > sheet.getLastRow()) {
      return { success: false, message: "ไม่พบตำแหน่งข้อมูลลูกค้าที่ต้องการแก้ไข" };
    }

    if (!nickname) {
      return { success: false, message: "กรุณากรอก 'ชื่อเล่น' ของลูกค้า" };
    }
    if (!phone) {
      return { success: false, message: "กรุณากรอก 'เบอร์โทร' ของลูกค้า" };
    }

    var nowStr = Utilities.formatDate(new Date(), "Asia/Bangkok", "yyyy-MM-dd HH:mm:ss");

    sheet.getRange(rowId, 1).setValue(nickname);
    sheet.getRange(rowId, 2).setValue(firstname);
    sheet.getRange(rowId, 3).setValue(lastname);
    sheet.getRange(rowId, 4).setValue(phone);
    sheet.getRange(rowId, 6).setValue(nowStr); // อัปเดตล่าสุด

    return {
      success: true,
      message: "แก้ไขข้อมูลลูกค้า '" + nickname + "' เรียบร้อยแล้ว"
    };
  } catch (err) {
    return { success: false, message: "เกิดข้อผิดพลาดในการแก้ไขข้อมูลลูกค้า: " + err.message };
  }
}

/**
 * ลบข้อมูลลูกค้าตาม rowId
 * @param {number} rowId
 */
function deleteCustomer(rowId) {
  try {
    var sheet = getCustomerSheet();
    var targetRow = parseInt(rowId, 10);

    if (isNaN(targetRow) || targetRow < 2 || targetRow > sheet.getLastRow()) {
      return { success: false, message: "ไม่พบตำแหน่งข้อมูลลูกค้าที่ต้องการลบ" };
    }

    sheet.deleteRow(targetRow);

    return {
      success: true,
      message: "ลบข้อมูลลูกค้าเรียบร้อยแล้ว"
    };
  } catch (err) {
    return { success: false, message: "เกิดข้อผิดพลาดในการลบข้อมูลลูกค้า: " + err.message };
  }
}

/**
 * แปลงรูปแบบวันที่สำหรับแสดงผล
 */
function formatDateDisplay(dateVal) {
  if (!dateVal) return "-";
  try {
    var d = new Date(dateVal);
    if (isNaN(d.getTime())) return String(dateVal);
    return Utilities.formatDate(d, "Asia/Bangkok", "dd/MM/yyyy HH:mm");
  } catch (e) {
    return String(dateVal);
  }
}
