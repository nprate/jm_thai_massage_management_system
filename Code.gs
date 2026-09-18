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
 * เริ่มต้นโครงสร้างตารางและสร้างบัญชี Admin เริ่มต้น (หากยังไม่มี)
 */
function initSheetIfNeeded() {
  var sheet = getAdminSheet();
  
  // ตรวจสอบว่ามีข้อมูลในแถวแรกหรือไม่
  var lastRow = sheet.getLastRow();
  var headers = ["ชื่อผู้ใช้", "รหัสผ่าน", "ชื่อเล่น", "ชื่อจริง", "นามสกุล", "วันที่สร้าง", "อัปเดตล่าสุด"];

  if (lastRow === 0) {
    // สร้างหัวตาราง
    sheet.appendRow(headers);
    
    // แต่งสไตล์หัวตาราง (เขียวสปาหรูหรา และตัวอักษรสีขาว)
    var headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setBackground("#1B3B36");
    headerRange.setFontColor("#FFFFFF");
    headerRange.setFontWeight("bold");
    headerRange.setHorizontalAlignment("center");
    headerRange.setVerticalAlignment("middle");
    sheet.setRowHeight(1, 40);
    sheet.setFrozenRows(1);

    // เพิ่มบัญชี Admin เริ่มต้นตามข้อกำหนด: username = 'admin', password = '1234'
    var nowStr = Utilities.formatDate(new Date(), "Asia/Bangkok", "yyyy-MM-dd HH:mm:ss");
    sheet.appendRow(["admin", "1234", "แอดมิน", "ผู้ดูแลระบบ", "JM Thai Massage", nowStr, nowStr]);

    // จัดกึ่งกลางคอลัมน์และปรับขนาดคอลัมน์อัตโนมัติ
    for (var col = 1; col <= headers.length; col++) {
      sheet.autoResizeColumn(col);
    }
  } else {
    // หากมีหัวตารางแล้ว ตรวจสอบว่ามีแถวของ admin หรือยัง
    var data = sheet.getDataRange().getValues();
    var hasAdmin = false;
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][0]).trim().toLowerCase() === "admin") {
        hasAdmin = true;
        break;
      }
    }
    if (!hasAdmin) {
      var nowStr = Utilities.formatDate(new Date(), "Asia/Bangkok", "yyyy-MM-dd HH:mm:ss");
      sheet.appendRow(["admin", "1234", "แอดมิน", "ผู้ดูแลระบบ", "JM Thai Massage", nowStr, nowStr]);
    }
  }
}

/**
 * ตรวจสอบการเข้าสู่ระบบ (Login)
 * @param {string} username
 * @param {string} password
 * @returns {object} ผลการเข้าสู่ระบบและข้อมูลผู้ใช้งาน
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

/**
 * ดึงรายการผู้ดูแลระบบทั้งหมดเพื่อแสดงใน Data Table
 * @returns {object} รายการข้อมูลผู้ดูแลระบบ
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
 * @param {object} userData { username, password, nickname, firstname, lastname }
 * @returns {object} ผลการบันทึก
 */
function addAdminUser(userData) {
  try {
    var sheet = getAdminSheet();
    var username = String(userData.username || "").trim();
    var password = String(userData.password || "").trim();
    var nickname = String(userData.nickname || "").trim();
    var firstname = String(userData.firstname || "").trim();
    var lastname = String(userData.lastname || "").trim();

    // ตรวจสอบเงื่อนไข Required fields (ชื่อผู้ใช้, รหัสผ่าน, ชื่อเล่น)
    if (!username) {
      return { success: false, message: "กรุณากรอก 'ชื่อผู้ใช้'" };
    }
    if (!password) {
      return { success: false, message: "กรุณากรอก 'รหัสผ่าน'" };
    }
    if (!nickname) {
      return { success: false, message: "กรุณากรอก 'ชื่อเล่น'" };
    }

    // ตรวจสอบชื่อผู้ใช้ซ้ำ
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
 * @param {object} userData { username, password, nickname, firstname, lastname }
 * @returns {object} ผลการแก้ไข
 */
function updateAdminUser(userData) {
  try {
    var sheet = getAdminSheet();
    var username = String(userData.username || "").trim();
    var password = String(userData.password || "").trim();
    var nickname = String(userData.nickname || "").trim();
    var firstname = String(userData.firstname || "").trim();
    var lastname = String(userData.lastname || "").trim();

    if (!username) {
      return { success: false, message: "ไม่พบชื่อผู้ใช้ที่ต้องการแก้ไข" };
    }
    if (!nickname) {
      return { success: false, message: "กรุณากรอก 'ชื่อเล่น'" };
    }

    var data = sheet.getDataRange().getValues();
    var targetRowIndex = -1;

    for (var i = 1; i < data.length; i++) {
      if (String(data[i][0]).trim().toLowerCase() === username.toLowerCase()) {
        targetRowIndex = i + 1; // 1-based index in Sheet
        break;
      }
    }

    if (targetRowIndex === -1) {
      return { success: false, message: "ไม่พบข้อมูลผู้ใช้ '" + username + "' ในระบบ" };
    }

    var nowStr = Utilities.formatDate(new Date(), "Asia/Bangkok", "yyyy-MM-dd HH:mm:ss");

    // อัปเดตรหัสผ่านเฉพาะเมื่อมีการกรอกรหัสผ่านใหม่
    if (password) {
      sheet.getRange(targetRowIndex, 2).setValue(password);
    }

    // อัปเดต ชื่อเล่น, ชื่อจริง, นามสกุล, วันที่อัปเดต
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
 * @param {string} username
 * @returns {object} ผลการลบข้อมูล
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
        targetRowIndex = i + 1; // 1-based index
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
