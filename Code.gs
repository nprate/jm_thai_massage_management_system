/**
 * ==============================================================================
 * ระบบบริหารจัดการข้อมูลร้านนวดแผนไทยเจเอ็ม (JM Thai Massage Management System)
 * Backend Google Apps Script (Code.gs)
 *
 * กฎการแสดงผลและสถานะการจอง:
 * 1. รอบเวลาที่เปิดรับจองได้ (โควต้า 0/5 - 4/5): แสดงป้าย "จองได้" ตัวหนังสือสีขาว (ตัวหนา bold) บน badge สีฟ้า
 * 2. รอบเวลาที่ครบโควต้า (5/5): แสดงป้าย "เต็ม" ไอคอนคนสีแดง
 * 3. รอบเวลาที่เลยกำหนด (เวลาปัจจุบัน >= เวลาเริ่มรอบ + 20 นาที): ปิดรับจอง (ไอคอนนาฬิกาสีแดง ตัวหนังสือสีแดง)
 * 4. หน้าต่าง Modal (รายละเอียดรอบเวลาและฟอร์มจอง): แสดงจำนวนโควต้าตัวเลขอย่างละเอียดตามเดิม (ว่าง (0/5) ถึง ว่าง (4/5))
 * ==============================================================================
 */

// ------------------------------------------------------------------------------
// การตั้งค่าระบบ (System Configuration)
// ------------------------------------------------------------------------------
const GOOGLE_SHEET_ID = "1seXuWUYbsSL8VoyDlMj1V9vfuGPQtDoYGwjuGBzOlaU";
const SHEET_NAME_ADMIN = "ข้อมูลผู้ดูแลระบบ";
const SHEET_NAME_CUSTOMER = "ข้อมูลลูกค้า";
const SHEET_NAME_RESERVATION = "ข้อมูลการจอง";
const SHEET_NAME_SETTING_TIME = "ตั้งค่าตัวเลือกเวลาการจอง";

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
    systemSubName: "ระบบบริหารจัดการข้อมูลร้านนวดแผนไทยเจเอ็ม",
    sheetNameAdmin: SHEET_NAME_ADMIN,
    sheetNameCustomer: SHEET_NAME_CUSTOMER,
    sheetNameReservation: SHEET_NAME_RESERVATION,
    sheetNameSettingTime: SHEET_NAME_SETTING_TIME,
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
 * Helper: ดึงหรือสร้างชีต "ข้อมูลการจอง" (Sheet_Name_Reservation)
 */
function getReservationSheet() {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME_RESERVATION);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME_RESERVATION);
  }
  return sheet;
}

/**
 * Helper: ดึงหรือสร้างชีต "ตั้งค่าตัวเลือกเวลาการจอง" (Sheet_Name_Setting_Selection_Reservation_Time)
 */
function getSettingTimeSheet() {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME_SETTING_TIME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME_SETTING_TIME);
  }
  return sheet;
}

/**
 * เริ่มต้นโครงสร้างตารางและสร้างบัญชี Admin / ชีตลูกค้า / ชีตเวลา / ชีตการจอง เริ่มต้น (หากยังไม่มี)
 */
function initSheetIfNeeded() {
  var nowStr = Utilities.formatDate(new Date(), "Asia/Bangkok", "yyyy-MM-dd HH:mm:ss");

  // 1. ตรวจสอบชีตผู้ดูแลระบบ (Schema 12 คอลัมน์)
  var adminSheet = getAdminSheet();
  var adminLastRow = adminSheet.getLastRow();
  var adminHeaders = [
    "username",     // 1. ชื่อผู้ใช้
    "pwd",          // 2. รหัสผ่าน
    "nick_name",    // 3. ชื่อเล่น
    "first_name",   // 4. ชื่อจริง
    "last_name",    // 5. นามสกุล
    "create_date",  // 6. วันที่สร้าง
    "created_by",   // 7. ผู้สร้าง
    "update_date",  // 8. อัปเดตล่าสุด
    "updated_by",   // 9. ผู้อัปเดต
    "is_active",    // 10. สถานะการใช้งาน (true/false)
    "person_flag",  // 11. ประเภทผู้ใช้ (8: ผู้ดูแลระบบ, 9: ผู้ดูแลระบบสูงสุด)
    "deleted_flag"  // 12. สถานะการลบ (N: ใช้งานได้, Y: ถูกลบ)
  ];

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

    // บัญชีเริ่มต้น: username = 'admin', password = '1234', person_flag = 9 (ผู้ดูแลระบบสูงสุด)
    adminSheet.appendRow(["admin", "1234", "แอดมิน", "ผู้ดูแลระบบสูงสุด", "JM Thai Massage", nowStr, "admin", nowStr, "admin", true, 9, "N"]);

    for (var col = 1; col <= adminHeaders.length; col++) {
      adminSheet.autoResizeColumn(col);
    }
  } else {
    // ตรวจสอบและ Auto-Migrate หากเป็น Schema เดิม
    var adminData = adminSheet.getDataRange().getValues();
    var firstColName = String(adminData[0][0] || "").trim();
    var headerLen = adminData[0].length;

    if (firstColName === "ชื่อผู้ใช้" || headerLen < 12) {
      // อัปเดต Header แถวที่ 1 ให้เป็น 12 คอลัมน์ใหม่
      adminSheet.getRange(1, 1, 1, adminHeaders.length).setValues([adminHeaders]);
      var hRange = adminSheet.getRange(1, 1, 1, adminHeaders.length);
      hRange.setBackground("#1B3B36");
      hRange.setFontColor("#FFFFFF");
      hRange.setFontWeight("bold");
      hRange.setHorizontalAlignment("center");
      hRange.setVerticalAlignment("middle");

      // เติมข้อมูลคอลัมน์ใหม่ให้กับแถวข้อมูลเดิมที่มีอยู่
      for (var r = 1; r < adminData.length; r++) {
        var rowNum = r + 1;
        var rUser = String(adminData[r][0] || "admin").trim();
        var cBy = String(adminData[r][6] || "").trim() || rUser;
        var uBy = String(adminData[r][8] || "").trim() || rUser;
        var isAct = (adminData[r][9] === false || String(adminData[r][9]).toLowerCase() === "false") ? false : true;
        var pFlag = parseInt(adminData[r][10], 10) || (rUser.toLowerCase() === "admin" ? 9 : 8);
        var dFlag = String(adminData[r][11] || "").trim() || "N";

        adminSheet.getRange(rowNum, 7).setValue(cBy);
        adminSheet.getRange(rowNum, 9).setValue(uBy);
        adminSheet.getRange(rowNum, 10).setValue(isAct);
        adminSheet.getRange(rowNum, 11).setValue(pFlag);
        adminSheet.getRange(rowNum, 12).setValue(dFlag);
      }
    }

    var hasAdmin = false;
    for (var i = 1; i < adminData.length; i++) {
      if (String(adminData[i][0]).trim().toLowerCase() === "admin") {
        hasAdmin = true;
        break;
      }
    }
    if (!hasAdmin) {
      adminSheet.appendRow(["admin", "1234", "แอดมิน", "ผู้ดูแลระบบ", "JM Thai Massage", nowStr, "admin", nowStr, "admin", true, 9, "N"]);
    }
  }

  // 2. ตรวจสอบชีตข้อมูลลูกค้า (Sheet_Name_Customer)
  var customerSheet = getCustomerSheet();
  var customerLastRow = customerSheet.getLastRow();
  var customerHeaders = ["รหัสลูกค้า", "ชื่อเล่น", "ชื่อจริง", "นามสกุล", "เบอร์โทร", "วันที่สร้าง", "อัปเดตล่าสุด"];

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

    // เพิ่มข้อมูลลูกค้าตัวอย่างเริ่มต้น พร้อมรหัส JM0001
    customerSheet.appendRow(["JM0001", "คุณนิด", "นิตยา", "สุขใจ", "081-234-5678", nowStr, nowStr]);

    for (var c = 1; c <= customerHeaders.length; c++) {
      customerSheet.autoResizeColumn(c);
    }
  } else {
    // กรณีมีข้อมูลอยู่แล้ว แต่ยังไม่มีคอลัมน์ "รหัสลูกค้า" ในคอลัมน์แรก (Auto-migration)
    var firstHeader = String(customerSheet.getRange(1, 1).getValue() || "").trim();
    if (firstHeader !== "รหัสลูกค้า") {
      customerSheet.insertColumnBefore(1);
      customerSheet.getRange(1, 1).setValue("รหัสลูกค้า");
      customerSheet.getRange(1, 1)
        .setBackground("#1B3B36")
        .setFontColor("#FFFFFF")
        .setFontWeight("bold")
        .setHorizontalAlignment("center")
        .setVerticalAlignment("middle");
      customerSheet.setRowHeight(1, 40);

      // สร้างรหัสลูกค้าเริ่มต้น (JM0001, JM0002, ...) ให้กับข้อมูลแถวเดิมที่มีอยู่
      var totalRows = customerSheet.getLastRow();
      var count = 1;
      for (var r = 2; r <= totalRows; r++) {
        var existingVal = customerSheet.getRange(r, 1).getValue();
        if (!existingVal) {
          var codeStr = "JM" + ("0000" + count).slice(-4);
          customerSheet.getRange(r, 1).setValue(codeStr);
          count++;
        }
      }
      customerSheet.autoResizeColumn(1);
    }
  }

  // 3. ตรวจสอบชีต "ตั้งค่าตัวเลือกเวลาการจอง" (Sheet_Name_Setting_Selection_Reservation_Time)
  // ฟิลด์: 2.1.1.4.1 เวลาที่จอง, 2.1.1.4.2 วันที่สร้าง, 2.1.1.4.3 วันที่อัปเดต
  var timeSheet = getSettingTimeSheet();
  var timeLastRow = timeSheet.getLastRow();
  var timeHeaders = ["เวลาที่จอง", "วันที่สร้าง", "วันที่อัปเดต"];

  if (timeLastRow === 0) {
    timeSheet.appendRow(timeHeaders);
    var timeHeaderRange = timeSheet.getRange(1, 1, 1, timeHeaders.length);
    timeHeaderRange.setBackground("#1B3B36");
    timeHeaderRange.setFontColor("#FFFFFF");
    timeHeaderRange.setFontWeight("bold");
    timeHeaderRange.setHorizontalAlignment("center");
    timeHeaderRange.setVerticalAlignment("middle");
    timeSheet.setRowHeight(1, 40);
    timeSheet.setFrozenRows(1);

    // ตัวเลือกช่วงเวลาบริการมาตรฐานของร้านนวด
    var defaultTimes = ["10:00", "11:30", "13:00", "14:30", "16:00", "17:30", "19:00", "20:30"];
    for (var t = 0; t < defaultTimes.length; t++) {
      timeSheet.appendRow([defaultTimes[t], nowStr, nowStr]);
    }

    try {
      timeSheet.getRange("A:A").setNumberFormat("@");
    } catch (e) {}

    for (var tc = 1; tc <= timeHeaders.length; tc++) {
      timeSheet.autoResizeColumn(tc);
    }
  } else {
    try {
      timeSheet.getRange("A:A").setNumberFormat("@");
    } catch (e) {}
  }

  // 4. ตรวจสอบชีต "ข้อมูลการจอง" (Sheet_Name_Reservation)
  // ฟิลด์: 2.1.1.1 รหัสการจอง, 2.1.1.2 รหัสลูกค้า, 2.1.1.3 วันที่ที่จอง, 2.1.1.4 เวลาที่จอง, 2.1.1.5 สถานะการจอง, 2.1.1.6 วันที่สร้าง, 2.1.1.7 อัปเดตล่าสุด
  var resSheet = getReservationSheet();
  var resLastRow = resSheet.getLastRow();
  var resHeaders = ["รหัสการจอง", "รหัสลูกค้า", "วันที่ที่จอง", "เวลาที่จอง", "สถานะการจอง", "วันที่สร้าง", "อัปเดตล่าสุด"];

  if (resLastRow === 0) {
    resSheet.appendRow(resHeaders);
    var resHeaderRange = resSheet.getRange(1, 1, 1, resHeaders.length);
    resHeaderRange.setBackground("#1B3B36");
    resHeaderRange.setFontColor("#FFFFFF");
    resHeaderRange.setFontWeight("bold");
    resHeaderRange.setHorizontalAlignment("center");
    resHeaderRange.setVerticalAlignment("middle");
    resSheet.setRowHeight(1, 40);
    resSheet.setFrozenRows(1);

    // ข้อมูลตัวอย่างการจองเพื่อแสดงผลทันที
    var todayStr = Utilities.formatDate(new Date(), "Asia/Bangkok", "yyyy-MM-dd");
    resSheet.appendRow(["BK0001", "JM0001", todayStr, "17:30", "ยืนยันแล้ว", nowStr, nowStr]);

    try {
      resSheet.getRange("D:D").setNumberFormat("@");
    } catch (e) {}

    for (var rc = 1; rc <= resHeaders.length; rc++) {
      resSheet.autoResizeColumn(rc);
    }
  } else {
    try {
      resSheet.getRange("D:D").setNumberFormat("@");
    } catch (e) {}
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
      var isActiveVal = data[i][9];
      var personFlag = parseInt(data[i][10], 10) || (rowUser === "admin" ? 9 : 8);
      var roleTitle = (personFlag === 9) ? "ผู้ดูแลระบบสูงสุด" : "ผู้ดูแลระบบ";
      var deletedFlag = String(data[i][11] || "N").trim().toUpperCase();

      if (rowUser === cleanUsername) {
        // ตรวจสอบ Soft Delete (ถูกลบหรือไม่)
        if (deletedFlag === "Y") {
          return { success: false, message: "บัญชีผู้ใช้นี้ถูกลบหรือระงับการใช้งานแล้ว" };
        }

        // ตรวจสอบสถานะการเปิด/ปิดใช้งาน (is_active)
        if (isActiveVal === false || String(isActiveVal).toLowerCase() === "false") {
          return { success: false, message: "บัญชีผู้ใช้นี้ถูกปิดการใช้งาน กรุณาติดต่อผู้ดูแลระบบ" };
        }

        if (rowPass === cleanPassword) {
          return {
            success: true,
            user: {
              username: data[i][0],
              nickname: nickname || data[i][0],
              firstname: firstname,
              lastname: lastname,
              personFlag: personFlag,
              roleTitle: roleTitle,
              isActive: true,
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
 * ค้นหาข้อมูลผู้ดูแลระบบตาม username
 */
function getAdminRecord(username) {
  try {
    var sheet = getAdminSheet();
    var data = sheet.getDataRange().getValues();
    var cleanUser = String(username || "").trim().toLowerCase();
    if (!cleanUser) return null;

    for (var i = 1; i < data.length; i++) {
      var rowUser = String(data[i][0] || "").trim().toLowerCase();
      if (rowUser === cleanUser) {
        return {
          rowIndex: i + 1,
          username: String(data[i][0] || "").trim(),
          password: String(data[i][1] || "").trim(),
          nickname: String(data[i][2] || "").trim(),
          firstname: String(data[i][3] || "").trim(),
          lastname: String(data[i][4] || "").trim(),
          createdAt: data[i][5],
          createdBy: String(data[i][6] || "").trim(),
          updatedAt: data[i][7],
          updatedBy: String(data[i][8] || "").trim(),
          isActive: (data[i][9] === false || String(data[i][9]).toLowerCase() === "false") ? false : true,
          personFlag: parseInt(data[i][10], 10) || (cleanUser === "admin" ? 9 : 8),
          deletedFlag: String(data[i][11] || "N").trim().toUpperCase()
        };
      }
    }
    return null;
  } catch (e) {
    return null;
  }
}

/**
 * ดึงรายการผู้ดูแลระบบ
 * - ผู้ดูแลระบบสูงสุด (person_flag = 9 หรือ admin): มองเห็นผู้ดูแลระบบทุกคน (ที่ deleted_flag !== 'Y')
 * - ผู้ดูแลระบบ (person_flag = 8): มองเห็นเฉพาะข้อมูลของตนเองเท่านั้น ไม่แสดงข้อมูลของคนอื่น
 */
function getAdminUsers(requesterUsername) {
  try {
    initSheetIfNeeded();
    var sheet = getAdminSheet();
    var data = sheet.getDataRange().getValues();
    var userList = [];

    // ตรวจสอบสิทธิ์ผู้ขอข้อมูล (requester)
    var cleanRequester = String(requesterUsername || "").trim().toLowerCase();
    var requesterFlag = 9; // ค่าเริ่มต้นถ้าไม่ได้ส่งมา หรือเป็นระบบ
    if (cleanRequester) {
      for (var k = 1; k < data.length; k++) {
        if (String(data[k][0] || "").trim().toLowerCase() === cleanRequester) {
          requesterFlag = parseInt(data[k][10], 10) || (cleanRequester === "admin" ? 9 : 8);
          break;
        }
      }
    }

    if (data.length > 1) {
      for (var i = 1; i < data.length; i++) {
        var username = String(data[i][0] || "").trim();
        if (!username) continue;

        var deletedFlag = String(data[i][11] || "N").trim().toUpperCase();
        // เงื่อนไข Soft Delete: ถ้าถูกลบ (Y) จะไม่แสดงผลในหน้ารายการ
        if (deletedFlag === "Y") continue;

        // ถ้าผู้ขอข้อมูลเป็น ผู้ดูแลระบบ (person_flag = 8): แสดงเฉพาะข้อมูลของตนเองเท่านั้น
        if (cleanRequester && requesterFlag === 8 && username.toLowerCase() !== cleanRequester) {
          continue;
        }

        var nickname = String(data[i][2] || "").trim();
        var firstname = String(data[i][3] || "").trim();
        var lastname = String(data[i][4] || "").trim();
        var createdAt = data[i][5] ? formatDateDisplay(data[i][5]) : "-";
        var createdBy = String(data[i][6] || "").trim() || username;
        var updatedAt = data[i][7] ? formatDateDisplay(data[i][7]) : "-";
        var updatedBy = String(data[i][8] || "").trim() || username;
        var isActive = (data[i][9] === false || String(data[i][9]).toLowerCase() === "false") ? false : true;
        var personFlag = parseInt(data[i][10], 10) || (username.toLowerCase() === "admin" ? 9 : 8);
        var roleTitle = (personFlag === 9) ? "ผู้ดูแลระบบสูงสุด" : "ผู้ดูแลระบบ";
        var isSystemAdmin = (username.toLowerCase() === "admin");

        userList.push({
          rowId: i + 1,
          username: username,
          nickname: nickname,
          firstname: firstname,
          lastname: lastname,
          createdAt: createdAt,
          createdBy: createdBy,
          updatedAt: updatedAt,
          updatedBy: updatedBy,
          isActive: isActive,
          personFlag: personFlag,
          roleTitle: roleTitle,
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
 * - เฉพาะผู้ดูแลระบบสูงสุด (person_flag = 9) เท่านั้นที่สามารถเพิ่มข้อมูลได้
 */
function addAdminUser(userData) {
  try {
    var sheet = getAdminSheet();
    var username = String(userData.username || "").trim();
    var password = String(userData.password || "").trim();
    var nickname = String(userData.nickname || "").trim();
    var firstname = String(userData.firstname || "").trim();
    var lastname = String(userData.lastname || "").trim();
    var createdBy = String(userData.createdBy || userData.username || "").trim() || username;
    var isActive = (userData.isActive === false || String(userData.isActive) === "false") ? false : true;

    // ตรวจสอบสิทธิ์ผู้สร้าง: เฉพาะผู้ดูแลระบบสูงสุด (person_flag = 9 หรือ admin) เท่านั้น
    var creatorRecord = getAdminRecord(createdBy);
    if (creatorRecord && creatorRecord.personFlag !== 9 && createdBy.toLowerCase() !== "admin") {
      return { success: false, message: "ไม่มีสิทธิ์เพิ่มข้อมูลผู้ดูแลระบบ (เฉพาะผู้ดูแลระบบสูงสุดเท่านั้น)" };
    }

    // กำหนด personFlag (8: ผู้ดูแลระบบ, 9: ผู้ดูแลระบบสูงสุด)
    var personFlag = parseInt(userData.personFlag, 10);
    if (personFlag !== 8 && personFlag !== 9) {
      personFlag = 8; // ค่าเริ่มต้นเป็น 8 (ผู้ดูแลระบบ)
    }
    var deletedFlag = "N"; // ใช้งานได้

    if (!username) return { success: false, message: "กรุณากรอก 'ชื่อผู้ใช้'" };
    if (!password) return { success: false, message: "กรุณากรอก 'รหัสผ่าน'" };
    if (!nickname) return { success: false, message: "กรุณากรอก 'ชื่อเล่น'" };

    var data = sheet.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      var rowUser = String(data[i][0]).trim().toLowerCase();
      var rowDel = String(data[i][11] || "N").trim().toUpperCase();
      if (rowUser === username.toLowerCase()) {
        if (rowDel === "Y") {
          return { success: false, message: "ชื่อผู้ใช้ '" + username + "' เคยถูกลบออกจากระบบแล้ว กรุณาใช้ชื่ออื่นหรือติดต่อผู้ดูแลระบบ" };
        }
        return { success: false, message: "ชื่อผู้ใช้ '" + username + "' มีอยู่ในระบบแล้ว กรุณาใช้ชื่ออื่น" };
      }
    }

    var nowStr = Utilities.formatDate(new Date(), "Asia/Bangkok", "yyyy-MM-dd HH:mm:ss");
    sheet.appendRow([
      username,
      password,
      nickname,
      firstname,
      lastname,
      nowStr,
      createdBy,
      nowStr,
      createdBy,
      isActive,
      personFlag,
      deletedFlag
    ]);

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
 * - ผู้ดูแลระบบสูงสุด (person_flag = 9): แก้ไขได้ทั้งของตนเองและผู้อื่น
 * - ผู้ดูแลระบบ (person_flag = 8): แก้ไขได้เฉพาะข้อมูลของตนเองเท่านั้น
 */
function updateAdminUser(userData) {
  try {
    var sheet = getAdminSheet();
    var username = String(userData.username || "").trim();
    var password = String(userData.password || "").trim();
    var nickname = String(userData.nickname || "").trim();
    var firstname = String(userData.firstname || "").trim();
    var lastname = String(userData.lastname || "").trim();
    var updatedBy = String(userData.updatedBy || userData.username || "").trim() || username;

    if (!username) return { success: false, message: "ไม่พบชื่อผู้ใช้ที่ต้องการแก้ไข" };
    if (!nickname) return { success: false, message: "กรุณากรอก 'ชื่อเล่น'" };

    var data = sheet.getDataRange().getValues();
    var targetRowIndex = -1;
    var targetRecord = null;

    for (var i = 1; i < data.length; i++) {
      if (String(data[i][0]).trim().toLowerCase() === username.toLowerCase()) {
        targetRowIndex = i + 1;
        targetRecord = {
          personFlag: parseInt(data[i][10], 10) || (username.toLowerCase() === "admin" ? 9 : 8),
          isActive: (data[i][9] === false || String(data[i][9]).toLowerCase() === "false") ? false : true
        };
        break;
      }
    }

    if (targetRowIndex === -1) {
      return { success: false, message: "ไม่พบข้อมูลผู้ใช้ '" + username + "' ในระบบ" };
    }

    // ตรวจสอบสิทธิ์ผู้แก้ไข (updatedBy)
    var updaterRecord = getAdminRecord(updatedBy);
    var isUpdaterSuperAdmin = (!updaterRecord || updaterRecord.personFlag === 9 || updatedBy.toLowerCase() === "admin");

    var personFlag = targetRecord.personFlag;
    var isActive = targetRecord.isActive;

    if (!isUpdaterSuperAdmin) {
      // ผู้ดูแลระบบ (person_flag = 8): แก้ไขได้เฉพาะข้อมูลของตนเองเท่านั้น
      if (username.toLowerCase() !== updatedBy.toLowerCase()) {
        return { success: false, message: "ผู้ดูแลระบบสามารถแก้ไขได้เฉพาะข้อมูลของตัวเองเท่านั้น" };
      }
      // คงสิทธิ์ personFlag เดิม และห้ามปิดการใช้งานตนเอง
      personFlag = targetRecord.personFlag;
      isActive = true;
    } else {
      // ผู้ดูแลระบบสูงสุด (person_flag = 9)
      var requestedFlag = parseInt(userData.personFlag, 10);
      if (requestedFlag === 8 || requestedFlag === 9) {
        personFlag = requestedFlag;
      }
      isActive = (userData.isActive === false || String(userData.isActive) === "false") ? false : true;

      // บัญชี admin หลัก ล็อคให้เป็น person_flag = 9 และ isActive = true เสมอ
      if (username.toLowerCase() === "admin") {
        personFlag = 9;
        isActive = true;
      }
    }

    var nowStr = Utilities.formatDate(new Date(), "Asia/Bangkok", "yyyy-MM-dd HH:mm:ss");

    if (password) {
      sheet.getRange(targetRowIndex, 2).setValue(password); // Col 2: pwd
    }
    sheet.getRange(targetRowIndex, 3).setValue(nickname);   // Col 3: nick_name
    sheet.getRange(targetRowIndex, 4).setValue(firstname);  // Col 4: first_name
    sheet.getRange(targetRowIndex, 5).setValue(lastname);   // Col 5: last_name
    sheet.getRange(targetRowIndex, 8).setValue(nowStr);     // Col 8: update_date
    sheet.getRange(targetRowIndex, 9).setValue(updatedBy);  // Col 9: updated_by
    sheet.getRange(targetRowIndex, 10).setValue(isActive);  // Col 10: is_active
    sheet.getRange(targetRowIndex, 11).setValue(personFlag);// Col 11: person_flag (8 หรือ 9)

    return {
      success: true,
      message: "แก้ไขข้อมูลผู้ดูแลระบบ '" + username + "' เรียบร้อยแล้ว"
    };
  } catch (err) {
    return { success: false, message: "เกิดข้อผิดพลาดในการแก้ไขข้อมูล: " + err.message };
  }
}

/**
 * ลบข้อมูลผู้ดูแลระบบแบบ Soft Delete (deleted_flag = 'Y')
 * - เฉพาะผู้ดูแลระบบสูงสุด (person_flag = 9) เท่านั้นที่มีสิทธิ์ลบ
 * - ห้ามลบ username = 'admin'
 * - ห้ามลบบัญชีของตัวเอง
 */
function deleteAdminUser(username, operatorUsername) {
  try {
    var cleanUsername = String(username || "").trim();
    var updatedBy = String(operatorUsername || "").trim() || cleanUsername;

    // ตรวจสอบสิทธิ์ผู้ดำเนินการ (operator)
    var operatorRecord = getAdminRecord(updatedBy);
    if (operatorRecord && operatorRecord.personFlag !== 9 && updatedBy.toLowerCase() !== "admin") {
      return {
        success: false,
        message: "ไม่มีสิทธิ์ลบข้อมูลผู้ดูแลระบบ (เฉพาะผู้ดูแลระบบสูงสุดเท่านั้น)"
      };
    }

    // กฎสำคัญ: ห้ามลบ admin เด็ดขาด!
    if (cleanUsername.toLowerCase() === "admin") {
      return {
        success: false,
        message: "ไม่อนุญาตให้ลบผู้ดูแลระบบหลัก (admin) โดยเด็ดขาด"
      };
    }

    // ห้ามลบบัญชีของตนเอง
    if (updatedBy && cleanUsername.toLowerCase() === updatedBy.toLowerCase()) {
      return {
        success: false,
        message: "ไม่อนุญาตให้ลบบัญชีของตนเองในขณะที่เข้าสู่ระบบอยู่"
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

    var nowStr = Utilities.formatDate(new Date(), "Asia/Bangkok", "yyyy-MM-dd HH:mm:ss");

    // Soft delete: ไม่ลบแถวออกจากชีต แต่ทำเครื่องหมาย deleted_flag = 'Y' และ is_active = false
    sheet.getRange(targetRowIndex, 8).setValue(nowStr);     // Col 8: update_date
    sheet.getRange(targetRowIndex, 9).setValue(updatedBy);  // Col 9: updated_by
    sheet.getRange(targetRowIndex, 10).setValue(false);     // Col 10: is_active = false
    sheet.getRange(targetRowIndex, 12).setValue("Y");       // Col 12: deleted_flag = 'Y'

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
// ฟิลด์: 1.รหัสลูกค้า 2.ชื่อเล่น(Req) 3.ชื่อจริง(Opt) 4.นามสกุล(Opt) 5.เบอร์โทร(Req) 6.วันที่สร้าง 7.อัปเดตล่าสุด
// ==============================================================================

/**
 * สร้างรหัสลูกค้าอัตโนมัติ (Pattern: JM ตามด้วยตัวเลข 4 หลัก เริ่มต้น JM0001)
 * รันลำดับ number ถัดไปเสมอเมื่อทำการเพิ่มข้อมูลลูกค้าใหม่
 */
function generateNextCustomerId() {
  var sheet = getCustomerSheet();
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) {
    return "JM0001";
  }

  var idValues = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  var maxNum = 0;

  for (var i = 0; i < idValues.length; i++) {
    var val = String(idValues[i][0] || "").trim();
    var match = val.match(/^JM(\d+)$/i);
    if (match) {
      var num = parseInt(match[1], 10);
      if (num > maxNum) {
        maxNum = num;
      }
    }
  }

  var nextNum = maxNum + 1;
  return "JM" + ("0000" + nextNum).slice(-4);
}

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
        var customerId = String(data[i][0] || "").trim();
        var nickname = String(data[i][1] || "").trim();
        var firstname = String(data[i][2] || "").trim();
        var lastname = String(data[i][3] || "").trim();
        var phone = String(data[i][4] || "").trim();
        var createdAt = data[i][5] ? formatDateDisplay(data[i][5]) : "-";
        var updatedAt = data[i][6] ? formatDateDisplay(data[i][6]) : "-";

        // หากแถวว่างเปล่าให้ข้าม
        if (!customerId && !nickname && !phone) continue;

        customerList.push({
          rowId: i + 1, // 1-based row index in Google Sheet
          customerId: customerId || "-",
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
 * เพิ่มข้อมูลลูกค้าใหม่ (สร้างรหัสอัตโนมัติ เช่น JM0001)
 * @param {object} customerData { nickname, firstname, lastname, phone }
 */
function addCustomer(customerData) {
  try {
    initSheetIfNeeded();
    var sheet = getCustomerSheet();
    var customerId = generateNextCustomerId();
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

    // ฟิลด์ตามข้อกำหนด: 1.รหัสลูกค้า, 2.ชื่อเล่น, 3.ชื่อจริง, 4.นามสกุล, 5.เบอร์โทร, 6.วันที่สร้าง, 7.อัปเดตล่าสุด
    sheet.appendRow([customerId, nickname, firstname, lastname, phone, nowStr, nowStr]);

    return {
      success: true,
      customerId: customerId,
      message: "เพิ่มข้อมูลลูกค้า '" + nickname + "' (รหัส: " + customerId + ") เรียบร้อยแล้ว"
    };
  } catch (err) {
    return { success: false, message: "เกิดข้อผิดพลาดในการเพิ่มข้อมูลลูกค้า: " + err.message };
  }
}

/**
 * แก้ไขข้อมูลลูกค้า (รหัสลูกค้าเป็น readonly ไม่เปลี่ยนแปลง)
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

    // คอลัมน์ 1 คือ รหัสลูกค้า (ห้ามแก้ไข)
    sheet.getRange(rowId, 2).setValue(nickname);
    sheet.getRange(rowId, 3).setValue(firstname);
    sheet.getRange(rowId, 4).setValue(lastname);
    sheet.getRange(rowId, 5).setValue(phone);
    sheet.getRange(rowId, 7).setValue(nowStr); // อัปเดตล่าสุด

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

// ==============================================================================
// โมดูล 3: ข้อมูลการจอง และ ตารางนัดหมาย (Reservation & Calendar Module)
// ==============================================================================

/**
 * แปลงฟอร์แมตเวลาให้อยู่ในรูปแบบ HH:mm (เช่น 17:30, 10:00)
 * จัดการกรณี Date object จาก Google Sheets หรือสตริงเวลาที่มี GMT/ปี 1899
 */
function formatTimeSlot(val) {
  if (!val) return "";
  if (val instanceof Date) {
    return Utilities.formatDate(val, "Asia/Bangkok", "HH:mm");
  }
  var str = String(val).trim();
  if (str.indexOf("GMT") !== -1 || str.indexOf("1899") !== -1 || str.indexOf("1900") !== -1) {
    try {
      var d = new Date(str);
      if (!isNaN(d.getTime())) {
        return Utilities.formatDate(d, "Asia/Bangkok", "HH:mm");
      }
    } catch (e) {}
  }
  var match = str.match(/(\d{1,2}):(\d{2})/);
  if (match) {
    var hh = match[1].length === 1 ? "0" + match[1] : match[1];
    var mm = match[2];
    return hh + ":" + mm;
  }
  return str;
}

/**
 * ดึงรายการตัวเลือกเวลาการจองทั้งหมด
 * @returns {Array<string>} รายการเวลา เช่น ["10:00", "11:30", ...]
 */
function getReservationTimeSlots() {
  try {
    initSheetIfNeeded();
    var sheet = getSettingTimeSheet();
    var data = sheet.getDataRange().getValues();
    var slots = [];
    if (data.length > 1) {
      for (var i = 1; i < data.length; i++) {
        var t = formatTimeSlot(data[i][0]);
        if (t && slots.indexOf(t) === -1) slots.push(t);
      }
    }
    slots.sort(function(a, b) {
      return a.localeCompare(b);
    });
    return slots.length > 0 ? slots : ["10:00", "11:30", "13:00", "14:30", "16:00", "17:30", "19:00", "20:30"];
  } catch (err) {
    return ["10:00", "11:30", "13:00", "14:30", "16:00", "17:30", "19:00", "20:30"];
  }
}

/**
 * ตรวจสอบสิทธิ์การแก้ไขข้อมูลตามเงื่อนไขเดือนและวันที่:
 * - 1. เพิ่ม, แก้ไข, ลบ: เลือกได้เฉพาะ ตั้งแต่ วันที่ปัจจุบัน เป็นต้นไป แต่ไม่เกินเดือนถัดไป 1 เดือน
 * - 1.1 เลือกเดือนย้อนหลังดูข้อมูลได้: ไม่เกิน 1 เดือนนับจากเดือนปัจจุบัน (diffMonths >= -1) แต่ห้ามแก้ไข
 * - เดินหน้าดูเดือนถัดไปได้: ไม่เกิน 1 เดือนนับจากเดือนปัจจุบัน (diffMonths <= 1)
 */
function checkMonthPermission(year, month) {
  var now = new Date();
  var currYear = parseInt(Utilities.formatDate(now, "Asia/Bangkok", "yyyy"), 10);
  var currMonth = parseInt(Utilities.formatDate(now, "Asia/Bangkok", "M"), 10);
  var todayStr = Utilities.formatDate(now, "Asia/Bangkok", "yyyy-MM-dd");

  var diffMonths = (year - currYear) * 12 + (month - currMonth);

  // ควบคุมการเปลี่ยนเดือน: ย้อนหลังได้ไม่เกิน 1 เดือน และ ล่วงหน้าได้ไม่เกิน 1 เดือน
  var canGoPrev = diffMonths > -1;
  var canGoNext = diffMonths < 1;

  var isPast = diffMonths < 0;
  var isCurrent = diffMonths === 0;
  var isNext = diffMonths === 1;
  var isTooFar = diffMonths > 1;
  var isTooFarPast = diffMonths < -1;
  var isEditable = (isCurrent || isNext);

  var statusText = "";
  if (isPast) {
    statusText = "โหมดย้อนหลัง (ดูข้อมูลได้อย่างเดียว ห้ามแก้ไข)";
  } else if (isCurrent) {
    statusText = "เดือนปัจจุบัน (สามารถจัดการข้อมูลได้ ตั้งแต่วันที่ปัจจุบัน)";
  } else if (isNext) {
    statusText = "เดือนถัดไป (สามารถจัดการข้อมูลล่วงหน้าได้)";
  } else if (isTooFar) {
    statusText = "เดือนล่วงหน้าเกิน 1 เดือน (ดูข้อมูลได้อย่างเดียว)";
  } else {
    statusText = "เดือนย้อนหลังเกิน 1 เดือน (ดูข้อมูลได้อย่างเดียว)";
  }

  return {
    isPast: isPast,
    isCurrent: isCurrent,
    isNext: isNext,
    isEditable: isEditable,
    isTooFar: isTooFar,
    isTooFarPast: isTooFarPast,
    diffMonths: diffMonths,
    canGoPrev: canGoPrev,
    canGoNext: canGoNext,
    todayStr: todayStr,
    statusText: statusText,
    currentYear: currYear,
    currentMonth: currMonth
  };
}

/**
 * ดึงข้อมูลตารางนัดหมายประจำเดือน (ปี ค.ศ., เดือน 1-12)
 * พร้อมคำนวณโควต้าการจองในแต่ละช่วงเวลา (สูงสุด 5 คน ต่อช่วงเวลา)
 */
function getCalendarData(year, month) {
  try {
    initSheetIfNeeded();
    year = parseInt(year, 10);
    month = parseInt(month, 10);

    var permission = checkMonthPermission(year, month);
    var timeSlots = getReservationTimeSlots();

    // ดึงข้อมูลลูกค้าเพื่อนำมา map ชื่อ
    var custSheet = getCustomerSheet();
    var custData = custSheet.getDataRange().getValues();
    var customerMap = {};
    if (custData.length > 1) {
      for (var c = 1; c < custData.length; c++) {
        var cid = String(custData[c][0] || "").trim();
        if (cid) {
          customerMap[cid] = {
            nickname: String(custData[c][1] || "").trim(),
            firstname: String(custData[c][2] || "").trim(),
            lastname: String(custData[c][3] || "").trim(),
            phone: String(custData[c][4] || "").trim()
          };
        }
      }
    }

    // ดึงข้อมูลการจอง
    var resSheet = getReservationSheet();
    var resData = resSheet.getDataRange().getValues();

    // เก็บรายการจองแยกตาม วันที่ และ เวลา
    // โครงสร้าง: { "YYYY-MM-DD": { "17:30": [ bookingObj, ... ] } }
    var reservationsByDate = {};
    var targetMonthPrefix = year + "-" + (month < 10 ? "0" + month : month);

    if (resData.length > 1) {
      for (var r = 1; r < resData.length; r++) {
        var resId = String(resData[r][0] || "").trim();
        var custId = String(resData[r][1] || "").trim();
        var dateRaw = resData[r][2];
        var timeSlot = formatTimeSlot(resData[r][3]);
        var status = String(resData[r][4] || "ยืนยันแล้ว").trim();
        var createdAt = resData[r][5] ? formatDateDisplay(resData[r][5]) : "-";
        var updatedAt = resData[r][6] ? formatDateDisplay(resData[r][6]) : "-";

        if (!dateRaw) continue;

        var dateStr = "";
        if (dateRaw instanceof Date) {
          dateStr = Utilities.formatDate(dateRaw, "Asia/Bangkok", "yyyy-MM-dd");
        } else {
          dateStr = String(dateRaw).trim().slice(0, 10);
        }

        // ตรวจสอบว่าอยู่ในเดือนและปีที่ระบุหรือไม่
        if (dateStr.indexOf(targetMonthPrefix) === 0) {
          if (!reservationsByDate[dateStr]) {
            reservationsByDate[dateStr] = {};
          }
          if (!reservationsByDate[dateStr][timeSlot]) {
            reservationsByDate[dateStr][timeSlot] = [];
          }

          var custInfo = customerMap[custId] || {
            nickname: custId || "-",
            firstname: "",
            lastname: "",
            phone: "-"
          };

          reservationsByDate[dateStr][timeSlot].push({
            rowId: r + 1,
            reservationId: resId,
            customerId: custId,
            customerNickname: custInfo.nickname,
            customerFullName: (custInfo.firstname + " " + custInfo.lastname).trim(),
            customerPhone: custInfo.phone,
            timeSlot: timeSlot,
            date: dateStr,
            status: status,
            createdAt: createdAt,
            updatedAt: updatedAt
          });
        }
      }
    }

    return {
      success: true,
      year: year,
      month: month,
      permission: permission,
      todayStr: permission.todayStr,
      timeSlots: timeSlots,
      reservationsByDate: reservationsByDate
    };
  } catch (err) {
    return {
      success: false,
      message: "ไม่สามารถดึงข้อมูลตารางนัดหมายได้: " + err.message
    };
  }
}

/**
 * สร้างรหัสการจองอัตโนมัติ (Pattern: BK ตามด้วยตัวเลข 4 หลัก เช่น BK0001)
 */
function generateNextReservationId() {
  initSheetIfNeeded();
  var sheet = getReservationSheet();
  var data = sheet.getDataRange().getValues();

  var maxNum = 0;
  if (data.length > 1) {
    for (var i = 1; i < data.length; i++) {
      var code = String(data[i][0] || "").trim();
      var match = code.match(/^BK(\d+)$/i);
      if (match) {
        var num = parseInt(match[1], 10);
        if (num > maxNum) {
          maxNum = num;
        }
      }
    }
  }

  var nextNum = maxNum + 1;
  return "BK" + ("0000" + nextNum).slice(-4);
}

/**
 * เพิ่มข้อมูลการจองใหม่ (ตรวจสอบสิทธิ์ช่วงเดือน และโควต้าไม่เกิน 5 คน)
 */
function addReservation(data) {
  try {
    initSheetIfNeeded();

    var dateStr = String(data.date || "").trim(); // YYYY-MM-DD
    var timeSlot = formatTimeSlot(data.timeSlot || "");
    var customerId = String(data.customerId || "").trim();
    var status = String(data.status || "ยืนยันแล้ว").trim();

    if (!dateStr) return { success: false, message: "กรุณาระบุวันที่ที่จอง" };
    if (!timeSlot) return { success: false, message: "กรุณาระบุเวลาที่จอง" };
    if (!customerId) return { success: false, message: "กรุณาเลือกลูกค้า" };

    var now = new Date();
    var todayStr = Utilities.formatDate(now, "Asia/Bangkok", "yyyy-MM-dd");

    // ตรวจสอบเงื่อนไขข้อ 1: เฉพาะตั้งแต่วันที่ปัจจุบันเป็นต้นไป
    if (dateStr < todayStr) {
      return {
        success: false,
        message: "ไม่อนุญาตให้จองย้อนหลัง สามารถจองได้ตั้งแต่วันที่ปัจจุบัน (" + todayStr + ") เป็นต้นไป"
      };
    }

    // ตรวจสอบเงื่อนไขข้อ 3.1 & 3.3: เกณฑ์การตรวจสอบเวลาปิดรับจองของรอบเวลานั้นๆ
    // สมมติตัวอย่างรอบเวลา 12:00 น.:
    // - ช่วงเวลา 10:00, 11:00 ที่น้อยกว่า 12:00 ปิดรับจอง
    // - ตั้งแต่ 12:00 ถึง 12:19 น. เปิดให้จองได้
    // - 12:20 น. เป็นต้นไป ปิดรับจอง ของรอบเวลา 12:00 น.
    // (สูตร: nowTotalMinutes >= slotTotalMinutes + 20)
    if (dateStr === todayStr) {
      var currentHour = parseInt(Utilities.formatDate(now, "Asia/Bangkok", "HH"), 10);
      var currentMin = parseInt(Utilities.formatDate(now, "Asia/Bangkok", "mm"), 10);
      var nowTotalMinutes = currentHour * 60 + currentMin;

      var slotParts = timeSlot.split(":");
      var slotTotalMinutes = parseInt(slotParts[0], 10) * 60 + parseInt(slotParts[1], 10);

      if (nowTotalMinutes >= slotTotalMinutes + 20) {
        return {
          success: false,
          message: "รอบเวลา " + timeSlot + " น. ปิดรับจองแล้ว (ปิดรับจองเมื่อเวลาเริ่มรอบผ่านไปเกิน 20 นาที)"
        };
      }
    }

    // ตรวจสอบสิทธิ์การแก้ไขเดือน (ไม่เกินเดือนถัดไป 1 เดือน)
    var parts = dateStr.split("-");
    var year = parseInt(parts[0], 10);
    var month = parseInt(parts[1], 10);
    var perm = checkMonthPermission(year, month);
    if (!perm.isEditable) {
      return {
        success: false,
        message: "ไม่อนุญาตให้ทำการจองในเดือนนี้ (" + perm.statusText + ")"
      };
    }

    var sheet = getReservationSheet();
    var allData = sheet.getDataRange().getValues();

    // ตรวจสอบโควต้าสูงสุด 5 คน ต่อช่วงเวลา
    var currentCount = 0;
    if (allData.length > 1) {
      for (var i = 1; i < allData.length; i++) {
        var rowDate = allData[i][2];
        var rDateStr = (rowDate instanceof Date) ? Utilities.formatDate(rowDate, "Asia/Bangkok", "yyyy-MM-dd") : String(rowDate).slice(0, 10);
        var rTime = formatTimeSlot(allData[i][3]);
        var rStatus = String(allData[i][4] || "").trim();

        if (rDateStr === dateStr && rTime === timeSlot && rStatus !== "ยกเลิก") {
          currentCount++;
        }
      }
    }

    if (currentCount >= 5) {
      return {
        success: false,
        message: "ช่วงเวลา " + timeSlot + " น. เต็มแล้ว (โควต้าครบ 5/5 ท่านแล้ว)"
      };
    }

    var reservationId = generateNextReservationId();
    var nowStr = Utilities.formatDate(new Date(), "Asia/Bangkok", "yyyy-MM-dd HH:mm:ss");

    sheet.appendRow([reservationId, customerId, dateStr, timeSlot, status, nowStr, nowStr]);

    return {
      success: true,
      reservationId: reservationId,
      message: "บันทึกการจองรหัส " + reservationId + " ช่วงเวลา " + timeSlot + " น. เรียบร้อยแล้ว (โควต้า: " + (currentCount + 1) + "/5)"
    };
  } catch (err) {
    return { success: false, message: "เกิดข้อผิดพลาดในการบันทึกการจอง: " + err.message };
  }
}

/**
 * ลบข้อมูลการจอง
 */
function deleteReservation(reservationId) {
  try {
    var sheet = getReservationSheet();
    var cleanId = String(reservationId || "").trim();
    var data = sheet.getDataRange().getValues();
    var targetRow = -1;

    for (var i = 1; i < data.length; i++) {
      if (String(data[i][0]).trim() === cleanId) {
        targetRow = i + 1;
        break;
      }
    }

    if (targetRow === -1) {
      return { success: false, message: "ไม่พบข้อมูลการจองรหัส " + cleanId };
    }

    sheet.deleteRow(targetRow);
    return { success: true, message: "ลบข้อมูลการจองรหัส " + cleanId + " เรียบร้อยแล้ว" };
  } catch (err) {
    return { success: false, message: "เกิดข้อผิดพลาดในการลบการจอง: " + err.message };
  }
}
