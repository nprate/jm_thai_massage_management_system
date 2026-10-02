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
const Google_Sheet_ID = GOOGLE_SHEET_ID;
const SHEET_NAME_ADMIN = "ข้อมูลผู้ดูแลระบบ";
const Sheet_Name_Admin = SHEET_NAME_ADMIN;
const SHEET_NAME_CUSTOMER = "ข้อมูลลูกค้า";
const Sheet_Name_Customer = SHEET_NAME_CUSTOMER;
const SHEET_NAME_STAFF = "ข้อมูลพนักงาน";
const Sheet_Name_Staff = SHEET_NAME_STAFF;
const SHEET_NAME_RESERVATION = "จองคิว";
const Sheet_Name_Reservation = SHEET_NAME_RESERVATION;
const SHEET_NAME_SETTING_TIME = "ตั้งค่าตัวเลือกเวลาการจอง";
const MENU_NAME_SETTING = "การตั้งค่า";
const Menu_Name_Setting = "การตั้งค่า";
const Sheet_Name_Setting_Selection_Reservation_Time = SHEET_NAME_SETTING_TIME;
const SHEET_NAME_SETTING_SERVICE_PRICE = "ตั้งค่าตัวเลือกค่าบริการ";
const Sheet_Name_Setting_Service_Price = SHEET_NAME_SETTING_SERVICE_PRICE;
const SHEET_NAME_SETTING_TIMETABLE = "ตั้งค่าตารางการจอง";
const Sheet_Name_Setting_Reservation_Timetable = SHEET_NAME_SETTING_TIMETABLE;

/**
 * ให้บริการหน้าเว็บ Web Application (Entry point)
 */
function doGet(e) {
  try {
    // กรณีเรียกด้วย ?action=setupCustomer เพื่อสั่งรันอัปเดต Schema ข้อมูลลูกค้าผ่าน URL ได้ทันที
    if (e && e.parameter && (e.parameter.action === "setupCustomer" || e.parameter.setupCustomer === "true")) {
      var res = setupCustomerSheetSchema();
      return HtmlService.createHtmlOutput("<div style='font-family:sans-serif;padding:30px;max-width:600px;margin:40px auto;border:1px solid #c3e6cb;background:#d4edda;border-radius:10px;'><h2 style='color:#155724;margin-top:0;'>✅ อัปเดต Schema สำเร็จ</h2><p style='color:#155724;font-size:16px;'>" + res.message + "</p><hr style='border:0;border-top:1px solid #c3e6cb;margin:20px 0;'><p style='color:#6c757d;font-size:14px;'>Google Sheet ของท่านได้รับการตั้งค่าหัวตาราง 13 คอลัมน์ภาษาอังกฤษและเติมข้อมูลเรียบร้อยแล้ว ท่านสามารถปิดหน้านี้แล้วเปิดใช้งานระบบได้ตามปกติ</p></div>");
    }

    // กรณีเรียกด้วย ?action=setupStaff เพื่อสั่งรันอัปเดต Schema ข้อมูลพนักงานผ่าน URL ได้ทันที
    if (e && e.parameter && (e.parameter.action === "setupStaff" || e.parameter.setupStaff === "true")) {
      var resStaff = setupStaffSheetSchema();
      return HtmlService.createHtmlOutput("<div style='font-family:sans-serif;padding:30px;max-width:600px;margin:40px auto;border:1px solid #c3e6cb;background:#d4edda;border-radius:10px;'><h2 style='color:#155724;margin-top:0;'>✅ อัปเดต Schema ข้อมูลพนักงานสำเร็จ</h2><p style='color:#155724;font-size:16px;'>" + resStaff.message + "</p><hr style='border:0;border-top:1px solid #c3e6cb;margin:20px 0;'><p style='color:#6c757d;font-size:14px;'>Google Sheet ข้อมูลพนักงาน (Sheet_Name_Staff) ได้รับการตั้งค่าหัวตาราง 13 คอลัมน์ภาษาอังกฤษและเติมข้อมูลเรียบร้อยแล้ว ท่านสามารถปิดหน้านี้แล้วเปิดใช้งานระบบได้ตามปกติ</p></div>");
    }

    // กรณีเรียกด้วย ?action=setupSettingTime เพื่อสั่งรันอัปเดต Schema ตัวเลือกเวลาผ่าน URL ได้ทันที
    if (e && e.parameter && (e.parameter.action === "setupSettingTime" || e.parameter.setupSettingTime === "true")) {
      var resTime = setupSettingTimeSheetSchema();
      return HtmlService.createHtmlOutput("<div style='font-family:sans-serif;padding:30px;max-width:600px;margin:40px auto;border:1px solid #c3e6cb;background:#d4edda;border-radius:10px;'><h2 style='color:#155724;margin-top:0;'>✅ อัปเดต Schema ตัวเลือกเวลาการจองสำเร็จ</h2><p style='color:#155724;font-size:16px;'>" + resTime.message + "</p><hr style='border:0;border-top:1px solid #c3e6cb;margin:20px 0;'><p style='color:#6c757d;font-size:14px;'>Google Sheet ตั้งค่าตัวเลือกเวลาการจอง (Sheet_Name_Setting_Selection_Reservation_Time) ได้รับการตั้งค่าหัวตาราง 8 คอลัมน์ (period_from, period_to) เรียบร้อยแล้ว ท่านสามารถปิดหน้านี้แล้วเปิดใช้งานระบบได้ตามปกติ</p></div>");
    }

    // กรณีเรียกด้วย ?action=setupSettingTimetable เพื่อสั่งรันอัปเดต Schema ตารางการจองผ่าน URL ได้ทันที
    if (e && e.parameter && (e.parameter.action === "setupSettingTimetable" || e.parameter.setupSettingTimetable === "true")) {
      var resTimetable = setupSettingTimetableSheetSchema();
      return HtmlService.createHtmlOutput("<div style='font-family:sans-serif;padding:30px;max-width:600px;margin:40px auto;border:1px solid #c3e6cb;background:#d4edda;border-radius:10px;'><h2 style='color:#155724;margin-top:0;'>✅ อัปเดต Schema ตารางการจองสำเร็จ</h2><p style='color:#155724;font-size:16px;'>" + resTimetable.message + "</p><hr style='border:0;border-top:1px solid #c3e6cb;margin:20px 0;'><p style='color:#6c757d;font-size:14px;'>Google Sheet ตั้งค่าตารางการจอง (Sheet_Name_Setting_Reservation_Timetable) ได้รับการตั้งค่าหัวตาราง 10 คอลัมน์เรียบร้อยแล้ว ท่านสามารถปิดหน้านี้แล้วเปิดใช้งานระบบได้ตามปกติ</p></div>");
    }

    // กรณีเรียกด้วย ?action=setupReservation หรือ ?action=renameReservation เพื่อสั่งรันเปลี่ยนชื่อชีตจองคิวผ่าน URL ได้ทันที
    if (e && e.parameter && (e.parameter.action === "setupReservation" || e.parameter.setupReservation === "true" || e.parameter.action === "renameReservation")) {
      var resReservation = renameReservationSheetIfNeeded();
      return HtmlService.createHtmlOutput("<div style='font-family:sans-serif;padding:30px;max-width:600px;margin:40px auto;border:1px solid #c3e6cb;background:#d4edda;border-radius:10px;'><h2 style='color:#155724;margin-top:0;'>✅ อัปเดตชื่อชีตสำเร็จ</h2><p style='color:#155724;font-size:16px;'>" + resReservation.message + "</p><hr style='border:0;border-top:1px solid #c3e6cb;margin:20px 0;'><p style='color:#6c757d;font-size:14px;'>Google Sheet จองคิว (Sheet_Name_Reservation) ได้รับการตั้งชื่อเรียบร้อยแล้ว ท่านสามารถปิดหน้านี้แล้วเปิดใช้งานระบบได้ตามปกติ</p></div>");
    }

    // กรณีเรียกด้วย ?action=initAll เพื่อสั่งตรวจสอบและตั้งค่า Schema ทั้งหมดผ่าน URL
    if (e && e.parameter && (e.parameter.action === "initAll" || e.parameter.initAll === "true")) {
      initSheetIfNeeded();
      return HtmlService.createHtmlOutput("<div style='font-family:sans-serif;padding:30px;max-width:600px;margin:40px auto;border:1px solid #c3e6cb;background:#d4edda;border-radius:10px;'><h2 style='color:#155724;margin-top:0;'>✅ ตั้งค่า Schema ทั้งหมดสำเร็จ</h2><p style='color:#155724;font-size:16px;'>ระบบได้ตรวจสอบและตั้งค่าโครงสร้างชีตทั้งหมดเรียบร้อยแล้ว ท่านสามารถเปิดใช้งานระบบได้ตามปกติ</p></div>");
    }

    // ให้บริการหน้าเว็บ HTML ทันที (รองรับทั้งการตั้งชื่อไฟล์ 'index' หรือ 'index.html' ใน Apps Script Editor)
    var htmlOutput;
    try {
      htmlOutput = HtmlService.createHtmlOutputFromFile('index');
    } catch (err1) {
      try {
        htmlOutput = HtmlService.createHtmlOutputFromFile('index.html');
      } catch (err2) {
        htmlOutput = HtmlService.createTemplateFromFile('index').evaluate();
      }
    }

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
    Sheet_Name_Admin: SHEET_NAME_ADMIN,
    sheetNameCustomer: SHEET_NAME_CUSTOMER,
    Sheet_Name_Customer: SHEET_NAME_CUSTOMER,
    sheetNameStaff: SHEET_NAME_STAFF,
    Sheet_Name_Staff: SHEET_NAME_STAFF,
    sheetNameReservation: SHEET_NAME_RESERVATION,
    Sheet_Name_Reservation: SHEET_NAME_RESERVATION,
    sheetNameSettingTime: SHEET_NAME_SETTING_TIME,
    sheetNameSettingServicePrice: SHEET_NAME_SETTING_SERVICE_PRICE,
    sheetNameSettingTimetable: SHEET_NAME_SETTING_TIMETABLE,
    menuNameSetting: MENU_NAME_SETTING,
    Menu_Name_Setting: MENU_NAME_SETTING,
    Sheet_Name_Setting_Selection_Reservation_Time: SHEET_NAME_SETTING_TIME,
    Sheet_Name_Setting_Service_Price: SHEET_NAME_SETTING_SERVICE_PRICE,
    Sheet_Name_Setting_Reservation_Timetable: SHEET_NAME_SETTING_TIMETABLE,
    googleSheetId: GOOGLE_SHEET_ID,
    Google_Sheet_ID: GOOGLE_SHEET_ID
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
 * Helper: ดึงหรือสร้างชีต "ข้อมูลพนักงาน" (Sheet_Name_Staff)
 */
function getStaffSheet() {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME_STAFF);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME_STAFF);
  }
  return sheet;
}

/**
 * Helper: ดึงหรือสร้างชีต "จองคิว" (Sheet_Name_Reservation)
 * พร้อมระบบตรวจสอบและเปลี่ยนชื่อชีตเดิม "ข้อมูลการจอง" เป็น "จองคิว" อัตโนมัติ
 */
function getReservationSheet() {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME_RESERVATION);
  if (!sheet) {
    // หากยังไม่มีชีตชื่อใหม่ (จองคิว) ให้ตรวจสอบว่ามีชีตชื่อเดิม "ข้อมูลการจอง" หรือไม่
    var oldSheet = ss.getSheetByName("ข้อมูลการจอง");
    if (oldSheet) {
      try {
        oldSheet.setName(SHEET_NAME_RESERVATION);
        sheet = oldSheet;
      } catch (e) {
        sheet = oldSheet;
      }
    } else {
      sheet = ss.insertSheet(SHEET_NAME_RESERVATION);
    }
  }
  return sheet;
}

/**
 * ฟังก์ชันสำหรับตรวจสอบและเปลี่ยนชื่อชีต "ข้อมูลการจอง" เป็น "จองคิว" (Sheet_Name_Reservation)
 */
function renameReservationSheetIfNeeded() {
  try {
    var ss = getSpreadsheet();
    var targetSheet = ss.getSheetByName(SHEET_NAME_RESERVATION);
    var oldSheet = ss.getSheetByName("ข้อมูลการจอง");
    if (!targetSheet && oldSheet) {
      oldSheet.setName(SHEET_NAME_RESERVATION);
      return { success: true, message: "เปลี่ยนชื่อชีตจาก 'ข้อมูลการจอง' เป็น '" + SHEET_NAME_RESERVATION + "' เรียบร้อยแล้ว" };
    }
    if (targetSheet) {
      return { success: true, message: "ชีต '" + SHEET_NAME_RESERVATION + "' พร้อมใช้งานเรียบร้อยแล้ว" };
    }
    targetSheet = ss.insertSheet(SHEET_NAME_RESERVATION);
    return { success: true, message: "สร้างชีตใหม่ '" + SHEET_NAME_RESERVATION + "' เรียบร้อยแล้ว" };
  } catch (err) {
    return { success: false, message: "เกิดข้อผิดพลาดในการเปลี่ยนชื่อชีต: " + err.message };
  }
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
 * Helper: ดึงหรือสร้างชีต "ตั้งค่าตารางการจอง" (Sheet_Name_Setting_Reservation_Timetable)
 */
function getSettingTimetableSheet() {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME_SETTING_TIMETABLE);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME_SETTING_TIMETABLE);
  }
  return sheet;
}

/**
 * Event Trigger เมื่อเปิด Google Sheet
 * สร้างเมนูจัดการระบบเพื่อให้ผู้ใช้กดอัปเดต Schema ได้สะดวกจากหน้าต่าง Google Sheet โดยตรง
 */
function onOpen() {
  try {
    SpreadsheetApp.getUi()
      .createMenu("⚙️ จัดการระบบ (JM System)")
      .addItem("🔄 ตรวจสอบและอัปเดต Schema ข้อมูลลูกค้า (Customer Schema)", "setupCustomerSheetSchema")
      .addItem("🔄 ตรวจสอบและอัปเดต Schema ข้อมูลพนักงาน (Staff Schema)", "setupStaffSheetSchema")
      .addItem("🔄 ตรวจสอบและอัปเดต Schema ตัวเลือกเวลาการจอง (Setting Time Schema)", "setupSettingTimeSheetSchema")
      .addItem("🔄 ตรวจสอบและอัปเดต Schema ตารางการจอง (Setting Timetable Schema)", "setupSettingTimetableSheetSchema")
      .addItem("🔄 ตรวจสอบและตั้งค่า Schema ทั้งหมด (Init All Sheets)", "initSheetIfNeeded")
      .addToUi();
  } catch (e) {
    // ในกรณีเรียกจาก Web App ไม่มี UI Spreadsheet ให้ข้าม
  }
}

/**
 * ตั้งค่าและอัปเดต Schema ของชีตข้อมูลลูกค้า (Sheet_Name_Customer) ให้เป็น 13 คอลัมน์ภาษาอังกฤษ (เพิ่มคอลัมน์ pwd)
 * รองรับการ Auto-Migrate จาก 7, 8 หรือ 12 คอลัมน์เดิม โดยข้อมูลเดิม (เช่น JM0001, JM0002) ไม่สูญหาย
 * สามารถกดเรียกใช้ (Run) ได้โดยตรงจาก Apps Script Editor หรือผ่านเมนูของ Google Sheet
 */
function setupCustomerSheetSchema() {
  try {
    var sheet = getCustomerSheet();
    var lastRow = sheet.getLastRow();
    var nowStr = Utilities.formatDate(new Date(), "Asia/Bangkok", "yyyy-MM-dd HH:mm:ss");

    var customerHeaders = [
      "customer_id",  // 1. รหัสลูกค้า (ใช้ login)
      "pwd",          // 2. รหัสผ่าน login (ค่าเริ่มต้นเป็น phone_number)
      "nick_name",    // 3. ชื่อเล่น
      "first_name",   // 4. ชื่อจริง
      "last_name",    // 5. นามสกุล
      "phone_number", // 6. เบอร์โทร
      "create_date",  // 7. วันที่สร้าง
      "created_by",   // 8. ผู้สร้าง (username)
      "update_date",  // 9. อัปเดตล่าสุด
      "updated_by",   // 10. ผู้อัปเดต (username)
      "is_active",    // 11. สถานะการใช้งาน (true/false)
      "person_flag",  // 12. ประเภทผู้ใช้ (1: ลูกค้า)
      "deleted_flag"  // 13. สถานะการลบ (N: ใช้งานได้, Y: ถูกลบ)
    ];

    // ตรวจสอบจำนวนคอลัมน์ของตาราง (grid columns) ให้มีอย่างน้อย 13 คอลัมน์
    if (sheet.getMaxColumns() < 13) {
      sheet.insertColumnsAfter(sheet.getMaxColumns(), 13 - sheet.getMaxColumns());
    }

    if (lastRow === 0) {
      sheet.appendRow(customerHeaders);
      var headerRange = sheet.getRange(1, 1, 1, customerHeaders.length);
      headerRange.setBackground("#1B3B36")
        .setFontColor("#FFFFFF")
        .setFontWeight("bold")
        .setHorizontalAlignment("center")
        .setVerticalAlignment("middle");
      sheet.setRowHeight(1, 40);
      sheet.setFrozenRows(1);

      sheet.appendRow([
        "JM0001", "0812345678", "คุณนิด", "นิตยา", "สุขใจ", "0812345678",
        nowStr, "admin", nowStr, "admin", true, 1, "N"
      ]);

      for (var c = 1; c <= customerHeaders.length; c++) {
        sheet.autoResizeColumn(c);
      }
      return { success: true, message: "สร้างชีตข้อมูลลูกค้า 13 คอลัมน์ (พร้อม pwd) สำเร็จ" };
    }

    // ตรวจสอบตำแหน่งของคอลัมน์เดิมในแถวที่ 1 เพื่อรองรับการ Migrate
    var row1 = sheet.getRange(1, 1, 1, Math.min(sheet.getMaxColumns(), 16)).getValues()[0];

    // หากคอลัมน์ที่ 2 ยังไม่ใช่ pwd ให้แทรกคอลัมน์ว่างก่อนหน้าคอลัมน์ที่ 2
    var col2Val = String(row1[1] || "").trim().toLowerCase();
    if (col2Val !== "pwd") {
      sheet.insertColumnBefore(2);
      if (sheet.getMaxColumns() < 13) {
        sheet.insertColumnsAfter(sheet.getMaxColumns(), 13 - sheet.getMaxColumns());
      }
    }

    // กำหนด Header แถวที่ 1 ให้เป็น 13 คอลัมน์ภาษาอังกฤษอย่างสมบูรณ์
    var hRange = sheet.getRange(1, 1, 1, customerHeaders.length);
    hRange.setValues([customerHeaders]);
    hRange.setBackground("#1B3B36")
      .setFontColor("#FFFFFF")
      .setFontWeight("bold")
      .setHorizontalAlignment("center")
      .setVerticalAlignment("middle");
    sheet.setRowHeight(1, 40);
    sheet.setFrozenRows(1);

    // Backfill เติมข้อมูลให้กับแถวเดิมตั้งแต่แถวที่ 2 เป็นต้นไป (แบบ Batch เพื่อความรวดเร็วและปลอดภัย)
    var totalRows = sheet.getLastRow();
    if (totalRows >= 2) {
      var numRows = totalRows - 1;
      var dataRange = sheet.getRange(2, 1, numRows, 13);
      var values = dataRange.getValues();

      for (var i = 0; i < values.length; i++) {
        // 1. customer_id (ถ้ายังไม่มีรหัส ให้สร้างรหัส JM0001, JM0002... ตามลำดับ)
        if (!values[i][0] || String(values[i][0]).trim() === "") {
          values[i][0] = "JM" + ("0000" + (i + 1)).slice(-4);
        }
        // 2. pwd (รหัสผ่าน login: ถ้าว่าง ให้ใช้ค่าเบอร์โทรศัพท์ phone_number จากคอลัมน์ 6 เป็นค่าเริ่มต้น)
        var phoneVal = String(values[i][5] || "").trim();
        var cleanPhone = phoneVal.replace(/[^0-9]/g, '');
        if (cleanPhone.length === 9 && (cleanPhone.charAt(0) === '8' || cleanPhone.charAt(0) === '9' || cleanPhone.charAt(0) === '6')) {
          cleanPhone = "0" + cleanPhone;
        }
        if (cleanPhone.length === 10) {
          values[i][5] = cleanPhone; // จัดรูปแบบเบอร์โทรในชีตให้เป็นตัวเลข 10 หลักล้วน
        }
        if (!values[i][1] || String(values[i][1]).trim() === "") {
          values[i][1] = cleanPhone || phoneVal || "1234";
        }
        // 7. create_date (ถ้าว่าง ให้ใช้วันที่ปัจจุบัน)
        if (!values[i][6] || String(values[i][6]).trim() === "") {
          values[i][6] = nowStr;
        }
        // 8. created_by (ผู้สร้าง - ค่าเริ่มต้น admin)
        if (!values[i][7] || String(values[i][7]).trim() === "") {
          values[i][7] = "admin";
        }
        // 9. update_date (ถ้าว่าง ให้ใช้วันที่สร้าง หรือวันที่ปัจจุบัน)
        if (!values[i][8] || String(values[i][8]).trim() === "") {
          values[i][8] = values[i][6] || nowStr;
        }
        // 10. updated_by (ผู้อัปเดต - ค่าเริ่มต้น admin)
        if (!values[i][9] || String(values[i][9]).trim() === "") {
          values[i][9] = "admin";
        }
        // 11. is_active (สถานะใช้งาน true/false - ค่าเริ่มต้น true)
        if (values[i][10] === "" || values[i][10] === null || values[i][10] === undefined) {
          values[i][10] = true;
        }
        // 12. person_flag (ประเภทผู้ใช้ 1: ลูกค้า)
        if (!values[i][11] || isNaN(values[i][11])) {
          values[i][11] = 1;
        }
        // 13. deleted_flag (สถานะการลบ N: ใช้งานได้, Y: ถูกลบ)
        if (!values[i][12] || String(values[i][12]).trim() === "") {
          values[i][12] = "N";
        }
      }

      dataRange.setValues(values);

      // จัดการ Alignment และรูปแบบข้อความ
      try {
        sheet.getRange(2, 2, numRows, 1).setNumberFormat("@");
        sheet.getRange(2, 6, numRows, 1).setNumberFormat("@");
      } catch (e) {}

      sheet.getRange(2, 1, numRows, 1).setHorizontalAlignment("center");
      sheet.getRange(2, 2, numRows, 1).setHorizontalAlignment("center");
      sheet.getRange(2, 6, numRows, 1).setHorizontalAlignment("center");
      sheet.getRange(2, 7, numRows, 4).setHorizontalAlignment("center");
      sheet.getRange(2, 11, numRows, 3).setHorizontalAlignment("center");
    }

    // ปรับความกว้างคอลัมน์อัตโนมัติ
    for (var colIdx = 1; colIdx <= customerHeaders.length; colIdx++) {
      sheet.autoResizeColumn(colIdx);
    }

    try {
      var activeSs = SpreadsheetApp.getActiveSpreadsheet();
      if (activeSs && typeof activeSs.toast === "function") {
        activeSs.toast("อัปเดต Schema ข้อมูลลูกค้าเป็น 13 คอลัมน์ (พร้อม pwd) เรียบร้อยแล้ว", "สำเร็จ", 5);
      }
    } catch (e) {}

    return { success: true, message: "อัปเดต Schema ข้อมูลลูกค้า 13 คอลัมน์ (พร้อม pwd) และเติมรหัสผ่านเริ่มต้นเรียบร้อยแล้ว" };
  } catch (err) {
    return { success: false, message: "เกิดข้อผิดพลาดในการอัปเดต Schema: " + err.message };
  }
}

/**
 * ตั้งค่าและอัปเดต Schema ของชีตข้อมูลพนักงาน (Sheet_Name_Staff) ให้เป็น 13 คอลัมน์ภาษาอังกฤษ
 * Schema:
 * 1. staff_id (ขึ้นต้นด้วย JMC ตามด้วยเลข 3 หลัก เช่น JMC001, JMC002... running number ไม่ซ้ำเดิม)
 * 2. pwd (รหัสผ่าน login ค่าเริ่มต้นเป็น phone_number)
 * 3. nick_name (ชื่อเล่น)
 * 4. first_name (ชื่อจริง)
 * 5. last_name (นามสกุล)
 * 6. phone_number (เบอร์โทร ตัวเลข 10 หลักล้วน เช่น 0861111111)
 * 7. create_date (วันที่สร้าง)
 * 8. created_by (ผู้สร้าง โดยนำ username ที่ login มาบันทึก)
 * 9. update_date (อัปเดตล่าสุด)
 * 10. updated_by (ผู้อัปเดต โดยนำ username ที่ login มาบันทึก)
 * 11. is_active (true: เปิดใช้งาน, false: ปิดการใช้งาน)
 * 12. person_flag (2: พนักงาน เท่านั้น)
 * 13. deleted_flag (N: ใช้งานได้, Y: ถูกลบ soft delete)
 */
function setupStaffSheetSchema() {
  try {
    var sheet = getStaffSheet();
    var lastRow = sheet.getLastRow();
    var nowStr = Utilities.formatDate(new Date(), "Asia/Bangkok", "yyyy-MM-dd HH:mm:ss");

    var staffHeaders = [
      "staff_id",     // 1. รหัสพนักงาน (ใช้ login)
      "pwd",          // 2. รหัสผ่าน login (ค่าเริ่มต้นเป็น phone_number)
      "nick_name",    // 3. ชื่อเล่น
      "first_name",   // 4. ชื่อจริง
      "last_name",    // 5. นามสกุล
      "phone_number", // 6. เบอร์โทร (10 หลัก)
      "create_date",  // 7. วันที่สร้าง
      "created_by",   // 8. ผู้สร้าง (username)
      "update_date",  // 9. อัปเดตล่าสุด
      "updated_by",   // 10. ผู้อัปเดต (username)
      "is_active",    // 11. สถานะการใช้งาน (true/false)
      "person_flag",  // 12. ประเภทผู้ใช้ (2: พนักงาน เสมอ)
      "deleted_flag"  // 13. สถานะการลบ (N: ใช้งานได้, Y: ถูกลบ)
    ];

    if (sheet.getMaxColumns() < 13) {
      sheet.insertColumnsAfter(sheet.getMaxColumns(), 13 - sheet.getMaxColumns());
    }

    if (lastRow === 0) {
      sheet.appendRow(staffHeaders);
      var headerRange = sheet.getRange(1, 1, 1, staffHeaders.length);
      headerRange.setBackground("#1B3B36")
        .setFontColor("#FFFFFF")
        .setFontWeight("bold")
        .setHorizontalAlignment("center")
        .setVerticalAlignment("middle");
      sheet.setRowHeight(1, 40);
      sheet.setFrozenRows(1);

      // แถวเริ่มต้น: staff_id = JMC001, pwd = phone_number, person_flag = 2
      sheet.appendRow([
        "JMC001", "0891234567", "หมอน้อย", "สมใจ", "ใจดี", "0891234567",
        nowStr, "admin", nowStr, "admin", true, 2, "N"
      ]);

      try {
        sheet.getRange(2, 1).setNumberFormat("@");
        sheet.getRange(2, 2).setNumberFormat("@");
        sheet.getRange(2, 6).setNumberFormat("@");
      } catch (e) {}

      for (var c = 1; c <= staffHeaders.length; c++) {
        sheet.autoResizeColumn(c);
      }
      return { success: true, message: "สร้างชีตข้อมูลพนักงาน 13 คอลัมน์ (พร้อม pwd) สำเร็จ" };
    }

    // Auto-migrate กรณีมีชีตเดิมอยู่แล้ว
    var row1 = sheet.getRange(1, 1, 1, Math.min(sheet.getMaxColumns(), 16)).getValues()[0];
    var col2Val = String(row1[1] || "").trim().toLowerCase();
    if (col2Val !== "pwd" && row1[0] && String(row1[0]).toLowerCase().indexOf("staff") !== -1) {
      sheet.insertColumnBefore(2);
      if (sheet.getMaxColumns() < 13) {
        sheet.insertColumnsAfter(sheet.getMaxColumns(), 13 - sheet.getMaxColumns());
      }
    }

    var hRange = sheet.getRange(1, 1, 1, staffHeaders.length);
    hRange.setValues([staffHeaders]);
    hRange.setBackground("#1B3B36")
      .setFontColor("#FFFFFF")
      .setFontWeight("bold")
      .setHorizontalAlignment("center")
      .setVerticalAlignment("middle");
    sheet.setRowHeight(1, 40);
    sheet.setFrozenRows(1);

    var totalRows = sheet.getLastRow();
    if (totalRows >= 2) {
      var numRows = totalRows - 1;
      var dataRange = sheet.getRange(2, 1, numRows, 13);
      var values = dataRange.getValues();

      for (var i = 0; i < values.length; i++) {
        // 1. staff_id
        if (!values[i][0] || String(values[i][0]).trim() === "") {
          values[i][0] = "JMC" + ("000" + (i + 1)).slice(-3);
        }
        // 6. phone_number (ตัวเลข 10 หลัก)
        var phoneVal = String(values[i][5] || "").trim();
        var cleanPhone = phoneVal.replace(/[^0-9]/g, '');
        if (cleanPhone.length === 9 && (cleanPhone.charAt(0) === '8' || cleanPhone.charAt(0) === '9' || cleanPhone.charAt(0) === '6')) {
          cleanPhone = "0" + cleanPhone;
        }
        if (cleanPhone.length === 10) {
          values[i][5] = cleanPhone;
        }
        // 2. pwd
        if (!values[i][1] || String(values[i][1]).trim() === "") {
          values[i][1] = cleanPhone || phoneVal || "1234";
        }
        // 7. create_date
        if (!values[i][6] || String(values[i][6]).trim() === "") {
          values[i][6] = nowStr;
        }
        // 8. created_by
        if (!values[i][7] || String(values[i][7]).trim() === "") {
          values[i][7] = "admin";
        }
        // 9. update_date
        if (!values[i][8] || String(values[i][8]).trim() === "") {
          values[i][8] = values[i][6] || nowStr;
        }
        // 10. updated_by
        if (!values[i][9] || String(values[i][9]).trim() === "") {
          values[i][9] = "admin";
        }
        // 11. is_active
        if (values[i][10] === "" || values[i][10] === null || values[i][10] === undefined) {
          values[i][10] = true;
        }
        // 12. person_flag = 2 (พนักงาน เสมอ)
        values[i][11] = 2;
        // 13. deleted_flag
        if (!values[i][12] || String(values[i][12]).trim() === "") {
          values[i][12] = "N";
        }
      }

      dataRange.setValues(values);

      try {
        sheet.getRange(2, 1, numRows, 1).setNumberFormat("@");
        sheet.getRange(2, 2, numRows, 1).setNumberFormat("@");
        sheet.getRange(2, 6, numRows, 1).setNumberFormat("@");
      } catch (e) {}

      sheet.getRange(2, 1, numRows, 1).setHorizontalAlignment("center");
      sheet.getRange(2, 2, numRows, 1).setHorizontalAlignment("center");
      sheet.getRange(2, 6, numRows, 1).setHorizontalAlignment("center");
      sheet.getRange(2, 7, numRows, 4).setHorizontalAlignment("center");
      sheet.getRange(2, 11, numRows, 3).setHorizontalAlignment("center");
    }

    for (var colIdx = 1; colIdx <= staffHeaders.length; colIdx++) {
      sheet.autoResizeColumn(colIdx);
    }

    try {
      var activeSs = SpreadsheetApp.getActiveSpreadsheet();
      if (activeSs && typeof activeSs.toast === "function") {
        activeSs.toast("อัปเดต Schema ข้อมูลพนักงานเป็น 13 คอลัมน์ (พร้อม pwd) เรียบร้อยแล้ว", "สำเร็จ", 5);
      }
    } catch (e) {}

    return { success: true, message: "อัปเดต Schema ข้อมูลพนักงาน 13 คอลัมน์ (พร้อม pwd) และเติมรหัสผ่านเริ่มต้นเรียบร้อยแล้ว" };
  } catch (err) {
    return { success: false, message: "เกิดข้อผิดพลาดในการอัปเดต Schema พนักงาน: " + err.message };
  }
}

/**
 * เริ่มต้นโครงสร้างตารางและสร้างบัญชี Admin / ชีตลูกค้า / ชีตเวลา / ชีตการจอง เริ่มต้น (หากยังไม่มี)
 */
var _isInitializingSheets = false;
function initSheetIfNeeded() {
  if (_isInitializingSheets) return;
  _isInitializingSheets = true;
  try {
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
  setupCustomerSheetSchema();

  // 2.1 ตรวจสอบชีตข้อมูลพนักงาน (Sheet_Name_Staff)
  setupStaffSheetSchema();

  // 3. ตรวจสอบชีต "ตั้งค่าตัวเลือกเวลาการจอง" (Sheet_Name_Setting_Selection_Reservation_Time)
  setupSettingTimeSheetSchema();

  // 3.1 ตรวจสอบชีต "ตั้งค่าตารางการจอง" (Sheet_Name_Setting_Reservation_Timetable)
  setupSettingTimetableSheetSchema();

  // 4. ตรวจสอบชีต "จองคิว" (Sheet_Name_Reservation)
  // ฟิลด์: 2.1.1.1 รหัสการจอง, 2.1.1.2 รหัสลูกค้า, 2.1.1.3 วันที่ที่จอง, 2.1.1.4 เวลาที่จอง, 2.1.1.5 สถานะการจอง, 2.1.1.6 วันที่สร้าง, 2.1.1.7 อัปเดตล่าสุด
  renameReservationSheetIfNeeded();
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
  } catch (err) {
    Logger.log("Error in initSheetIfNeeded: " + err.message);
  } finally {
    _isInitializingSheets = false;
  }
}

/**
 * ตรวจสอบการเข้าสู่ระบบ (Login)
 */
function loginUser(username, password) {
  try {
    initSheetIfNeeded();

    var cleanUsername = String(username || "").trim().toLowerCase();
    var cleanPassword = String(password || "").trim();

    if (!cleanUsername || !cleanPassword) {
      return { success: false, message: "กรุณากรอกชื่อผู้ใช้และรหัสผ่าน" };
    }

    // 1. ตรวจสอบการล็อกอินของพนักงาน (รหัสพนักงานขึ้นต้นด้วย "JMC" ตามด้วยเลข 3 หลัก เช่น JMC001)
    if (cleanUsername.indexOf("jmc") === 0) {
      var staffSheet = getStaffSheet();
      var staffData = staffSheet.getDataRange().getValues();

      if (staffData.length > 1) {
        for (var s = 1; s < staffData.length; s++) {
          var rowStaffId = String(staffData[s][0] || "").trim().toLowerCase();
          if (rowStaffId === cleanUsername) {
            var staffPhone = String(staffData[s][5] || "").trim().replace(/[^0-9]/g, '');
            if (/^\d{9}$/.test(staffPhone)) {
              staffPhone = "0" + staffPhone;
            }
            // password: ครั้งแรกใช้เบอร์โทรศัพท์ phone_number หรือตามฟิลด์ pwd ใน sheet
            var rowStaffPwd = String(staffData[s][1] || "").trim();
            var expectedStaffPwd = rowStaffPwd || staffPhone;

            var staffNickname = String(staffData[s][2] || "").trim();
            var staffFirstname = String(staffData[s][3] || "").trim();
            var staffLastname = String(staffData[s][4] || "").trim();
            var staffIsActive = staffData[s][10];
            var staffDeletedFlag = String(staffData[s][12] || "N").trim().toUpperCase();

            // ตรวจสอบ Soft Delete
            if (staffDeletedFlag === "Y") {
              return { success: false, message: "บัญชีพนักงานนี้ถูกระงับหรือลบข้อมูลออกจากระบบแล้ว" };
            }

            // ตรวจสอบสถานะการเปิดใช้งาน (is_active)
            if (staffIsActive === false || String(staffIsActive).toLowerCase() === "false") {
              return { success: false, message: "บัญชีพนักงานนี้ถูกปิดการใช้งาน กรุณาติดต่อผู้ดูแลระบบ" };
            }

            // ตรวจสอบรหัสผ่าน (ตรงกับ pwd หรือตรงกับเบอร์โทรศัพท์)
            if (cleanPassword === expectedStaffPwd || cleanPassword === staffPhone) {
              return {
                success: true,
                user: {
                  username: String(staffData[s][0] || "").trim(), // e.g. "JMC001"
                  nickname: staffNickname || String(staffData[s][0] || "").trim(),
                  firstname: staffFirstname,
                  lastname: staffLastname,
                  phone: staffPhone,
                  personFlag: 2, // พนักงาน
                  roleTitle: "พนักงาน",
                  isActive: true,
                  displayName: staffNickname ? (staffNickname + (staffFirstname ? " (" + staffFirstname + ")" : "")) : String(staffData[s][0] || "").trim()
                }
              };
            } else {
              return { success: false, message: "รหัสผ่านไม่ถูกต้อง (สำหรับพนักงานเข้าใช้งานครั้งแรก ให้ใช้เบอร์โทรศัพท์)" };
            }
          }
        }
      }
      return { success: false, message: "ไม่พบรหัสพนักงานนี้ในระบบ (" + username + ")" };
    }

    // 2. ตรวจสอบการล็อกอินของลูกค้า (รหัสลูกค้าขึ้นต้นด้วย "JM" ตามด้วยเลข 4 หลัก เช่น JM0001)
    if (cleanUsername.indexOf("jm") === 0) {
      var custSheet = getCustomerSheet();
      var custData = custSheet.getDataRange().getValues();

      if (custData.length > 1) {
        for (var c = 1; c < custData.length; c++) {
          var rowCustId = String(custData[c][0] || "").trim().toLowerCase();
          if (rowCustId === cleanUsername) {
            var custPhone = String(custData[c][5] || "").trim().replace(/[^0-9]/g, '');
            if (/^\d{9}$/.test(custPhone)) {
              custPhone = "0" + custPhone;
            }
            // password: ครั้งแรกใช้เบอร์โทรศัพท์ phone_number หรือตามฟิลด์ pwd ใน sheet
            var rowCustPwd = String(custData[c][1] || "").trim();
            var expectedCustPwd = rowCustPwd || custPhone;

            var custNickname = String(custData[c][2] || "").trim();
            var custFirstname = String(custData[c][3] || "").trim();
            var custLastname = String(custData[c][4] || "").trim();
            var custIsActive = custData[c][10];
            var custDeletedFlag = String(custData[c][12] || "N").trim().toUpperCase();

            // ตรวจสอบ Soft Delete
            if (custDeletedFlag === "Y") {
              return { success: false, message: "บัญชีลูกค้านี้ถูกระงับหรือลบข้อมูลออกจากระบบแล้ว" };
            }

            // ตรวจสอบสถานะการเปิดใช้งาน (is_active)
            if (custIsActive === false || String(custIsActive).toLowerCase() === "false") {
              return { success: false, message: "บัญชีลูกค้านี้ถูกปิดการใช้งาน กรุณาติดต่อทางร้าน" };
            }

            // ตรวจสอบรหัสผ่าน (ตรงกับ pwd หรือตรงกับเบอร์โทรศัพท์)
            if (cleanPassword === expectedCustPwd || cleanPassword === custPhone) {
              return {
                success: true,
                user: {
                  username: String(custData[c][0] || "").trim(), // e.g. "JM0001"
                  nickname: custNickname || String(custData[c][0] || "").trim(),
                  firstname: custFirstname,
                  lastname: custLastname,
                  phone: custPhone,
                  personFlag: 1, // ลูกค้า
                  roleTitle: "ลูกค้า",
                  isActive: true,
                  displayName: custNickname ? (custNickname + (custFirstname ? " (" + custFirstname + ")" : "")) : String(custData[c][0] || "").trim()
                }
              };
            } else {
              return { success: false, message: "รหัสผ่านไม่ถูกต้อง (สำหรับลูกค้าเข้าใช้งานครั้งแรก ให้ใช้เบอร์โทรศัพท์)" };
            }
          }
        }
      }
      return { success: false, message: "ไม่พบรหัสลูกค้านี้ในระบบ (" + username + ")" };
    }

    // 3. ตรวจสอบการล็อกอินของผู้ดูแลระบบ (Admin Sheet)
    var sheet = getAdminSheet();
    var data = sheet.getDataRange().getValues();
    
    if (data.length <= 1) {
      return { success: false, message: "ไม่พบข้อมูลผู้ใช้งานในระบบ" };
    }

    for (var i = 1; i < data.length; i++) {
      var rowUser = String(data[i][0] || "").trim().toLowerCase();
      var rowPass = String(data[i][1] || "").trim();
      var nickname = String(data[i][2] || "").trim();
      var firstname = String(data[i][3] || "").trim();
      var lastname = String(data[i][4] || "").trim();
      var isActiveVal = data[i][9];
      var parsedFlag = parseInt(data[i][10], 10);
      var personFlag = isNaN(parsedFlag) ? (rowUser === "admin" ? 9 : 8) : parsedFlag;
      var roleTitle = "ผู้ใช้งาน";
      if (personFlag === 9) roleTitle = "ผู้ดูแลระบบสูงสุด";
      else if (personFlag === 8) roleTitle = "ผู้ดูแลระบบ";
      else if (personFlag === 2) roleTitle = "พนักงาน";
      else if (personFlag === 1) roleTitle = "ลูกค้า";
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
 * ค้นหาข้อมูลผู้ดูแลระบบ, ลูกค้า หรือพนักงานตาม username
 */
function getAdminRecord(username) {
  try {
    var cleanUser = String(username || "").trim().toLowerCase();
    if (!cleanUser) return null;

    // 1. ตรวจสอบในชีตข้อมูลผู้ดูแลระบบ
    var sheet = getAdminSheet();
    var data = sheet.getDataRange().getValues();
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

    // 2. หากไม่พบใน Admin Sheet ให้ค้นหาในชีตข้อมูลลูกค้า (Customer Sheet)
    var custSheet = getCustomerSheet();
    var custData = custSheet.getDataRange().getValues();
    if (custData.length > 1) {
      for (var j = 1; j < custData.length; j++) {
        var custId = String(custData[j][0] || "").trim().toLowerCase();
        if (custId === cleanUser) {
          var custPhone = String(custData[j][5] || "").trim().replace(/[^0-9]/g, '');
          if (/^\d{9}$/.test(custPhone)) {
            custPhone = "0" + custPhone;
          }
          var custPwd = String(custData[j][1] || "").trim() || custPhone;
          return {
            rowIndex: j + 1,
            username: String(custData[j][0] || "").trim(),
            password: custPwd,
            nickname: String(custData[j][2] || "").trim(),
            firstname: String(custData[j][3] || "").trim(),
            lastname: String(custData[j][4] || "").trim(),
            phone: custPhone,
            createdAt: custData[j][6],
            createdBy: String(custData[j][7] || "").trim(),
            updatedAt: custData[j][8],
            updatedBy: String(custData[j][9] || "").trim(),
            isActive: (custData[j][10] === false || String(custData[j][10]).toLowerCase() === "false") ? false : true,
            personFlag: 1, // ลูกค้า
            deletedFlag: String(custData[j][12] || "N").trim().toUpperCase()
          };
        }
      }
    }

    // 3. หากไม่พบ ให้ค้นหาในชีตข้อมูลพนักงาน (Staff Sheet)
    var staffSheet = getStaffSheet();
    var staffData = staffSheet.getDataRange().getValues();
    if (staffData.length > 1) {
      for (var k = 1; k < staffData.length; k++) {
        var staffId = String(staffData[k][0] || "").trim().toLowerCase();
        if (staffId === cleanUser) {
          var staffPhone = String(staffData[k][5] || "").trim().replace(/[^0-9]/g, '');
          if (/^\d{9}$/.test(staffPhone)) {
            staffPhone = "0" + staffPhone;
          }
          var staffPwd = String(staffData[k][1] || "").trim() || staffPhone;
          return {
            rowIndex: k + 1,
            username: String(staffData[k][0] || "").trim(),
            password: staffPwd,
            nickname: String(staffData[k][2] || "").trim(),
            firstname: String(staffData[k][3] || "").trim(),
            lastname: String(staffData[k][4] || "").trim(),
            phone: staffPhone,
            createdAt: staffData[k][6],
            createdBy: String(staffData[k][7] || "").trim(),
            updatedAt: staffData[k][8],
            updatedBy: String(staffData[k][9] || "").trim(),
            isActive: (staffData[k][10] === false || String(staffData[k][10]).toLowerCase() === "false") ? false : true,
            personFlag: 2, // พนักงาน
            deletedFlag: String(staffData[k][12] || "N").trim().toUpperCase()
          };
        }
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
      var requesterRecord = getAdminRecord(cleanRequester);
      if (!requesterRecord || requesterRecord.deletedFlag === "Y" || !requesterRecord.isActive) {
        return {
          success: false,
          message: "บัญชีของคุณถูกระงับ ปิดการใช้งาน หรือไม่มีสิทธิ์เข้าถึงข้อมูลผู้ดูแลระบบ"
        };
      }
      requesterFlag = requesterRecord.personFlag;
      if (requesterFlag !== 8 && requesterFlag !== 9 && cleanRequester !== "admin") {
        return {
          success: false,
          message: "คุณไม่มีสิทธิ์เข้าถึงข้อมูลผู้ดูแลระบบ"
        };
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
      personFlag: requesterFlag,
      roleTitle: (requesterFlag === 9) ? "ผู้ดูแลระบบสูงสุด" : "ผู้ดูแลระบบ",
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
// Schema 12 คอลัมน์:
// 1. customer_id, 2. nick_name, 3. first_name, 4. last_name, 5. phone_number,
// 6. create_date, 7. created_by, 8. update_date, 9. updated_by, 10. is_active,
// 11. person_flag (ค่า 1: ลูกค้า), 12. deleted_flag (N: ใช้งานได้, Y: ถูกลบ)
// ==============================================================================

/**
 * สร้างรหัสลูกค้าอัตโนมัติ (Pattern: JM ตามด้วยตัวเลข 4 หลัก เริ่มต้น JM0001)
 * รันลำดับ number ถัดไปเสมอเมื่อทำการเพิ่มข้อมูลลูกค้าใหม่
 * โดยตรวจสอบจากทุกแถวใน Sheet (รวมแถวที่ถูก Soft Delete) เพื่อไม่ให้รหัสซ้ำค่าเดิม
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
 * ดึงรายการข้อมูลลูกค้า
 * - ผู้ดูแลระบบ (8, 9): เห็นข้อมูลลูกค้าทุกคน (เฉพาะที่ deleted_flag !== 'Y')
 * - ลูกค้า (1): เห็นได้เฉพาะข้อมูลของตัวเองเท่านั้น
 * - พนักงาน (2): ไม่มีสิทธิ์เข้าถึง
 */
function getCustomers(requesterUsername) {
  try {
    initSheetIfNeeded();
    var sheet = getCustomerSheet();
    var data = sheet.getDataRange().getValues();
    var customerList = [];

    var cleanRequester = String(requesterUsername || "").trim().toLowerCase();
    var requesterRecord = cleanRequester ? getAdminRecord(cleanRequester) : null;
    var requesterFlag = requesterRecord ? requesterRecord.personFlag : 9;

    // ถ้าเป็นพนักงาน (person_flag = 2) ไม่มีสิทธิ์เข้าถึงข้อมูลลูกค้า
    if (requesterRecord && requesterFlag === 2) {
      return { success: false, message: "พนักงานไม่มีสิทธิ์เข้าถึงข้อมูลลูกค้า" };
    }

    if (data.length > 1) {
      for (var i = 1; i < data.length; i++) {
        var customerId = String(data[i][0] || "").trim();
        var pwd = String(data[i][1] || "").trim();
        var nickname = String(data[i][2] || "").trim();
        var firstname = String(data[i][3] || "").trim();
        var lastname = String(data[i][4] || "").trim();
        var phone = String(data[i][5] || "").trim().replace(/[^0-9]/g, '');
        if (/^\d{9}$/.test(phone)) {
          phone = "0" + phone;
        }
        var createDate = data[i][6] ? formatDateDisplay(data[i][6]) : "-";
        var createdBy = String(data[i][7] || "").trim() || "-";
        var updateDate = data[i][8] ? formatDateDisplay(data[i][8]) : "-";
        var updatedBy = String(data[i][9] || "").trim() || "-";
        var isActive = (data[i][10] === false || String(data[i][10]).toLowerCase() === "false") ? false : true;
        var personFlag = parseInt(data[i][11], 10) || 1;
        var deletedFlag = String(data[i][12] || "N").trim().toUpperCase();

        // หากแถวว่างเปล่าให้ข้าม
        if (!customerId && !nickname && !phone) continue;

        // Soft Delete Check: ถ้ามีค่า deleted_flag เป็น "Y" ให้ข้าม ไม่นำมาแสดงผล
        if (deletedFlag === "Y") continue;

        // ถ้าเป็นลูกค้า (person_flag = 1): ดูได้เฉพาะข้อมูลของตนเอง
        if (requesterRecord && requesterFlag === 1) {
          var matchId = (customerId.toLowerCase() === cleanRequester);
          var matchNick = (nickname && requesterRecord.nickname && nickname.toLowerCase() === requesterRecord.nickname.toLowerCase());
          var matchName = (firstname && requesterRecord.firstname && firstname.toLowerCase() === requesterRecord.firstname.toLowerCase());
          if (!matchId && !matchNick && !matchName) {
            continue;
          }
        }

        customerList.push({
          rowId: i + 1, // 1-based row index in Google Sheet
          customerId: customerId || "-",
          pwd: pwd || phone,
          nickname: nickname,
          firstname: firstname,
          lastname: lastname,
          phone: phone,
          createDate: createDate,
          createdBy: createdBy,
          updateDate: updateDate,
          updatedBy: updatedBy,
          isActive: isActive,
          personFlag: personFlag,
          roleTitle: "ลูกค้า",
          deletedFlag: deletedFlag
        });
      }
    }

    return {
      success: true,
      sheetName: SHEET_NAME_CUSTOMER,
      personFlag: requesterFlag,
      data: customerList
    };
  } catch (err) {
    return { success: false, message: "ไม่สามารถดึงข้อมูลลูกค้าได้: " + err.message };
  }
}

/**
 * เพิ่มข้อมูลลูกค้าใหม่ (สร้างรหัสอัตโนมัติ เช่น JM0001, JM0002)
 * @param {object} customerData { nickname, firstname, lastname, phone, password, isActive, createdBy }
 */
function addCustomer(customerData) {
  try {
    initSheetIfNeeded();
    var sheet = getCustomerSheet();
    var customerId = generateNextCustomerId();
    var nickname = String(customerData.nickname || "").trim();
    var firstname = String(customerData.firstname || "").trim();
    var lastname = String(customerData.lastname || "").trim();
    var rawPhone = String(customerData.phone || "").trim();
    var phone = rawPhone.replace(/[^0-9]/g, '');
    // รหัสผ่าน: หากไม่ระบุ ให้ใช้เบอร์โทรศัพท์ phone_number เป็นรหัสผ่านเริ่มต้น
    var password = String(customerData.password || customerData.pwd || "").trim();
    if (!password) {
      password = phone;
    }
    var createdBy = String(customerData.createdBy || "admin").trim();
    var updatedBy = createdBy;
    var isActive = (customerData.isActive !== false && String(customerData.isActive).toLowerCase() !== "false");
    var personFlag = 1; // หน้าจอข้อมูลลูกค้า กำหนดเป็น 1 เสมอ
    var deletedFlag = "N"; // ใช้งานได้

    // ตรวจสอบสิทธิ์: ผู้ดูแลระบบ (8) และ ผู้ดูแลระบบระดับสูงสุด (9) เท่านั้นที่เพิ่มลูกค้าได้
    var creatorRecord = createdBy ? getAdminRecord(createdBy) : null;
    var creatorFlag = creatorRecord ? creatorRecord.personFlag : 9;
    if (creatorFlag !== 9 && creatorFlag !== 8) {
      return { success: false, message: "เฉพาะผู้ดูแลระบบ (person_flag = 8 หรือ 9) เท่านั้นที่สามารถเพิ่มข้อมูลลูกค้าได้" };
    }

    // ชื่อเล่น (Required)
    if (!nickname) {
      return { success: false, message: "กรุณากรอก 'ชื่อเล่น' ของลูกค้า" };
    }
    // เบอร์โทร (Required - ต้องเป็นตัวเลข 10 หลักเท่านั้น เช่น 0861111111)
    if (!rawPhone) {
      return { success: false, message: "กรุณากรอก 'เบอร์โทรศัพท์' ของลูกค้า" };
    }
    if (!/^[0-9]{10}$/.test(phone)) {
      return { success: false, message: "เบอร์โทรศัพท์ต้องเป็นตัวเลข 10 หลักเท่านั้น (เช่น 0861111111)" };
    }

    var nowStr = Utilities.formatDate(new Date(), "Asia/Bangkok", "yyyy-MM-dd HH:mm:ss");

    // ฟิลด์ตาม Schema 13 คอลัมน์:
    // 1. customer_id, 2. pwd, 3. nick_name, 4. first_name, 5. last_name, 6. phone_number,
    // 7. create_date, 8. created_by, 9. update_date, 10. updated_by, 11. is_active,
    // 12. person_flag, 13. deleted_flag
    sheet.appendRow([
      customerId,
      password,
      nickname,
      firstname,
      lastname,
      phone,
      nowStr,
      createdBy,
      nowStr,
      updatedBy,
      isActive,
      personFlag,
      deletedFlag
    ]);

    var newRow = sheet.getLastRow();
    try {
      sheet.getRange(newRow, 1).setNumberFormat("@");
      sheet.getRange(newRow, 2).setNumberFormat("@").setValue(password);
      sheet.getRange(newRow, 6).setNumberFormat("@").setValue(phone);
      sheet.getRange(newRow, 1, 1, 2).setHorizontalAlignment("center");
      sheet.getRange(newRow, 6).setHorizontalAlignment("center");
      sheet.getRange(newRow, 7, 1, 4).setHorizontalAlignment("center");
      sheet.getRange(newRow, 11, 1, 3).setHorizontalAlignment("center");
    } catch (e) {}

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
 * แก้ไขข้อมูลลูกค้า (รหัสลูกค้า customer_id เป็น readonly ไม่เปลี่ยนแปลง)
 * @param {object} customerData { rowId, nickname, firstname, lastname, phone, password, isActive, updatedBy }
 */
function updateCustomer(customerData) {
  try {
    var sheet = getCustomerSheet();
    var rowId = parseInt(customerData.rowId, 10);
    var nickname = String(customerData.nickname || "").trim();
    var firstname = String(customerData.firstname || "").trim();
    var lastname = String(customerData.lastname || "").trim();
    var rawPhone = String(customerData.phone || "").trim();
    var phone = rawPhone.replace(/[^0-9]/g, '');
    var password = String(customerData.password || customerData.pwd || "").trim();
    var updatedBy = String(customerData.updatedBy || "admin").trim();
    var isActive = (customerData.isActive !== false && String(customerData.isActive).toLowerCase() !== "false");

    if (isNaN(rowId) || rowId < 2 || rowId > sheet.getLastRow()) {
      return { success: false, message: "ไม่พบตำแหน่งข้อมูลลูกค้าที่ต้องการแก้ไข" };
    }

    // ตรวจสอบสิทธิ์การแก้ไขข้อมูลลูกค้า
    var updaterRecord = updatedBy ? getAdminRecord(updatedBy) : null;
    var updaterFlag = updaterRecord ? updaterRecord.personFlag : 9;

    // ลูกค้า (person_flag = 1): อนุญาตให้แก้ไขได้เฉพาะข้อมูลของตัวเองเท่านั้น
    if (updaterFlag === 1) {
      var currentCustomerId = String(sheet.getRange(rowId, 1).getValue() || "").trim().toLowerCase();
      var cleanUpdater = updatedBy.toLowerCase();
      if (currentCustomerId !== cleanUpdater) {
        return { success: false, message: "ลูกค้าสามารถแก้ไขได้เฉพาะข้อมูลของตนเองเท่านั้น" };
      }
    } else if (updaterFlag !== 9 && updaterFlag !== 8) {
      return { success: false, message: "คุณไม่มีสิทธิ์แก้ไขข้อมูลลูกค้า" };
    }

    if (!nickname) {
      return { success: false, message: "กรุณากรอก 'ชื่อเล่น' ของลูกค้า" };
    }
    // เบอร์โทร (Required - ต้องเป็นตัวเลข 10 หลักเท่านั้น เช่น 0861111111)
    if (!rawPhone) {
      return { success: false, message: "กรุณากรอก 'เบอร์โทรศัพท์' ของลูกค้า" };
    }
    if (!/^[0-9]{10}$/.test(phone)) {
      return { success: false, message: "เบอร์โทรศัพท์ต้องเป็นตัวเลข 10 หลักเท่านั้น (เช่น 0861111111)" };
    }

    var nowStr = Utilities.formatDate(new Date(), "Asia/Bangkok", "yyyy-MM-dd HH:mm:ss");

    // คอลัมน์ 1 (customer_id) ห้ามแก้ไข
    // คอลัมน์ 2 (pwd) แก้ไขเมื่อมีการกรอกรหัสผ่านใหม่
    if (password) {
      sheet.getRange(rowId, 2).setNumberFormat("@").setValue(password);
    }
    sheet.getRange(rowId, 3).setValue(nickname);     // 3. nick_name
    sheet.getRange(rowId, 4).setValue(firstname);    // 4. first_name
    sheet.getRange(rowId, 5).setValue(lastname);     // 5. last_name
    sheet.getRange(rowId, 6).setNumberFormat("@").setValue(phone);        // 6. phone_number
    sheet.getRange(rowId, 9).setValue(nowStr);       // 9. update_date
    sheet.getRange(rowId, 10).setValue(updatedBy);   // 10. updated_by
    sheet.getRange(rowId, 11).setValue(isActive);    // 11. is_active
    sheet.getRange(rowId, 12).setValue(1);           // 12. person_flag = 1 (ลูกค้า)

    return {
      success: true,
      message: "แก้ไขข้อมูลลูกค้า '" + nickname + "' เรียบร้อยแล้ว"
    };
  } catch (err) {
    return { success: false, message: "เกิดข้อผิดพลาดในการแก้ไขข้อมูลลูกค้า: " + err.message };
  }
}

/**
 * ลบข้อมูลลูกค้า (Soft Delete)
 * ไม่ลบแถวทิ้ง แต่เปลี่ยนค่า deleted_flag เป็น 'Y' พร้อมบันทึก update_date, updated_by และตั้ง is_active = false
 * @param {number|object} rowId
 * @param {string} [updatedBy]
 */
function deleteCustomer(rowId, updatedBy) {
  try {
    var sheet = getCustomerSheet();
    var targetRow = (typeof rowId === "object" && rowId !== null) ? parseInt(rowId.rowId, 10) : parseInt(rowId, 10);
    var userWhoDeleted = (typeof rowId === "object" && rowId !== null && rowId.updatedBy) ? String(rowId.updatedBy).trim() : String(updatedBy || "admin").trim();

    if (isNaN(targetRow) || targetRow < 2 || targetRow > sheet.getLastRow()) {
      return { success: false, message: "ไม่พบตำแหน่งข้อมูลลูกค้าที่ต้องการลบ" };
    }

    // ตรวจสอบสิทธิ์: เฉพาะผู้ดูแลระบบระดับสูงสุด (person_flag = 9) เท่านั้นที่สามารถลบข้อมูลลูกค้าได้
    var deleterRecord = userWhoDeleted ? getAdminRecord(userWhoDeleted) : null;
    var deleterFlag = deleterRecord ? deleterRecord.personFlag : 9;
    if (deleterFlag !== 9) {
      return { success: false, message: "เฉพาะผู้ดูแลระบบระดับสูงสุด (person_flag = 9) เท่านั้นที่สามารถลบข้อมูลลูกค้าได้" };
    }

    var nowStr = Utilities.formatDate(new Date(), "Asia/Bangkok", "yyyy-MM-dd HH:mm:ss");

    // Soft delete: เปลี่ยนค่าในคอลัมน์ที่เกี่ยวข้องตาม Schema 13 คอลัมน์
    sheet.getRange(targetRow, 9).setValue(nowStr);          // 9. update_date
    sheet.getRange(targetRow, 10).setValue(userWhoDeleted); // 10. updated_by
    sheet.getRange(targetRow, 11).setValue(false);          // 11. is_active = false
    sheet.getRange(targetRow, 13).setValue("Y");            // 13. deleted_flag = 'Y'

    return {
      success: true,
      message: "ลบข้อมูลลูกค้าเรียบร้อยแล้ว"
    };
  } catch (err) {
    return { success: false, message: "เกิดข้อผิดพลาดในการลบข้อมูลลูกค้า: " + err.message };
  }
}

// ==============================================================================
// CRUD: ข้อมูลพนักงาน (Staff Management - Sheet_Name_Staff)
// Schema 13 คอลัมน์:
// 1. staff_id (ขึ้นต้นด้วย JMC ตามด้วยเลข 3 หลัก เช่น JMC001, JMC002...)
// 2. pwd (รหัสผ่าน login ค่าเริ่มต้นเป็น phone_number)
// 3. nick_name (ชื่อเล่น)
// 4. first_name (ชื่อจริง)
// 5. last_name (นามสกุล)
// 6. phone_number (เบอร์โทร ตัวเลข 10 หลักล้วน)
// 7. create_date (วันที่สร้าง)
// 8. created_by (ผู้สร้าง โดยนำ username ที่ login มาบันทึก)
// 9. update_date (อัปเดตล่าสุด)
// 10. updated_by (ผู้อัปเดต โดยนำ username ที่ login มาบันทึก)
// 11. is_active (true/false)
// 12. person_flag (2: พนักงาน เสมอ)
// 13. deleted_flag (N: ใช้งานได้, Y: ถูกลบ soft delete)
// ==============================================================================

/**
 * สร้างรหัสพนักงานอัตโนมัติ (Pattern: JMC ตามด้วยตัวเลข 3 หลัก เริ่มต้น JMC001)
 * รันลำดับ number ถัดไปเสมอเมื่อทำการเพิ่มข้อมูลพนักงานใหม่
 * โดยตรวจสอบจากทุกแถวใน Sheet (รวมแถวที่ถูก Soft Delete) เพื่อไม่ให้รหัสซ้ำค่าเดิม
 */
function generateNextStaffId() {
  var sheet = getStaffSheet();
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) {
    return "JMC001";
  }

  var idValues = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  var maxNum = 0;

  for (var i = 0; i < idValues.length; i++) {
    var val = String(idValues[i][0] || "").trim();
    var match = val.match(/^JMC(\d+)$/i);
    if (match) {
      var num = parseInt(match[1], 10);
      if (num > maxNum) {
        maxNum = num;
      }
    }
  }

  var nextNum = maxNum + 1;
  return nextNum < 1000 ? "JMC" + ("000" + nextNum).slice(-3) : "JMC" + nextNum;
}

/**
 * ดึงรายการข้อมูลพนักงาน
 * - ผู้ดูแลระบบ (8, 9): เห็นข้อมูลพนักงานทุกคน (เฉพาะที่ deleted_flag !== 'Y')
 * - พนักงาน (2): เห็นได้เฉพาะข้อมูลของตัวเองเท่านั้น
 * - ลูกค้า (1): ไม่มีสิทธิ์เข้าถึง
 */
function getStaffs(requesterUsername) {
  try {
    initSheetIfNeeded();
    var sheet = getStaffSheet();
    var data = sheet.getDataRange().getValues();
    var staffList = [];

    var cleanRequester = String(requesterUsername || "").trim().toLowerCase();
    var requesterRecord = cleanRequester ? getAdminRecord(cleanRequester) : null;
    var requesterFlag = requesterRecord ? requesterRecord.personFlag : 9;

    // ถ้าเป็นลูกค้า (person_flag = 1) ไม่มีสิทธิ์เข้าถึงข้อมูลพนักงาน
    if (requesterRecord && requesterFlag === 1) {
      return { success: false, message: "ลูกค้าไม่มีสิทธิ์เข้าถึงข้อมูลพนักงาน" };
    }

    if (data.length > 1) {
      for (var i = 1; i < data.length; i++) {
        var staffId = String(data[i][0] || "").trim();
        var pwd = String(data[i][1] || "").trim();
        var nickname = String(data[i][2] || "").trim();
        var firstname = String(data[i][3] || "").trim();
        var lastname = String(data[i][4] || "").trim();
        var phone = String(data[i][5] || "").trim().replace(/[^0-9]/g, '');
        if (/^\d{9}$/.test(phone)) {
          phone = "0" + phone;
        }
        var createDate = data[i][6] ? formatDateDisplay(data[i][6]) : "-";
        var createdBy = String(data[i][7] || "").trim() || "-";
        var updateDate = data[i][8] ? formatDateDisplay(data[i][8]) : "-";
        var updatedBy = String(data[i][9] || "").trim() || "-";
        var isActive = (data[i][10] === false || String(data[i][10]).toLowerCase() === "false") ? false : true;
        var personFlag = parseInt(data[i][11], 10) || 2;
        var deletedFlag = String(data[i][12] || "N").trim().toUpperCase();

        // หากแถวว่างเปล่าให้ข้าม
        if (!staffId && !nickname && !phone) continue;

        // Soft Delete Check: ถ้ามีค่า deleted_flag เป็น "Y" ให้ข้าม ไม่นำมาแสดงผล
        if (deletedFlag === "Y") continue;

        // ถ้าเป็นพนักงาน (person_flag = 2): ดูได้เฉพาะข้อมูลของตนเอง
        if (requesterRecord && requesterFlag === 2) {
          var matchId = (staffId.toLowerCase() === cleanRequester);
          var matchNick = (nickname && requesterRecord.nickname && nickname.toLowerCase() === requesterRecord.nickname.toLowerCase());
          var matchName = (firstname && requesterRecord.firstname && firstname.toLowerCase() === requesterRecord.firstname.toLowerCase());
          if (!matchId && !matchNick && !matchName) {
            continue;
          }
        }

        staffList.push({
          rowId: i + 1, // 1-based row index in Google Sheet
          staffId: staffId || "-",
          pwd: pwd || phone,
          nickname: nickname,
          firstname: firstname,
          lastname: lastname,
          phone: phone,
          createDate: createDate,
          createdBy: createdBy,
          updateDate: updateDate,
          updatedBy: updatedBy,
          isActive: isActive,
          personFlag: personFlag,
          roleTitle: "พนักงาน",
          deletedFlag: deletedFlag
        });
      }
    }

    return {
      success: true,
      sheetName: SHEET_NAME_STAFF,
      personFlag: requesterFlag,
      data: staffList
    };
  } catch (err) {
    return { success: false, message: "ไม่สามารถดึงข้อมูลพนักงานได้: " + err.message };
  }
}

/**
 * เพิ่มข้อมูลพนักงานใหม่ (สร้างรหัสอัตโนมัติ เช่น JMC001, JMC002)
 * @param {object} staffData { nickname, firstname, lastname, phone, password, isActive, createdBy }
 */
function addStaff(staffData) {
  try {
    initSheetIfNeeded();
    var sheet = getStaffSheet();
    var staffId = generateNextStaffId();
    var nickname = String(staffData.nickname || "").trim();
    var firstname = String(staffData.firstname || "").trim();
    var lastname = String(staffData.lastname || "").trim();
    var rawPhone = String(staffData.phone || "").trim();
    var phone = rawPhone.replace(/[^0-9]/g, '');
    // รหัสผ่าน: หากไม่ระบุ ให้ใช้เบอร์โทรศัพท์ phone_number เป็นรหัสผ่านเริ่มต้น
    var password = String(staffData.password || staffData.pwd || "").trim();
    if (!password) {
      password = phone;
    }
    var createdBy = String(staffData.createdBy || "admin").trim();
    var updatedBy = createdBy;
    var isActive = (staffData.isActive !== false && String(staffData.isActive).toLowerCase() !== "false");
    var personFlag = 2; // หน้าจอข้อมูลพนักงาน กำหนดเป็น 2 เสมอ
    var deletedFlag = "N"; // ใช้งานได้

    // ตรวจสอบสิทธิ์: ผู้ดูแลระบบ (8) และ ผู้ดูแลระบบระดับสูงสุด (9) เท่านั้นที่เพิ่มพนักงานได้
    var creatorRecord = createdBy ? getAdminRecord(createdBy) : null;
    var creatorFlag = creatorRecord ? creatorRecord.personFlag : 9;
    if (creatorFlag !== 9 && creatorFlag !== 8) {
      return { success: false, message: "เฉพาะผู้ดูแลระบบ (person_flag = 8 หรือ 9) เท่านั้นที่สามารถเพิ่มข้อมูลพนักงานได้" };
    }

    // ชื่อเล่น (Required)
    if (!nickname) {
      return { success: false, message: "กรุณากรอก 'ชื่อเล่น' ของพนักงาน" };
    }
    // เบอร์โทร (Required - ต้องเป็นตัวเลข 10 หลักเท่านั้น เช่น 0861111111)
    if (!rawPhone) {
      return { success: false, message: "กรุณากรอก 'เบอร์โทรศัพท์' ของพนักงาน" };
    }
    if (!/^[0-9]{10}$/.test(phone)) {
      return { success: false, message: "เบอร์โทรศัพท์ต้องเป็นตัวเลข 10 หลักเท่านั้น (เช่น 0861111111)" };
    }

    var nowStr = Utilities.formatDate(new Date(), "Asia/Bangkok", "yyyy-MM-dd HH:mm:ss");

    // ฟิลด์ตาม Schema 13 คอลัมน์:
    // 1. staff_id, 2. pwd, 3. nick_name, 4. first_name, 5. last_name, 6. phone_number,
    // 7. create_date, 8. created_by, 9. update_date, 10. updated_by, 11. is_active,
    // 12. person_flag, 13. deleted_flag
    sheet.appendRow([
      staffId,
      password,
      nickname,
      firstname,
      lastname,
      phone,
      nowStr,
      createdBy,
      nowStr,
      updatedBy,
      isActive,
      personFlag,
      deletedFlag
    ]);

    var newRow = sheet.getLastRow();
    try {
      sheet.getRange(newRow, 1).setNumberFormat("@");
      sheet.getRange(newRow, 2).setNumberFormat("@").setValue(password);
      sheet.getRange(newRow, 6).setNumberFormat("@").setValue(phone);
      sheet.getRange(newRow, 1, 1, 2).setHorizontalAlignment("center");
      sheet.getRange(newRow, 6).setHorizontalAlignment("center");
      sheet.getRange(newRow, 7, 1, 4).setHorizontalAlignment("center");
      sheet.getRange(newRow, 11, 1, 3).setHorizontalAlignment("center");
    } catch (e) {}

    return {
      success: true,
      staffId: staffId,
      message: "เพิ่มข้อมูลพนักงาน '" + nickname + "' (รหัส: " + staffId + ") เรียบร้อยแล้ว"
    };
  } catch (err) {
    return { success: false, message: "เกิดข้อผิดพลาดในการเพิ่มข้อมูลพนักงาน: " + err.message };
  }
}

/**
 * แก้ไขข้อมูลพนักงาน (รหัสพนักงาน staff_id เป็น readonly ไม่เปลี่ยนแปลง)
 * @param {object} staffData { rowId, nickname, firstname, lastname, phone, password, isActive, updatedBy }
 */
function updateStaff(staffData) {
  try {
    var sheet = getStaffSheet();
    var rowId = parseInt(staffData.rowId, 10);
    var nickname = String(staffData.nickname || "").trim();
    var firstname = String(staffData.firstname || "").trim();
    var lastname = String(staffData.lastname || "").trim();
    var rawPhone = String(staffData.phone || "").trim();
    var phone = rawPhone.replace(/[^0-9]/g, '');
    var password = String(staffData.password || staffData.pwd || "").trim();
    var updatedBy = String(staffData.updatedBy || "admin").trim();
    var isActive = (staffData.isActive !== false && String(staffData.isActive).toLowerCase() !== "false");

    if (isNaN(rowId) || rowId < 2 || rowId > sheet.getLastRow()) {
      return { success: false, message: "ไม่พบตำแหน่งข้อมูลพนักงานที่ต้องการแก้ไข" };
    }

    // ตรวจสอบสิทธิ์การแก้ไขข้อมูลพนักงาน
    var updaterRecord = updatedBy ? getAdminRecord(updatedBy) : null;
    var updaterFlag = updaterRecord ? updaterRecord.personFlag : 9;

    // พนักงาน (person_flag = 2): อนุญาตให้แก้ไขได้เฉพาะข้อมูลของตัวเองเท่านั้น
    if (updaterFlag === 2) {
      var currentStaffId = String(sheet.getRange(rowId, 1).getValue() || "").trim().toLowerCase();
      var cleanUpdater = updatedBy.toLowerCase();
      if (currentStaffId !== cleanUpdater) {
        return { success: false, message: "พนักงานสามารถแก้ไขได้เฉพาะข้อมูลของตนเองเท่านั้น" };
      }
      isActive = true; // พนักงานแก้ไขโปรไฟล์ตนเอง ห้ามปิดสถานะ
    } else if (updaterFlag !== 9 && updaterFlag !== 8) {
      return { success: false, message: "คุณไม่มีสิทธิ์แก้ไขข้อมูลพนักงาน" };
    }

    if (!nickname) {
      return { success: false, message: "กรุณากรอก 'ชื่อเล่น' ของพนักงาน" };
    }
    // เบอร์โทร (Required - ต้องเป็นตัวเลข 10 หลักเท่านั้น เช่น 0861111111)
    if (!rawPhone) {
      return { success: false, message: "กรุณากรอก 'เบอร์โทรศัพท์' ของพนักงาน" };
    }
    if (!/^[0-9]{10}$/.test(phone)) {
      return { success: false, message: "เบอร์โทรศัพท์ต้องเป็นตัวเลข 10 หลักเท่านั้น (เช่น 0861111111)" };
    }

    var nowStr = Utilities.formatDate(new Date(), "Asia/Bangkok", "yyyy-MM-dd HH:mm:ss");

    // คอลัมน์ 1 (staff_id) ห้ามแก้ไข
    // คอลัมน์ 2 (pwd) แก้ไขเมื่อมีการกรอกรหัสผ่านใหม่
    if (password) {
      sheet.getRange(rowId, 2).setNumberFormat("@").setValue(password);
    }
    sheet.getRange(rowId, 3).setValue(nickname);     // 3. nick_name
    sheet.getRange(rowId, 4).setValue(firstname);    // 4. first_name
    sheet.getRange(rowId, 5).setValue(lastname);     // 5. last_name
    sheet.getRange(rowId, 6).setNumberFormat("@").setValue(phone);        // 6. phone_number
    sheet.getRange(rowId, 9).setValue(nowStr);       // 9. update_date
    sheet.getRange(rowId, 10).setValue(updatedBy);   // 10. updated_by
    sheet.getRange(rowId, 11).setValue(isActive);    // 11. is_active
    sheet.getRange(rowId, 12).setValue(2);           // 12. person_flag = 2 (พนักงาน)

    return {
      success: true,
      message: "แก้ไขข้อมูลพนักงาน '" + nickname + "' เรียบร้อยแล้ว"
    };
  } catch (err) {
    return { success: false, message: "เกิดข้อผิดพลาดในการแก้ไขข้อมูลพนักงาน: " + err.message };
  }
}

/**
 * ลบข้อมูลพนักงาน (Soft Delete)
 * ไม่ลบแถวทิ้ง แต่เปลี่ยนค่า deleted_flag เป็น 'Y' พร้อมบันทึก update_date, updated_by และตั้ง is_active = false
 * @param {number|object} rowId
 * @param {string} [updatedBy]
 */
function deleteStaff(rowId, updatedBy) {
  try {
    var sheet = getStaffSheet();
    var targetRow = (typeof rowId === "object" && rowId !== null) ? parseInt(rowId.rowId, 10) : parseInt(rowId, 10);
    var userWhoDeleted = (typeof rowId === "object" && rowId !== null && rowId.updatedBy) ? String(rowId.updatedBy).trim() : String(updatedBy || "admin").trim();

    if (isNaN(targetRow) || targetRow < 2 || targetRow > sheet.getLastRow()) {
      return { success: false, message: "ไม่พบตำแหน่งข้อมูลพนักงานที่ต้องการลบ" };
    }

    // ตรวจสอบสิทธิ์: เฉพาะผู้ดูแลระบบระดับสูงสุด (person_flag = 9) เท่านั้นที่สามารถลบข้อมูลพนักงานได้
    var deleterRecord = userWhoDeleted ? getAdminRecord(userWhoDeleted) : null;
    var deleterFlag = deleterRecord ? deleterRecord.personFlag : 9;
    if (deleterFlag !== 9) {
      return { success: false, message: "เฉพาะผู้ดูแลระบบระดับสูงสุด (person_flag = 9) เท่านั้นที่สามารถลบข้อมูลพนักงานได้" };
    }

    var nowStr = Utilities.formatDate(new Date(), "Asia/Bangkok", "yyyy-MM-dd HH:mm:ss");

    // Soft delete: เปลี่ยนค่าในคอลัมน์ที่เกี่ยวข้องตาม Schema 13 คอลัมน์
    sheet.getRange(targetRow, 9).setValue(nowStr);          // 9. update_date
    sheet.getRange(targetRow, 10).setValue(userWhoDeleted); // 10. updated_by
    sheet.getRange(targetRow, 11).setValue(false);          // 11. is_active = false
    sheet.getRange(targetRow, 13).setValue("Y");            // 13. deleted_flag = 'Y'

    return {
      success: true,
      message: "ลบข้อมูลพนักงานเรียบร้อยแล้ว"
    };
  } catch (err) {
    return { success: false, message: "เกิดข้อผิดพลาดในการลบข้อมูลพนักงาน: " + err.message };
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
      var headers = data[0].map(function(h) { return String(h || "").trim(); });
      var hasPeriodTo = (headers.indexOf("period_to") !== -1 || headers[1] === "period_to");
      var activeCol = hasPeriodTo ? 2 : 1;
      var delCol = hasPeriodTo ? 7 : 6;

      for (var i = 1; i < data.length; i++) {
        var row = data[i];
        var delFlag = String(row[delCol] || "N").trim().toUpperCase();
        var isActive = (row[activeCol] === false || String(row[activeCol]).toLowerCase() === "false") ? false : true;

        // หากถูก Soft Delete หรือปิดการใช้งาน (is_active = false) ให้ข้าม
        if (delFlag === "Y") continue;
        if (!isActive) continue;

        var t = formatTimeSlot(row[0]);
        if (t && slots.indexOf(t) === -1) slots.push(t);
      }
    }
    slots.sort(function(a, b) {
      return a.localeCompare(b);
    });
    return slots.length > 0 ? slots : ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00"];
  } catch (err) {
    return ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00"];
  }
}

/**
 * ดึงรายการพนักงานที่เปิดใช้งาน (is_active = true และ deleted_flag !== 'Y') จาก Sheet_Name_Staff
 * @returns {Array<{staffId: string, nickname: string, name: string}>}
 */
function getActiveStaffList() {
  try {
    var sheet = getStaffSheet();
    var data = sheet.getDataRange().getValues();
    var list = [];
    if (data.length > 1) {
      for (var i = 1; i < data.length; i++) {
        var row = data[i];
        var staffId = String(row[0] || "").trim();
        if (!staffId) continue;
        var isActive = (row[10] === true || String(row[10]).toLowerCase() === "true");
        var deletedFlag = String(row[12] || "N").trim().toUpperCase();
        if (deletedFlag === "Y" || !isActive) continue;

        var nick = String(row[2] || "").trim();
        var fname = String(row[3] || "").trim();
        var lname = String(row[4] || "").trim();
        list.push({
          staffId: staffId,
          nickname: nick,
          name: (fname + " " + lname).trim()
        });
      }
    }
    list.sort(function(a, b) {
      return a.staffId.localeCompare(b.staffId);
    });
    return list;
  } catch (err) {
    Logger.log("Error in getActiveStaffList: " + err.message);
    return [];
  }
}

/**
 * ดึงรายการช่วงเวลาเปิดให้บริการ (period_from, period_to) จาก Sheet_Name_Setting_Selection_Reservation_Time
 * เฉพาะช่วงเวลาที่เปิดใช้งาน (is_active = true และ deleted_flag !== 'Y')
 * @returns {Array<{periodFrom: string, periodTo: string}>}
 */
function getActiveSettingTimeSlotsWithRange() {
  try {
    var sheet = getSettingTimeSheet();
    var data = sheet.getDataRange().getValues();
    var slots = [];
    if (data.length > 1) {
      var headers = data[0].map(function(h) { return String(h || "").trim(); });
      var hasPeriodTo = (headers.indexOf("period_to") !== -1 || headers[1] === "period_to");
      var activeCol = hasPeriodTo ? 2 : 1;
      var delCol = hasPeriodTo ? 7 : 6;

      for (var i = 1; i < data.length; i++) {
        var row = data[i];
        var delFlag = String(row[delCol] || "N").trim().toUpperCase();
        var isActive = (row[activeCol] === true || String(row[activeCol]).toLowerCase() === "true");
        if (delFlag === "Y" || !isActive) continue;

        var pFrom = formatTimeSlot(row[0]);
        var pTo = hasPeriodTo ? formatTimeSlot(row[1]) : "";
        if (!pTo && pFrom) {
          var parts = pFrom.split(":");
          var h = (parseInt(parts[0], 10) + 1) % 24;
          pTo = (h < 10 ? "0" + h : h) + ":" + parts[1];
        }
        if (pFrom && pTo) {
          slots.push({
            periodFrom: pFrom,
            periodTo: pTo
          });
        }
      }
    }
    slots.sort(function(a, b) {
      return a.periodFrom.localeCompare(b.periodFrom);
    });
    return slots;
  } catch (err) {
    Logger.log("Error in getActiveSettingTimeSlotsWithRange: " + err.message);
    return [];
  }
}

/**
 * แปลงค่า period_month จากเซลล์ใน Google Sheet ให้อยู่ในรูปแบบ "YYYY-MM" เสมอ
 */
function normalizePeriodMonth(cellValue) {
  if (!cellValue) return "";
  if (cellValue instanceof Date) {
    return Utilities.formatDate(cellValue, "Asia/Bangkok", "yyyy-MM");
  }
  var str = String(cellValue).trim();
  var match = str.match(/^(\d{4})[-\/](\d{1,2})/);
  if (match) {
    var y = match[1];
    var m = match[2].length === 1 ? ("0" + match[2]) : match[2];
    return y + "-" + m;
  }
  return str;
}

/**
 * แปลงค่า day_month จากเซลล์ใน Google Sheet ให้อยู่ในรูปแบบ "DD" (2 หลัก) เสมอ
 */
function normalizeDayMonth(cellValue) {
  if (cellValue === null || cellValue === undefined || cellValue === "") return "";
  if (cellValue instanceof Date) {
    return Utilities.formatDate(cellValue, "Asia/Bangkok", "dd");
  }
  var str = String(cellValue).trim();
  var num = parseInt(str, 10);
  if (!isNaN(num)) {
    return num < 10 ? ("0" + num) : String(num);
  }
  return str.length === 1 ? ("0" + str) : str;
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

  // ควบคุมการเปลี่ยนเดือน: เลือกจองได้เฉพาะเดือนล่าสุด (เดือนปัจจุบัน) และเดือนถัดไป (ไม่สามารถดูข้อมูลย้อนหลังได้)
  var canGoPrev = diffMonths > 0;
  var canGoNext = diffMonths < 1;

  var isPast = diffMonths < 0;
  var isCurrent = diffMonths === 0;
  var isNext = diffMonths === 1;
  var isTooFar = diffMonths > 1;
  var isTooFarPast = diffMonths < 0;
  var isEditable = (isCurrent || isNext);

  var statusText = "";
  if (isPast) {
    statusText = "ไม่อนุญาตให้ดูหรือจองข้อมูลย้อนหลัง (เลือกได้เฉพาะเดือนปัจจุบันและเดือนถัดไป)";
  } else if (isCurrent) {
    statusText = "เดือนปัจจุบัน (สามารถจัดการข้อมูลได้ ตั้งแต่วันที่ปัจจุบัน)";
  } else if (isNext) {
    statusText = "เดือนถัดไป (สามารถจัดการข้อมูลล่วงหน้าได้)";
  } else {
    statusText = "เดือนล่วงหน้าเกิน 1 เดือน (ไม่อนุญาตให้จอง)";
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
 * ดึงข้อมูลตารางนัดหมายประจำเดือน (ระบุ periodMonth เช่น "2026-09" หรือ ปี ค.ศ., เดือน 1-12)
 * ดึงข้อมูลจาก Sheet_Name_Setting_Reservation_Timetable column "period_month" เพื่อจับคู่ตาม "day_month"
 * พร้อมคำนวณโควต้าการจองในแต่ละช่วงเวลา และตรวจสอบสถานะ "ไม่พบข้อมูล"
 */
function getCalendarData(periodMonthOrYear, maybeMonth) {
  try {
    initSheetIfNeeded();

    var year, month, targetPeriodMonth;
    if (typeof periodMonthOrYear === "string" && periodMonthOrYear.indexOf("-") !== -1) {
      targetPeriodMonth = normalizePeriodMonth(periodMonthOrYear);
      var parts = targetPeriodMonth.split("-");
      year = parseInt(parts[0], 10);
      month = parseInt(parts[1], 10);
    } else {
      year = parseInt(periodMonthOrYear, 10);
      month = parseInt(maybeMonth, 10);
      targetPeriodMonth = year + "-" + (month < 10 ? "0" + month : month);
    }

    var now = new Date();
    var currYear = parseInt(Utilities.formatDate(now, "Asia/Bangkok", "yyyy"), 10);
    var currMonth = parseInt(Utilities.formatDate(now, "Asia/Bangkok", "M"), 10);
    var todayStr = Utilities.formatDate(now, "Asia/Bangkok", "yyyy-MM-dd");
    var nowHour = parseInt(Utilities.formatDate(now, "Asia/Bangkok", "HH"), 10);
    var nowMin = parseInt(Utilities.formatDate(now, "Asia/Bangkok", "mm"), 10);
    var nowTotalMinutes = nowHour * 60 + nowMin;
    var nowStr = Utilities.formatDate(now, "Asia/Bangkok", "yyyy-MM-dd HH:mm:ss");
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
          var custPhone = String(custData[c][5] || "").trim().replace(/[^0-9]/g, '');
          if (/^\d{9}$/.test(custPhone)) {
            custPhone = "0" + custPhone;
          }
          customerMap[cid] = {
            nickname: String(custData[c][2] || "").trim(),
            firstname: String(custData[c][3] || "").trim(),
            lastname: String(custData[c][4] || "").trim(),
            phone: custPhone
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
    var targetMonthPrefix = targetPeriodMonth;

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

    // ดึงข้อมูลตารางการจองจาก Sheet_Name_Setting_Reservation_Timetable เพื่อนำมาจับคู่ (Matched) รายวัน
    // ส่งค่า periodMonth ไปยัง column "period_month" เพื่อดึงข้อมูลตาม column "day_month"
    var timetableByDate = {};
    var foundTimetableRows = 0;
    try {
      var ttSheet = getSettingTimetableSheet();
      var ttLastRow = ttSheet.getLastRow();
      if (ttLastRow > 1) {
        var ttHeaders = ttSheet.getRange(1, 1, 1, Math.max(ttSheet.getLastColumn(), 10)).getValues()[0].map(function(h) { return String(h || "").trim(); });
        var isNewTtSchema = (ttHeaders.indexOf("staff_id") !== -1 || ttHeaders[2] === "staff_id");
        var ttData = ttSheet.getRange(2, 1, ttLastRow - 1, 10).getValues();

        for (var t = 0; t < ttData.length; t++) {
          var rMonth = normalizePeriodMonth(ttData[t][0]);
          if (rMonth !== targetPeriodMonth) continue;

          foundTimetableRows++;

          var rDay = normalizeDayMonth(ttData[t][1]);
          if (!rDay) continue;
          var fullDateStr = targetPeriodMonth + "-" + rDay;

          var rStaffId = isNewTtSchema ? String(ttData[t][2] || "").trim() : "";
          var rTime = isNewTtSchema ? formatTimeSlot(ttData[t][3]) : formatTimeSlot(ttData[t][2]);
          var rTimeTo = isNewTtSchema ? formatTimeSlot(ttData[t][4]) : "";
          var rUsage = isNewTtSchema ? 0 : ((ttData[t][3] !== "" && ttData[t][3] !== null && !isNaN(ttData[t][3])) ? parseInt(ttData[t][3], 10) : 0);
          var rQuota = isNewTtSchema ? 1 : ((ttData[t][4] !== "" && ttData[t][4] !== null && !isNaN(ttData[t][4])) ? parseInt(ttData[t][4], 10) : 5);
          var rActive = (ttData[t][5] === false || String(ttData[t][5]).toLowerCase() === "false") ? false : true;

          // เงื่อนไขข้อ 3 & 3.1: เมื่อถึงวันที่ปัจจุบัน แล้วเปรียบเทียบช่วงเวลานั้นๆ กับช่วงเวลาปัจจุบัน
          // หากเวลาปัจจุบันน้อยกว่า ช่วงเวลาที่กำหนด 15 นาที (ต้องจองก่อนถึงช่วงเวลาที่กำหนด 15 นาที)
          // ให้ทำการปิดช่วงเวลานั้นๆ โดยกลับไป update ข้อมูลใน Sheet_Name_Setting_Reservation_Timetable column is_active = false
          if (fullDateStr === todayStr && rActive && rTime) {
            var sParts = rTime.split(":");
            var slotTotalMinutes = parseInt(sParts[0], 10) * 60 + parseInt(sParts[1], 10);
            if (nowTotalMinutes >= slotTotalMinutes - 15) {
              rActive = false;
              try {
                var rowIdx = t + 2;
                ttSheet.getRange(rowIdx, 6).setValue(false);
                ttSheet.getRange(rowIdx, 9).setValue(nowStr);
                ttSheet.getRange(rowIdx, 10).setValue("system");
              } catch (autoCloseErr) {
                Logger.log("Error auto-closing timetable slot: " + autoCloseErr.message);
              }
            }
          }

          // เงื่อนไขข้อ 2: ดึงข้อมูล usage_quota และ quota_total มาเพื่อตรวจสอบว่า “จองเต็ม” แล้วหรือยัง
          var isFull = isNewTtSchema ? false : (rUsage >= rQuota);

          if (!timetableByDate[fullDateStr]) {
            timetableByDate[fullDateStr] = {
              dateStr: fullDateStr,
              dayMonth: rDay,
              slots: [],
              slotMap: {},
              totalSlots: 0,
              activeCount: 0,
              inactiveCount: 0,
              availableCount: 0,
              fullCount: 0,
              allInactive: false,
              isAllFull: false,
              isAvailable: true
            };
          }

          timetableByDate[fullDateStr].slots.push({
            staffId: rStaffId,
            time: rTime,
            periodFrom: rTime,
            periodTo: rTimeTo,
            usageQuota: rUsage,
            quotaTotal: rQuota,
            isActive: rActive,
            isFull: isFull
          });
          timetableByDate[fullDateStr].slotMap[rTime] = {
            staffId: rStaffId,
            periodFrom: rTime,
            periodTo: rTimeTo,
            usageQuota: rUsage,
            quotaTotal: rQuota,
            isActive: rActive,
            isFull: isFull
          };
          timetableByDate[fullDateStr].totalSlots++;
          if (rActive) {
            timetableByDate[fullDateStr].activeCount++;
            if (isFull) {
              timetableByDate[fullDateStr].fullCount++;
            } else {
              timetableByDate[fullDateStr].availableCount++;
            }
          } else {
            timetableByDate[fullDateStr].inactiveCount++;
          }
        }

        // ประเมินสถานะในแต่ละวัน
        // 1.1.1.1: ถ้าค่า is_active เป็น false ทั้งหมดทุกช่วงเวลา -> allInactive = true, isAvailable = false
        // ถ้า active แต่เต็มทุกรอบ -> isAllFull = true, isAvailable = false
        // ถ้ามีรอบที่เปิดใช้งานและยังไม่เต็ม -> isAvailable = true
        for (var dKey in timetableByDate) {
          var dayObj = timetableByDate[dKey];
          if (dayObj.totalSlots > 0 && dayObj.activeCount === 0) {
            dayObj.allInactive = true;
            dayObj.isAvailable = false;
            dayObj.isAllFull = false;
          } else if (dayObj.activeCount > 0 && dayObj.availableCount === 0) {
            dayObj.allInactive = false;
            dayObj.isAvailable = false;
            dayObj.isAllFull = true;
          } else {
            dayObj.allInactive = false;
            dayObj.isAvailable = true;
            dayObj.isAllFull = false;
          }
        }
      }
    } catch (ttErr) {
      Logger.log("Error loading timetable for calendar: " + ttErr.message);
    }

    var availableMonths = getDistinctTimetableMonths();
    var hasData = (foundTimetableRows > 0);

    return {
      success: true,
      year: year,
      month: month,
      periodMonth: targetPeriodMonth,
      hasData: hasData,
      foundTimetableRows: foundTimetableRows,
      permission: permission,
      todayStr: permission.todayStr,
      timeSlots: timeSlots,
      reservationsByDate: reservationsByDate,
      timetableByDate: timetableByDate,
      availableMonths: availableMonths
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
    var timeSlot = formatTimeSlot(data.timeSlot || data.startTime || "");
    var customerId = String(data.customerId || "").trim();
    var status = String(data.status || "ยืนยันแล้ว").trim();

    if (!dateStr) return { success: false, message: "กรุณาระบุวันที่ที่จอง" };
    if (!timeSlot) return { success: false, message: "กรุณาระบุเวลาที่จอง" };
    if (!customerId) return { success: false, message: "กรุณาเลือกลูกค้า" };

    var now = new Date();
    var todayStr = Utilities.formatDate(now, "Asia/Bangkok", "yyyy-MM-dd");
    var nowHour = parseInt(Utilities.formatDate(now, "Asia/Bangkok", "HH"), 10);
    var nowMin = parseInt(Utilities.formatDate(now, "Asia/Bangkok", "mm"), 10);
    var nowTotalMinutes = nowHour * 60 + nowMin;
    var nowStr = Utilities.formatDate(now, "Asia/Bangkok", "yyyy-MM-dd HH:mm:ss");

    // เงื่อนไขข้อ 1: เฉพาะตั้งแต่วันที่ปัจจุบันเป็นต้นไป (ห้ามจองย้อนหลังเด็ดขาด)
    if (dateStr < todayStr) {
      return {
        success: false,
        message: "ไม่อนุญาตให้จองย้อนหลัง สามารถจองได้ตั้งแต่วันที่ปัจจุบัน (" + todayStr + ") เป็นต้นไป"
      };
    }

    // เงื่อนไขข้อ 3 & 3.1: เมื่อถึงวันที่ปัจจุบัน แล้วเปรียบเทียบช่วงเวลานั้นๆ กับช่วงเวลาปัจจุบัน
    // หากเวลาปัจจุบันน้อยกว่า ช่วงเวลาที่กำหนด 15 นาที (ต้องจองก่อนถึงช่วงเวลาที่กำหนด 15 นาที -> nowTotalMinutes >= slotTotalMinutes - 15)
    // ให้ทำการปิดช่วงเวลานั้นๆ โดยกลับไป update ข้อมูลใน Sheet_Name_Setting_Reservation_Timetable column is_active = false
    var slotParts = timeSlot.split(":");
    var slotTotalMinutes = parseInt(slotParts[0], 10) * 60 + parseInt(slotParts[1], 10);

    if (dateStr === todayStr) {
      if (nowTotalMinutes >= slotTotalMinutes - 15) {
        // อัปเดตใน Sheet_Name_Setting_Reservation_Timetable ให้ is_active = false
        try {
          var ttSheetAuto = getSettingTimetableSheet();
          var ttLastRowAuto = ttSheetAuto.getLastRow();
          if (ttLastRowAuto > 1) {
            var ttDataAuto = ttSheetAuto.getRange(2, 1, ttLastRowAuto - 1, 6).getValues();
            var targetPeriodMonthAuto = dateStr.slice(0, 7);
            var targetDayMonthAuto = dateStr.slice(8, 10);
            for (var ai = 0; ai < ttDataAuto.length; ai++) {
              var am = normalizePeriodMonth(ttDataAuto[ai][0]);
              var ad = normalizeDayMonth(ttDataAuto[ai][1]);
              var at = formatTimeSlot(ttDataAuto[ai][2]);
              if (am === targetPeriodMonthAuto && ad === targetDayMonthAuto && at === timeSlot) {
                ttSheetAuto.getRange(ai + 2, 6).setValue(false);
                ttSheetAuto.getRange(ai + 2, 9).setValue(nowStr);
                ttSheetAuto.getRange(ai + 2, 10).setValue("system");
                break;
              }
            }
          }
        } catch (eAuto) {}

        return {
          success: false,
          message: "รอบเวลา " + timeSlot + " น. ปิดรับจองแล้ว (ต้องจองล่วงหน้าก่อนถึงช่วงเวลาอย่างน้อย 15 นาที)"
        };
      }
    }

    // ตรวจสอบสิทธิ์การแก้ไขเดือน (เลือกจองได้เฉพาะเดือนล่าสุดและเดือนถัดไป)
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

    // ตรวจสอบสถานะการเปิดใช้งานและโควต้าจาก Sheet_Name_Setting_Reservation_Timetable
    var ttSheet = getSettingTimetableSheet();
    var ttLastRow = ttSheet.getLastRow();
    var targetPeriodMonth = parts[0] + "-" + (month < 10 ? "0" + month : month);
    var targetDayMonth = normalizeDayMonth(parts[2]);
    var ttRowToUpdate = -1;
    var currentUsageQuota = 0;
    var maxQuotaFromTimetable = 5;

    if (ttLastRow > 1) {
      var ttData = ttSheet.getRange(2, 1, ttLastRow - 1, 6).getValues();
      for (var ti = 0; ti < ttData.length; ti++) {
        var tm = normalizePeriodMonth(ttData[ti][0]);
        var td = normalizeDayMonth(ttData[ti][1]);
        var ttTime = formatTimeSlot(ttData[ti][2]);

        if (tm === targetPeriodMonth && td === targetDayMonth && ttTime === timeSlot) {
          var tIsActive = (ttData[ti][5] === false || String(ttData[ti][5]).toLowerCase() === "false") ? false : true;
          if (!tIsActive) {
            return {
              success: false,
              message: "รอบเวลา " + timeSlot + " น. ในวันที่ " + dateStr + " ถูกปิดการใช้งาน (ไม่สามารถทำการจองได้)"
            };
          }
          if (ttData[ti][3] !== "" && ttData[ti][3] !== null && !isNaN(ttData[ti][3])) {
            currentUsageQuota = parseInt(ttData[ti][3], 10);
          }
          if (ttData[ti][4] !== "" && ttData[ti][4] !== null && !isNaN(ttData[ti][4])) {
            maxQuotaFromTimetable = parseInt(ttData[ti][4], 10);
          }
          ttRowToUpdate = ti + 2;
          break;
        }
      }
    }

    // เงื่อนไขข้อ 2: ตรวจสอบ usage_quota และ quota_total ว่า “จองเต็ม” แล้วหรือยัง
    if (currentUsageQuota >= maxQuotaFromTimetable) {
      return {
        success: false,
        message: "ช่วงเวลา " + timeSlot + " น. เต็มแล้ว (โควต้าครบ " + currentUsageQuota + "/" + maxQuotaFromTimetable + " ท่านแล้ว)"
      };
    }

    var sheet = getReservationSheet();
    var reservationId = generateNextReservationId();

    sheet.appendRow([reservationId, customerId, dateStr, timeSlot, status, nowStr, nowStr]);

    // เงื่อนไขข้อ 2: เมื่อทำการจองทุกครั้ง ให้กลับไป update ข้อมูลใน Sheet_Name_Setting_Reservation_Timetable column usage_quota (usage_quota += 1)
    if (ttRowToUpdate > 1) {
      try {
        var newUsage = currentUsageQuota + 1;
        ttSheet.getRange(ttRowToUpdate, 4).setValue(newUsage);
        ttSheet.getRange(ttRowToUpdate, 9).setValue(nowStr);
        ttSheet.getRange(ttRowToUpdate, 10).setValue(data.operatorUsername || "system");
      } catch (e) {
        Logger.log("Error updating usage_quota in timetable: " + e.message);
      }
    }

    return {
      success: true,
      reservationId: reservationId,
      message: "บันทึกการจองรหัส " + reservationId + " ช่วงเวลา " + timeSlot + " น. เรียบร้อยแล้ว (โควต้า: " + (currentUsageQuota + 1) + "/" + maxQuotaFromTimetable + ")"
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
    var delDate = "";
    var delTime = "";

    for (var i = 1; i < data.length; i++) {
      if (String(data[i][0]).trim() === cleanId) {
        targetRow = i + 1;
        var rDateVal = data[i][2];
        delDate = (rDateVal instanceof Date) ? Utilities.formatDate(rDateVal, "Asia/Bangkok", "yyyy-MM-dd") : String(rDateVal || "").slice(0, 10);
        delTime = formatTimeSlot(data[i][3]);
        break;
      }
    }

    if (targetRow === -1) {
      return { success: false, message: "ไม่พบข้อมูลการจองรหัส " + cleanId };
    }

    sheet.deleteRow(targetRow);

    // ปรับปรุง usage_quota ใน Sheet_Name_Setting_Reservation_Timetable ให้ลดลง 1
    if (delDate && delTime) {
      try {
        var dParts = delDate.split("-");
        var pMonth = normalizePeriodMonth(delDate.slice(0, 7));
        var pDay = normalizeDayMonth(dParts[2]);
        var ttSheet = getSettingTimetableSheet();
        var ttLastRow = ttSheet.getLastRow();
        if (ttLastRow > 1) {
          var ttData = ttSheet.getRange(2, 1, ttLastRow - 1, 6).getValues();
          for (var t = 0; t < ttData.length; t++) {
            var rMonth = normalizePeriodMonth(ttData[t][0]);
            var rDay = normalizeDayMonth(ttData[t][1]);
            var rTime = formatTimeSlot(ttData[t][2]);
            if (rMonth === pMonth && rDay === pDay && rTime === delTime) {
              var currUsage = parseInt(ttData[t][3], 10) || 0;
              var newUsage = Math.max(0, currUsage - 1);
              ttSheet.getRange(t + 2, 4).setValue(newUsage);
              ttSheet.getRange(t + 2, 9).setValue(Utilities.formatDate(new Date(), "Asia/Bangkok", "yyyy-MM-dd HH:mm:ss"));
              ttSheet.getRange(t + 2, 10).setValue("system");
              break;
            }
          }
        }
      } catch (e) {}
    }

    return { success: true, message: "ลบข้อมูลการจองรหัส " + cleanId + " เรียบร้อยแล้ว" };
  } catch (err) {
    return { success: false, message: "เกิดข้อผิดพลาดในการลบการจอง: " + err.message };
  }
}

// ==============================================================================
// โมดูล 4: ตั้งค่าตัวเลือกเวลาการจอง (Sheet_Name_Setting_Selection_Reservation_Time)
// Schema:
// 1. period (เวลาที่เปิดให้จอง เช่น "10:00")
// 2. create_date (วันที่สร้าง)
// ==============================================================================
// SCHEMA ชีต "ตั้งค่าตัวเลือกเวลาการจอง" (Sheet_Name_Setting_Selection_Reservation_Time)
// 1. period (เวลาที่เปิดให้จอง เช่น "10:00")
// 2. is_active (สถานะการเปิด/ปิดใช้งาน: true = เปิดใช้งาน, false = ปิดการใช้งาน, default = TRUE)
// 3. create_date (วันที่สร้าง)
// 4. created_by (ผู้สร้าง ใช้ username ที่ล็อกอิน)
// 5. update_date (อัปเดตล่าสุด)
// 6. updated_by (ผู้อัปเดต ใช้ username ที่ล็อกอิน)
// 7. deleted_flag (สถานะการลบ: N = ใช้งาน, Y = ลบแบบ Soft Delete)
// ==============================================================================

/**
 * ตั้งค่าและอัปเดต Schema ของชีต "ตั้งค่าตัวเลือกเวลาการจอง" (Sheet_Name_Setting_Selection_Reservation_Time)
 */
function setupSettingTimeSheetSchema() {
  try {
    var sheet = getSettingTimeSheet();
    var headers = ["period_from", "period_to", "is_active", "create_date", "created_by", "update_date", "updated_by", "deleted_flag"];
    var nowStr = Utilities.formatDate(new Date(), "Asia/Bangkok", "yyyy-MM-dd HH:mm:ss");

    var lastRow = sheet.getLastRow();
    if (lastRow === 0) {
      sheet.appendRow(headers);
      var headerRange = sheet.getRange(1, 1, 1, headers.length);
      headerRange.setBackground("#1B3B36")
        .setFontColor("#FFFFFF")
        .setFontWeight("bold")
        .setHorizontalAlignment("center")
        .setVerticalAlignment("middle");
      sheet.setRowHeight(1, 40);
      sheet.setFrozenRows(1);

      var defaultTimes = [
        ["09:00", "10:00"],
        ["10:00", "11:00"],
        ["11:00", "12:00"],
        ["12:00", "13:00"],
        ["13:00", "14:00"],
        ["14:00", "15:00"],
        ["15:00", "16:00"],
        ["16:00", "17:00"],
        ["17:00", "18:00"],
        ["18:00", "19:00"]
      ];
      for (var t = 0; t < defaultTimes.length; t++) {
        sheet.appendRow([defaultTimes[t][0], defaultTimes[t][1], true, nowStr, "admin", nowStr, "admin", "N"]);
      }
      sheet.getRange("A:B").setNumberFormat("@");
      for (var tc = 1; tc <= headers.length; tc++) {
        sheet.autoResizeColumn(tc);
      }
      return { success: true, message: "สร้างชีตตั้งค่าตัวเลือกเวลาการจอง 8 คอลัมน์ (period_from, period_to) สำเร็จ" };
    }

    // Auto-migrate:
    var maxCols = Math.max(sheet.getLastColumn(), 1);
    var currentHeaderRange = sheet.getRange(1, 1, 1, maxCols);
    var currentHeaders = currentHeaderRange.getValues()[0].map(function(h) { return String(h || "").trim(); });

    // 1. เปลี่ยนชื่อ header คอลัมน์ 1 จาก "period" เป็น "period_from"
    if (currentHeaders[0] === "period") {
      sheet.getRange(1, 1).setValue("period_from");
      currentHeaders[0] = "period_from";
    }

    // 2. ถ้ายังไม่มีคอลัมน์ period_to ให้แทรกคอลัมน์ถัดจาก period_from (คอลัมน์ B)
    if (currentHeaders.indexOf("period_to") === -1) {
      sheet.insertColumnAfter(1); // แทรกคอลัมน์ B ถัดจาก period_from
      sheet.getRange(1, 2).setValue("period_to");
      if (lastRow > 1) {
        var fromRange = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
        var toVals = [];
        for (var i = 0; i < fromRange.length; i++) {
          var pFrom = formatTimeSlot(fromRange[i][0]);
          var pTo = "";
          if (pFrom) {
            if (i + 1 < fromRange.length && fromRange[i + 1][0]) {
              pTo = formatTimeSlot(fromRange[i + 1][0]);
            } else {
              var parts = pFrom.split(":");
              var h = (parseInt(parts[0], 10) + 1) % 24;
              pTo = (h < 10 ? "0" + h : h) + ":" + parts[1];
            }
          }
          toVals.push([pTo]);
        }
        sheet.getRange(2, 2, lastRow - 1, 1).setValues(toVals);
      }
    }

    // 3. ตรวจสอบจำนวนคอลัมน์รวม และอัปเดต Header
    if (sheet.getMaxColumns() < headers.length) {
      sheet.insertColumnsAfter(sheet.getMaxColumns(), headers.length - sheet.getMaxColumns());
    }

    var hRange = sheet.getRange(1, 1, 1, headers.length);
    hRange.setValues([headers]);
    hRange.setBackground("#1B3B36")
      .setFontColor("#FFFFFF")
      .setFontWeight("bold")
      .setHorizontalAlignment("center")
      .setVerticalAlignment("middle");
    sheet.setRowHeight(1, 40);
    sheet.setFrozenRows(1);

    // ตรวจสอบและเติมค่าในแถวที่มีอยู่แล้ว
    if (lastRow > 1) {
      var data = sheet.getRange(2, 1, lastRow - 1, headers.length).getValues();
      var changed = false;
      for (var r = 0; r < data.length; r++) {
        var pFrom = formatTimeSlot(data[r][0]);
        if (pFrom && pFrom !== data[r][0]) {
          data[r][0] = pFrom;
          changed = true;
        }
        var pTo = formatTimeSlot(data[r][1]);
        if (pTo && pTo !== data[r][1]) {
          data[r][1] = pTo;
          changed = true;
        }
        // is_active (คอลัมน์ 3 index 2): ถ้ายังไม่มีค่า ให้ default เป็น true
        if (data[r][2] === "" || data[r][2] === null || data[r][2] === undefined) {
          data[r][2] = true;
          changed = true;
        }
        // create_date (คอลัมน์ 4 index 3)
        if (!data[r][3]) {
          data[r][3] = nowStr;
          changed = true;
        }
        // created_by (คอลัมน์ 5 index 4)
        if (!data[r][4]) {
          data[r][4] = "admin";
          changed = true;
        }
        // update_date (คอลัมน์ 6 index 5)
        if (!data[r][5]) {
          data[r][5] = nowStr;
          changed = true;
        }
        // updated_by (คอลัมน์ 7 index 6)
        if (!data[r][6]) {
          data[r][6] = "admin";
          changed = true;
        }
        // deleted_flag (คอลัมน์ 8 index 7)
        if (!data[r][7]) {
          data[r][7] = "N";
          changed = true;
        }
      }
      if (changed) {
        sheet.getRange(2, 1, data.length, headers.length).setValues(data);
      }
    }

    sheet.getRange("A:B").setNumberFormat("@");
    for (var c = 1; c <= headers.length; c++) {
      sheet.autoResizeColumn(c);
    }

    return {
      success: true,
      message: "อัปเดต Schema ชีตตั้งค่าตัวเลือกเวลาการจอง 8 คอลัมน์ (period_from, period_to) เรียบร้อยแล้ว"
    };
  } catch (err) {
    return {
      success: false,
      message: "เกิดข้อผิดพลาดในการอัปเดต Schema ตัวเลือกเวลา: " + err.message
    };
  }
}

/**
 * ดึงรายการข้อมูลรอบเวลาการจอง (Sheet_Name_Setting_Selection_Reservation_Time)
 * - ดึงเฉพาะรายการที่ไม่ได้ลบ (deleted_flag !== 'Y')
 * - เรียงลำดับเวลาจากเช้าไปค่ำ
 */
function getSettingTimeSlots(requesterUsername) {
  try {
    initSheetIfNeeded();
    var sheet = getSettingTimeSheet();
    var data = sheet.getDataRange().getValues();
    var list = [];

    if (data.length > 1) {
      var headers = data[0].map(function(h) { return String(h || "").trim(); });
      var hasPeriodTo = (headers.indexOf("period_to") !== -1 || headers[1] === "period_to");

      for (var r = 1; r < data.length; r++) {
        var row = data[r];
        var periodFrom = formatTimeSlot(row[0]);
        if (!periodFrom) continue;

        var periodTo = "";
        var isActive = true;
        var createDate = "-";
        var createdBy = "-";
        var updateDate = "-";
        var updatedBy = "-";
        var deletedFlag = "N";

        if (hasPeriodTo || row.length >= 8) {
          periodTo = formatTimeSlot(row[1]);
          isActive = (row[2] === false || String(row[2]).toLowerCase() === "false") ? false : true;
          createDate = row[3] instanceof Date ? Utilities.formatDate(row[3], "Asia/Bangkok", "yyyy-MM-dd HH:mm") : String(row[3] || "-");
          createdBy = String(row[4] || "-");
          updateDate = row[5] instanceof Date ? Utilities.formatDate(row[5], "Asia/Bangkok", "yyyy-MM-dd HH:mm") : String(row[5] || "-");
          updatedBy = String(row[6] || "-");
          deletedFlag = String(row[7] || "N").trim().toUpperCase();
        } else {
          // Backward compatibility with 7-column schema
          isActive = (row[1] === false || String(row[1]).toLowerCase() === "false") ? false : true;
          createDate = row[2] instanceof Date ? Utilities.formatDate(row[2], "Asia/Bangkok", "yyyy-MM-dd HH:mm") : String(row[2] || "-");
          createdBy = String(row[3] || "-");
          updateDate = row[4] instanceof Date ? Utilities.formatDate(row[4], "Asia/Bangkok", "yyyy-MM-dd HH:mm") : String(row[4] || "-");
          updatedBy = String(row[5] || "-");
          deletedFlag = String(row[6] || "N").trim().toUpperCase();
        }

        if (deletedFlag === "Y") continue;

        list.push({
          rowId: r + 1,
          period: periodFrom, // maintain backwards compatibility
          periodFrom: periodFrom,
          periodTo: periodTo,
          isActive: isActive,
          createDate: createDate,
          createdBy: createdBy,
          updateDate: updateDate,
          updatedBy: updatedBy,
          deletedFlag: deletedFlag
        });
      }
    }

    list.sort(function(a, b) {
      return a.periodFrom.localeCompare(b.periodFrom);
    });

    return {
      success: true,
      data: list,
      sheetName: SHEET_NAME_SETTING_TIME,
      message: "ดึงข้อมูลรอบเวลาการจองสำเร็จ"
    };
  } catch (err) {
    return {
      success: false,
      message: "เกิดข้อผิดพลาดในการดึงข้อมูลรอบเวลา: " + err.message
    };
  }
}

/**
 * เพิ่มข้อมูลรอบเวลาการจองใหม่ (period_from, period_to)
 */
function addSettingTimeSlot(payload) {
  try {
    initSheetIfNeeded();
    if (!payload) {
      return { success: false, message: "ไม่พบข้อมูลที่ต้องการบันทึก" };
    }

    var rawPeriodFrom = String(payload.periodFrom || payload.period_from || payload.period || "").trim();
    var periodFrom = formatTimeSlot(rawPeriodFrom);
    if (!/^\d{2}:\d{2}$/.test(periodFrom)) {
      return { success: false, message: "กรุณาระบุเวลาเริ่มต้นที่เปิดให้จอง (period_from) ในรูปแบบ HH:mm เช่น 09:00" };
    }

    var rawPeriodTo = String(payload.periodTo || payload.period_to || "").trim();
    var periodTo = formatTimeSlot(rawPeriodTo);
    if (!/^\d{2}:\d{2}$/.test(periodTo)) {
      return { success: false, message: "กรุณาระบุเวลาสิ้นสุดที่เปิดให้จอง (period_to) ในรูปแบบ HH:mm เช่น 10:00" };
    }

    if (periodTo <= periodFrom) {
      return { success: false, message: "เวลาสิ้นสุด (period_to) ต้องมากกว่าเวลาเริ่มต้น (period_from)" };
    }

    var isActive = (payload.isActive !== false && String(payload.isActive).toLowerCase() !== "false");
    var operator = String(payload.operatorUsername || "admin").trim();
    var nowStr = Utilities.formatDate(new Date(), "Asia/Bangkok", "yyyy-MM-dd HH:mm:ss");

    var sheet = getSettingTimeSheet();
    var data = sheet.getDataRange().getValues();

    var existingRow = -1;
    var existingDeleted = false;

    if (data.length > 1) {
      var headers = data[0].map(function(h) { return String(h || "").trim(); });
      var hasPeriodTo = (headers.indexOf("period_to") !== -1 || headers[1] === "period_to");

      for (var r = 1; r < data.length; r++) {
        var pFrom = formatTimeSlot(data[r][0]);
        var pTo = hasPeriodTo ? formatTimeSlot(data[r][1]) : "";
        var delFlag = hasPeriodTo ? String(data[r][7] || "N").trim().toUpperCase() : String(data[r][6] || "N").trim().toUpperCase();

        if (pFrom === periodFrom && pTo === periodTo) {
          if (delFlag === "Y") {
            existingRow = r + 1;
            existingDeleted = true;
          } else {
            return { success: false, message: "รอบเวลา " + periodFrom + " - " + periodTo + " มีอยู่ในระบบแล้ว" };
          }
        }
      }
    }

    if (existingDeleted && existingRow > 0) {
      sheet.getRange(existingRow, 1).setValue(periodFrom).setNumberFormat("@");
      sheet.getRange(existingRow, 2).setValue(periodTo).setNumberFormat("@");
      sheet.getRange(existingRow, 3).setValue(isActive); // is_active
      sheet.getRange(existingRow, 6).setValue(nowStr);   // update_date
      sheet.getRange(existingRow, 7).setValue(operator); // updated_by
      sheet.getRange(existingRow, 8).setValue("N");      // deleted_flag = N
      return {
        success: true,
        message: "เพิ่มรอบเวลา " + periodFrom + " - " + periodTo + " สำเร็จ (เปิดใช้งานรอบเวลาเดิม)"
      };
    }

    sheet.appendRow([periodFrom, periodTo, isActive, nowStr, operator, nowStr, operator, "N"]);
    var lastRow = sheet.getLastRow();
    sheet.getRange(lastRow, 1).setNumberFormat("@");
    sheet.getRange(lastRow, 2).setNumberFormat("@");

    return {
      success: true,
      message: "เพิ่มรอบเวลา " + periodFrom + " - " + periodTo + " สำเร็จ"
    };
  } catch (err) {
    return {
      success: false,
      message: "เกิดข้อผิดพลาดในการเพิ่มรอบเวลา: " + err.message
    };
  }
}

/**
 * แก้ไขข้อมูลรอบเวลาการจอง (period_from, period_to)
 */
function updateSettingTimeSlot(payload) {
  try {
    initSheetIfNeeded();
    if (!payload || !payload.rowId) {
      return { success: false, message: "ไม่พบรหัสแถวข้อมูลที่ต้องการแก้ไข" };
    }

    var rowId = parseInt(payload.rowId, 10);
    var rawPeriodFrom = String(payload.periodFrom || payload.period_from || payload.period || "").trim();
    var periodFrom = formatTimeSlot(rawPeriodFrom);
    if (!/^\d{2}:\d{2}$/.test(periodFrom)) {
      return { success: false, message: "กรุณาระบุเวลาเริ่มต้นที่เปิดให้จอง (period_from) ในรูปแบบ HH:mm" };
    }

    var rawPeriodTo = String(payload.periodTo || payload.period_to || "").trim();
    var periodTo = formatTimeSlot(rawPeriodTo);
    if (!/^\d{2}:\d{2}$/.test(periodTo)) {
      return { success: false, message: "กรุณาระบุเวลาสิ้นสุดที่เปิดให้จอง (period_to) ในรูปแบบ HH:mm" };
    }

    if (periodTo <= periodFrom) {
      return { success: false, message: "เวลาสิ้นสุด (period_to) ต้องมากกว่าเวลาเริ่มต้น (period_from)" };
    }

    var isActive = (payload.isActive !== false && String(payload.isActive).toLowerCase() !== "false");
    var operator = String(payload.operatorUsername || "admin").trim();
    var nowStr = Utilities.formatDate(new Date(), "Asia/Bangkok", "yyyy-MM-dd HH:mm:ss");

    var sheet = getSettingTimeSheet();
    var data = sheet.getDataRange().getValues();

    if (rowId < 2 || rowId > data.length) {
      return { success: false, message: "ไม่พบข้อมูลแถวที่ต้องการแก้ไขในระบบ" };
    }

    var headers = data[0].map(function(h) { return String(h || "").trim(); });
    var hasPeriodTo = (headers.indexOf("period_to") !== -1 || headers[1] === "period_to");

    for (var r = 1; r < data.length; r++) {
      if (r + 1 !== rowId) {
        var pFrom = formatTimeSlot(data[r][0]);
        var pTo = hasPeriodTo ? formatTimeSlot(data[r][1]) : "";
        var del = hasPeriodTo ? String(data[r][7] || "N").trim().toUpperCase() : String(data[r][6] || "N").trim().toUpperCase();
        if (pFrom === periodFrom && pTo === periodTo && del !== "Y") {
          return { success: false, message: "รอบเวลา " + periodFrom + " - " + periodTo + " ซ้ำกับรอบเวลาอื่นที่มีอยู่แล้ว" };
        }
      }
    }

    if (hasPeriodTo) {
      sheet.getRange(rowId, 1).setValue(periodFrom).setNumberFormat("@");
      sheet.getRange(rowId, 2).setValue(periodTo).setNumberFormat("@");
      sheet.getRange(rowId, 3).setValue(isActive); // is_active
      sheet.getRange(rowId, 6).setValue(nowStr);   // update_date
      sheet.getRange(rowId, 7).setValue(operator); // updated_by
    } else {
      sheet.getRange(rowId, 1).setValue(periodFrom).setNumberFormat("@");
      sheet.getRange(rowId, 2).setValue(isActive);
      sheet.getRange(rowId, 5).setValue(nowStr);
      sheet.getRange(rowId, 6).setValue(operator);
    }

    return {
      success: true,
      message: "แก้ไขรอบเวลาเป็น " + periodFrom + " - " + periodTo + " สำเร็จ"
    };
  } catch (err) {
    return {
      success: false,
      message: "เกิดข้อผิดพลาดในการแก้ไขรอบเวลา: " + err.message
    };
  }
}

/**
 * ลบข้อมูลรอบเวลาการจอง (Soft Delete)
 */
function deleteSettingTimeSlot(rowId, operatorUsername) {
  try {
    initSheetIfNeeded();
    rowId = parseInt(rowId, 10);
    if (isNaN(rowId) || rowId < 2) {
      return { success: false, message: "ตำแหน่งแถวข้อมูลไม่ถูกต้อง" };
    }

    var sheet = getSettingTimeSheet();
    var lastRow = sheet.getLastRow();
    if (rowId > lastRow) {
      return { success: false, message: "ไม่พบข้อมูลที่ต้องการลบในระบบ" };
    }

    var operator = String(operatorUsername || "admin").trim();
    var nowStr = Utilities.formatDate(new Date(), "Asia/Bangkok", "yyyy-MM-dd HH:mm:ss");

    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(function(h) { return String(h || "").trim(); });
    var delCol = headers.indexOf("deleted_flag") + 1;
    var updateDateCol = headers.indexOf("update_date") + 1;
    var updatedByCol = headers.indexOf("updated_by") + 1;

    if (delCol <= 0) delCol = (headers.indexOf("period_to") !== -1) ? 8 : 7;
    if (updateDateCol <= 0) updateDateCol = delCol - 2;
    if (updatedByCol <= 0) updatedByCol = delCol - 1;

    sheet.getRange(rowId, updateDateCol).setValue(nowStr);
    sheet.getRange(rowId, updatedByCol).setValue(operator);
    sheet.getRange(rowId, delCol).setValue("Y"); // deleted_flag = 'Y'

    return {
      success: true,
      message: "ลบรอบเวลาเรียบร้อยแล้ว (Soft Delete)"
    };
  } catch (err) {
    return {
      success: false,
      message: "เกิดข้อผิดพลาดในการลบรอบเวลา: " + err.message
    };
  }
}

/**
 * ==============================================================================
 * การจัดการชีต "ตั้งค่าตารางการจอง" (Sheet_Name_Setting_Reservation_Timetable)
 * คอลัมน์ (Schema 10 คอลัมน์):
 * 1. period_month: ปี-เดือน เช่น "2026-09"
 * 2. day_month: วันที่ เช่น "01", "02", ..., "30"
 * 3. staff_id: รหัสพนักงาน เช่น "JMC001" (ดึงจาก Sheet_Name_Staff เฉพาะ is_active = true)
 * 4. period_from: เวลาเริ่มต้น เช่น "09:00", "10:00" (ดึงจาก Sheet_Name_Setting_Selection_Reservation_Time)
 * 5. period_to: เวลาสิ้นสุด เช่น "10:00", "11:00" (ดึงจาก Sheet_Name_Setting_Selection_Reservation_Time)
 * 6. is_active: เปิดใช้งาน (true = "เปิดใช้งาน", false = "ปิดการใช้งาน", วันเสาร์-อาทิตย์ = false, จันทร์-ศุกร์ default = true)
 * 7. create_date: วันที่สร้าง
 * 8. created_by: ผู้สร้าง (username)
 * 9. update_date: อัปเดตล่าสุด
 * 10. updated_by: ผู้อัปเดต (username)
 * ==============================================================================
 */

/**
 * ตั้งค่าและอัปเดต Schema ของชีต "ตั้งค่าตารางการจอง" (Sheet_Name_Setting_Reservation_Timetable)
 */
function setupSettingTimetableSheetSchema() {
  try {
    var sheet = getSettingTimetableSheet();
    var headers = [
      "period_month", // 1. ปี-เดือน เช่น "2026-09"
      "day_month",    // 2. วันที่ เช่น "01", "02", ..., "30"
      "staff_id",     // 3. รหัสพนักงาน เช่น "JMC001"
      "period_from",  // 4. เวลาเริ่มต้น เช่น "09:00"
      "period_to",    // 5. เวลาสิ้นสุด เช่น "10:00"
      "is_active",    // 6. สถานะเปิด/ปิดใช้งาน (true: เปิดใช้งาน, false: ปิดการใช้งาน)
      "create_date",  // 7. วันที่สร้าง
      "created_by",   // 8. ผู้สร้าง (username)
      "update_date",  // 9. อัปเดตล่าสุด
      "updated_by"    // 10. ผู้อัปเดต (username)
    ];

    var lastRow = sheet.getLastRow();
    var maxCols = Math.max(sheet.getLastColumn(), 1);
    var currentHeaders = sheet.getRange(1, 1, 1, maxCols).getValues()[0].map(function(h) { return String(h || "").trim(); });

    // ตรวจสอบว่าต้อง Auto-Migrate หรือไม่ (หากเป็นตารางเดิมที่มีคอลัมน์ time, usage_quota, quota_total หรือยังไม่มี staff_id)
    var needMigration = (lastRow > 1 && (currentHeaders.indexOf("time") !== -1 || currentHeaders.indexOf("usage_quota") !== -1 || currentHeaders.indexOf("staff_id") === -1));

    if (needMigration) {
      var oldData = sheet.getRange(2, 1, lastRow - 1, currentHeaders.length).getValues();
      var defaultStaffList = getActiveStaffList();
      var defaultStaffId = (defaultStaffList && defaultStaffList.length > 0) ? defaultStaffList[0].staffId : "JMC001";
      var migratedRows = [];

      for (var r = 0; r < oldData.length; r++) {
        var oldRow = oldData[r];
        var pMonth = normalizePeriodMonth(oldRow[0]);
        var dMonth = normalizeDayMonth(oldRow[1]);
        if (!pMonth || !dMonth) continue;

        var pFrom = formatTimeSlot(oldRow[2]);
        var pTo = "";
        if (pFrom) {
          var parts = pFrom.split(":");
          var h = (parseInt(parts[0], 10) + 1) % 24;
          pTo = (h < 10 ? "0" + h : h) + ":" + parts[1];
        }
        var isAct = (oldRow[5] === false || String(oldRow[5]).toLowerCase() === "false") ? false : true;
        var cDate = oldRow[6] ? Utilities.formatDate(oldRow[6] instanceof Date ? oldRow[6] : new Date(), "Asia/Bangkok", "yyyy-MM-dd HH:mm:ss") : Utilities.formatDate(new Date(), "Asia/Bangkok", "yyyy-MM-dd HH:mm:ss");
        var cBy = String(oldRow[7] || "admin").trim();
        var uDate = oldRow[8] ? Utilities.formatDate(oldRow[8] instanceof Date ? oldRow[8] : new Date(), "Asia/Bangkok", "yyyy-MM-dd HH:mm:ss") : cDate;
        var uBy = String(oldRow[9] || "admin").trim();

        migratedRows.push([
          pMonth, dMonth, defaultStaffId, pFrom, pTo, isAct, cDate, cBy, uDate, uBy
        ]);
      }

      sheet.clearContents();
      var combined = [headers].concat(migratedRows);
      sheet.getRange(1, 1, combined.length, headers.length).setValues(combined);
    } else {
      if (sheet.getMaxColumns() < headers.length) {
        sheet.insertColumnsAfter(sheet.getMaxColumns(), headers.length - sheet.getMaxColumns());
      }
      var hRange = sheet.getRange(1, 1, 1, headers.length);
      hRange.setValues([headers]);
    }

    var headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setBackground("#1B3B36")
      .setFontColor("#FFFFFF")
      .setFontWeight("bold")
      .setHorizontalAlignment("center")
      .setVerticalAlignment("middle");
    sheet.setRowHeight(1, 40);
    sheet.setFrozenRows(1);

    var curLastRow = sheet.getLastRow();
    if (curLastRow > 1) {
      try {
        sheet.getRange(2, 1, curLastRow - 1, 5).setNumberFormat("@");
        sheet.getRange(2, 1, curLastRow - 1, 6).setHorizontalAlignment("center");
        sheet.getRange(2, 7, curLastRow - 1, 4).setHorizontalAlignment("center");
      } catch (e) {}
    }

    for (var c = 1; c <= headers.length; c++) {
      sheet.autoResizeColumn(c);
    }

    return {
      success: true,
      message: "ตั้งค่า Schema ชีตตั้งค่าตารางการจอง 10 คอลัมน์ (period_month, day_month, staff_id, period_from, period_to, is_active) เรียบร้อยแล้ว"
    };
  } catch (err) {
    return {
      success: false,
      message: "เกิดข้อผิดพลาดในการตั้งค่า Schema ตารางการจอง: " + err.message
    };
  }
}

/**
 * ดึงรายการเดือน (period_month) ที่มีข้อมูลอยู่ในระบบ
 */
function getDistinctTimetableMonths() {
  try {
    initSheetIfNeeded();
    var sheet = getSettingTimetableSheet();
    var lastRow = sheet.getLastRow();
    var months = [];

    if (lastRow > 1) {
      var vals = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
      var seen = {};
      for (var i = 0; i < vals.length; i++) {
        var m = normalizePeriodMonth(vals[i][0]);
        if (m && !seen[m]) {
          seen[m] = true;
          months.push(m);
        }
      }
    }

    months.sort(function(a, b) {
      return b.localeCompare(a); // เรียงจากเดือนล่าสุดไปหาอดีต
    });

    return months;
  } catch (e) {
    return [];
  }
}

/**
 * ดึงข้อมูลตารางการจองตามเดือนที่ระบุ (period_month)
 * @param {string} periodMonth เช่น "2026-09"
 * @param {string} requesterUsername
 */
function getReservationTimetable(periodMonth, requesterUsername) {
  try {
    initSheetIfNeeded();
    var sheet = getSettingTimetableSheet();
    var availableMonths = getDistinctTimetableMonths();

    // หากไม่ระบุ periodMonth ให้ใช้ค่าเดือนที่เลือก หรือเดือนปัจจุบัน
    var targetMonth = String(periodMonth || "").trim();
    if (!targetMonth) {
      var currentMonthStr = Utilities.formatDate(new Date(), "Asia/Bangkok", "yyyy-MM");
      if (availableMonths.indexOf(currentMonthStr) !== -1) {
        targetMonth = currentMonthStr;
      } else if (availableMonths.length > 0) {
        targetMonth = availableMonths[0];
      } else {
        targetMonth = currentMonthStr;
      }
    }

    var lastRow = sheet.getLastRow();
    var list = [];

    if (lastRow > 1) {
      var headers = sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), 10)).getValues()[0].map(function(h) { return String(h || "").trim(); });
      var isNewSchema = (headers.indexOf("staff_id") !== -1 || headers[2] === "staff_id");

      var data = sheet.getRange(2, 1, lastRow - 1, 10).getValues();
      for (var r = 0; r < data.length; r++) {
        var row = data[r];
        var rowMonth = normalizePeriodMonth(row[0]);
        if (rowMonth !== targetMonth) continue;

        var dayMonth = normalizeDayMonth(row[1]);

        var staffId = "";
        var periodFrom = "";
        var periodTo = "";
        var isActive = true;
        var createDate = "-";
        var createdBy = "-";
        var updateDate = "-";
        var updatedBy = "-";

        if (isNewSchema) {
          staffId = String(row[2] || "").trim();
          periodFrom = formatTimeSlot(row[3]);
          periodTo = formatTimeSlot(row[4]);
          isActive = (row[5] === false || String(row[5]).toLowerCase() === "false") ? false : true;
          createDate = row[6] instanceof Date ? Utilities.formatDate(row[6], "Asia/Bangkok", "yyyy-MM-dd HH:mm") : String(row[6] || "-");
          createdBy = String(row[7] || "-");
          updateDate = row[8] instanceof Date ? Utilities.formatDate(row[8], "Asia/Bangkok", "yyyy-MM-dd HH:mm") : String(row[8] || "-");
          updatedBy = String(row[9] || "-");
        } else {
          periodFrom = formatTimeSlot(row[2]);
          isActive = (row[5] === false || String(row[5]).toLowerCase() === "false") ? false : true;
          createDate = row[6] instanceof Date ? Utilities.formatDate(row[6], "Asia/Bangkok", "yyyy-MM-dd HH:mm") : String(row[6] || "-");
          createdBy = String(row[7] || "-");
          updateDate = row[8] instanceof Date ? Utilities.formatDate(row[8], "Asia/Bangkok", "yyyy-MM-dd HH:mm") : String(row[8] || "-");
          updatedBy = String(row[9] || "-");
        }

        list.push({
          rowId: r + 2,
          periodMonth: rowMonth,
          dayMonth: dayMonth,
          staffId: staffId,
          periodFrom: periodFrom,
          periodTo: periodTo,
          time: periodFrom, // maintain backwards compatibility
          isActive: isActive,
          createDate: createDate,
          createdBy: createdBy,
          updateDate: updateDate,
          updatedBy: updatedBy
        });
      }
    }

    // เรียงตามวันที่ (day_month) จาก 01 ถึง 31 แล้วตามด้วย staffId แล้วตามด้วย periodFrom
    list.sort(function(a, b) {
      var dayDiff = a.dayMonth.localeCompare(b.dayMonth);
      if (dayDiff !== 0) return dayDiff;
      var staffDiff = (a.staffId || "").localeCompare(b.staffId || "");
      if (staffDiff !== 0) return staffDiff;
      return (a.periodFrom || "").localeCompare(b.periodFrom || "");
    });

    return {
      success: true,
      data: list,
      periodMonth: targetMonth,
      availableMonths: availableMonths,
      totalSlots: list.length,
      sheetName: SHEET_NAME_SETTING_TIMETABLE,
      message: "ดึงข้อมูลตารางการจองสำเร็จ"
    };
  } catch (err) {
    return {
      success: false,
      message: "เกิดข้อผิดพลาดในการดึงข้อมูลตารางการจอง: " + err.message
    };
  }
}

/**
 * ดึงข้อมูลตัวเลือกเวลาจาก Sheet_Name_Setting_Reservation_Timetable ตามวันที่ที่ระบุ (dateStr: YYYY-MM-DD)
 * โดยดึงเฉพาะเวลาที่มี is_active เท่ากับ true มาแสดงเป็น option ให้เลือก
 * @param {string} dateStr วันที่ที่ต้องการดึง เช่น "2026-10-08"
 * @returns {Object} { success: boolean, date: string, slots: string[] }
 */
function getActiveTimetableSlotsByDate(dateStr) {
  try {
    initSheetIfNeeded();
    var sheet = getSettingTimetableSheet();
    var lastRow = sheet.getLastRow();
    if (lastRow < 2) {
      return { success: true, date: dateStr, slots: [], message: "ไม่พบข้อมูลในตารางการจอง" };
    }

    var cleanDate = String(dateStr || "").trim();
    var parts = cleanDate.split("-");
    if (parts.length < 3) {
      return { success: false, message: "รูปแบบวันที่ไม่ถูกต้อง (ต้องเป็น YYYY-MM-DD)" };
    }

    var targetPeriodMonth = parts[0] + "-" + (parseInt(parts[1], 10) < 10 ? "0" + parseInt(parts[1], 10) : parts[1]);
    var targetDayMonth = normalizeDayMonth(parts[2]);

    var headers = sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), 10)).getValues()[0].map(function(h) { return String(h || "").trim(); });
    var isNewSchema = (headers.indexOf("staff_id") !== -1 || headers[2] === "staff_id");

    var data = sheet.getRange(2, 1, lastRow - 1, 6).getValues();
    var activeSlots = [];

    for (var i = 0; i < data.length; i++) {
      var row = data[i];
      var rMonth = normalizePeriodMonth(row[0]);
      var rDay = normalizeDayMonth(row[1]);
      if (rMonth !== targetPeriodMonth || rDay !== targetDayMonth) continue;

      var rFrom = isNewSchema ? formatTimeSlot(row[3]) : formatTimeSlot(row[2]);
      var rTo = isNewSchema ? formatTimeSlot(row[4]) : "";
      var rActive = (row[5] === false || String(row[5]).toLowerCase() === "false") ? false : true;

      if (rActive && rFrom) {
        if (activeSlots.indexOf(rFrom) === -1) {
          activeSlots.push(rFrom);
        }
        if (rTo && activeSlots.indexOf(rTo) === -1) {
          activeSlots.push(rTo);
        }
      }
    }

    activeSlots.sort();
    return {
      success: true,
      date: cleanDate,
      slots: activeSlots,
      message: "ดึงข้อมูลรอบเวลาสำเร็จ"
    };
  } catch (err) {
    return {
      success: false,
      message: "เกิดข้อผิดพลาดในการดึงรอบเวลา: " + err.message
    };
  }
}

/**
 * สร้างตารางการจองประจำเดือน (Loop วันที่, Loop พนักงาน และ Loop ช่วงเวลา)
 * 1. ตรวจสอบจำนวนวันในเดือนที่เลือก (เช่น เดือน 2026-09 มี 30 วัน สร้าง 01 ถึง 30)
 * 2. ดึงค่า staff_id จาก Sheet_Name_Staff เฉพาะ is_active = true
 * 3. ดึงช่วงเวลา period_from และ period_to จาก Sheet_Name_Setting_Selection_Reservation_Time
 * 4. วันเสาร์ และ อาทิตย์ กำหนด is_active = false
 * @param {Object} payload { periodMonth: "2026-09", overwrite: false, operatorUsername: "admin" }
 */
function generateReservationTimetable(payload) {
  try {
    initSheetIfNeeded();

    if (!payload || !payload.periodMonth) {
      return { success: false, message: "กรุณาระบุเดือนและปีที่ต้องการสร้าง (period_month)" };
    }

    var periodMonth = String(payload.periodMonth).trim();
    if (!/^\d{4}-\d{2}$/.test(periodMonth)) {
      return { success: false, message: "รูปแบบเดือนไม่ถูกต้อง ต้องอยู่ในรูปแบบ YYYY-MM เช่น 2026-09" };
    }

    var parts = periodMonth.split("-");
    var year = parseInt(parts[0], 10);
    var month = parseInt(parts[1], 10);
    if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
      return { success: false, message: "ค่าปีหรือเดือนไม่ถูกต้อง" };
    }

    // 1. ตรวจสอบว่าเดือนที่เลือกมีกี่วัน (เช่น เดือน 2026-09 มี 30 วัน)
    var daysInMonth = new Date(year, month, 0).getDate();

    // 2. ดึงค่า staff_id จากตัวแปร Sheet_Name_Staff เฉพาะ field ที่ is_active = true
    var activeStaffList = getActiveStaffList();
    if (!activeStaffList || activeStaffList.length === 0) {
      return {
        success: false,
        message: "ไม่พบข้อมูลพนักงานที่เปิดใช้งานในระบบ กรุณาเพิ่มหรือเปิดใช้งานข้อมูลพนักงานในชีต '" + SHEET_NAME_STAFF + "' ก่อนสร้างตารางการจอง"
      };
    }

    // 3. ดึงค่าจาก sheet ในตัวแปร Sheet_Name_Setting_Selection_Reservation_Time (period_from และ period_to)
    var activeTimeSlots = getActiveSettingTimeSlotsWithRange();
    if (!activeTimeSlots || activeTimeSlots.length === 0) {
      return {
        success: false,
        message: "ไม่พบช่วงเวลาเปิดให้บริการในชีต '" + SHEET_NAME_SETTING_TIME + "' กรุณาตั้งค่าและเปิดใช้งานช่วงเวลาก่อนสร้างตาราง"
      };
    }

    var sheet = getSettingTimetableSheet();
    var lastRow = sheet.getLastRow();
    var existingCount = 0;
    var existingMap = {};
    var allExistingData = [];

    if (lastRow > 1) {
      allExistingData = sheet.getRange(2, 1, lastRow - 1, 10).getValues();
      for (var r = 0; r < allExistingData.length; r++) {
        var row = allExistingData[r];
        if (String(row[0] || "").trim() === periodMonth) {
          existingCount++;
          var dStr = String(row[1] || "").trim();
          if (dStr.length === 1) dStr = "0" + dStr;
          var sId = String(row[2] || "").trim();
          var pFrom = formatTimeSlot(row[3]);
          var key = dStr + "_" + sId + "_" + pFrom;
          existingMap[key] = {
            isActive: (row[5] === false || String(row[5]).toLowerCase() === "false") ? false : true,
            createDate: row[6],
            createdBy: row[7]
          };
        }
      }
    }

    // หากมีข้อมูลเดิมอยู่แล้ว และไม่ได้สั่งให้ overwrite ให้ส่งแจ้งเตือนกลับไป
    if (existingCount > 0 && !payload.overwrite) {
      return {
        success: false,
        alreadyExists: true,
        existingCount: existingCount,
        message: "พบข้อมูลตารางการจองของเดือน " + periodMonth + " อยู่แล้ว (" + existingCount + " รายการ) ท่านต้องการสร้างใหม่ทับของเดิมหรือไม่?"
      };
    }

    var operator = String(payload.operatorUsername || "admin").trim();
    var nowStr = Utilities.formatDate(new Date(), "Asia/Bangkok", "yyyy-MM-dd HH:mm:ss");

    var newRowsForMonth = [];

    // วน Loop วันที่ (1 ถึง daysInMonth เช่น 01 ถึง 30)
    for (var d = 1; d <= daysInMonth; d++) {
      var dayMonthStr = ("0" + d).slice(-2); // "01", "02", ..., "30"

      // ตรวจสอบวันเสาร์ และ อาทิตย์: วันเสาร์ (6) และ วันอาทิตย์ (0) ให้เปลี่ยนค่า is_active จาก true เป็น false
      var dateObj = new Date(year, month - 1, d, 12, 0, 0);
      var dayOfWeek = dateObj.getDay(); // 0 = Sunday (อาทิตย์), 6 = Saturday (เสาร์)
      var isWeekend = (dayOfWeek === 0 || dayOfWeek === 6);

      // วน Loop ในพนักงานแต่ละคน (staff_id จาก Sheet_Name_Staff เฉพาะ is_active = true)
      for (var s = 0; s < activeStaffList.length; s++) {
        var staffId = activeStaffList[s].staffId;

        // วน Loop ช่วงเวลา (ดึงค่า period_from และ period_to จาก Sheet_Name_Setting_Selection_Reservation_Time)
        for (var t = 0; t < activeTimeSlots.length; t++) {
          var slot = activeTimeSlots[t];
          var slotKey = dayMonthStr + "_" + staffId + "_" + slot.periodFrom;

          // ค่าเริ่มต้น: วันจันทร์-ศุกร์ = true, วันเสาร์-อาทิตย์ = false
          var isAct = isWeekend ? false : (payload.overwrite && existingMap[slotKey] ? existingMap[slotKey].isActive : true);
          var cDate = (payload.overwrite && existingMap[slotKey] && existingMap[slotKey].createDate) ? existingMap[slotKey].createDate : nowStr;
          var cBy = (payload.overwrite && existingMap[slotKey] && existingMap[slotKey].createdBy) ? existingMap[slotKey].createdBy : operator;

          newRowsForMonth.push([
            periodMonth,      // 1. period_month
            dayMonthStr,      // 2. day_month ("01", "02" ...)
            staffId,          // 3. staff_id
            slot.periodFrom,  // 4. period_from
            slot.periodTo,    // 5. period_to
            isAct,            // 6. is_active (default true, weekend = false)
            cDate,            // 7. create_date
            cBy,              // 8. created_by (username)
            nowStr,           // 9. update_date
            operator          // 10. updated_by (username)
          ]);
        }
      }
    }

    var headers = [
      "period_month", "day_month", "staff_id", "period_from", "period_to",
      "is_active", "create_date", "created_by", "update_date", "updated_by"
    ];

    // บันทึกข้อมูลลงชีตแบบ Batch เพื่อความรวดเร็วและแม่นยำ
    if (payload.overwrite && existingCount > 0) {
      // เก็บแถวของเดือนอื่นที่ไม่ใช่เดือนนี้ไว้
      var preservedRows = [];
      for (var r = 0; r < allExistingData.length; r++) {
        if (String(allExistingData[r][0] || "").trim() !== periodMonth) {
          preservedRows.push(allExistingData[r].slice(0, 10));
        }
      }

      var combinedData = [headers].concat(preservedRows).concat(newRowsForMonth);

      sheet.clearContents();
      sheet.getRange(1, 1, combinedData.length, 10).setValues(combinedData);
      sheet.getRange(1, 1, 1, 10).setBackground("#1B3B36")
        .setFontColor("#FFFFFF")
        .setFontWeight("bold")
        .setHorizontalAlignment("center")
        .setVerticalAlignment("middle");
      sheet.setRowHeight(1, 40);
      sheet.setFrozenRows(1);

      if (combinedData.length > 1) {
        try {
          sheet.getRange(2, 1, combinedData.length - 1, 5).setNumberFormat("@");
          sheet.getRange(2, 1, combinedData.length - 1, 6).setHorizontalAlignment("center");
          sheet.getRange(2, 7, combinedData.length - 1, 4).setHorizontalAlignment("center");
        } catch (e) {}
      }
    } else {
      var startRow = sheet.getLastRow() + 1;
      sheet.getRange(startRow, 1, newRowsForMonth.length, 10).setValues(newRowsForMonth);
      try {
        sheet.getRange(startRow, 1, newRowsForMonth.length, 5).setNumberFormat("@");
        sheet.getRange(startRow, 1, newRowsForMonth.length, 6).setHorizontalAlignment("center");
        sheet.getRange(startRow, 7, newRowsForMonth.length, 4).setHorizontalAlignment("center");
      } catch (e) {}
    }

    for (var col = 1; col <= 10; col++) {
      sheet.autoResizeColumn(col);
    }

    return {
      success: true,
      message: "สร้างตารางการจองเดือน " + periodMonth + " เรียบร้อยแล้ว (จำนวน " + newRowsForMonth.length + " รายการ จากพนักงาน " + activeStaffList.length + " ท่าน)",
      periodMonth: periodMonth,
      totalCreated: newRowsForMonth.length,
      staffCount: activeStaffList.length
    };
  } catch (err) {
    return {
      success: false,
      message: "เกิดข้อผิดพลาดในการสร้างตารางการจอง: " + err.message
    };
  }
}

/**
 * แก้ไขข้อมูลรอบเวลาในตารางการจอง (เปิด/ปิด is_active)
 */
function updateTimetableSlot(payload) {
  try {
    initSheetIfNeeded();
    if (!payload || !payload.rowId) {
      return { success: false, message: "ไม่พบรหัสแถวข้อมูลที่ต้องการแก้ไข" };
    }

    var rowId = parseInt(payload.rowId, 10);
    var sheet = getSettingTimetableSheet();
    var lastRow = sheet.getLastRow();
    if (isNaN(rowId) || rowId < 2 || rowId > lastRow) {
      return { success: false, message: "ตำแหน่งแถวข้อมูลไม่ถูกต้องหรือไม่มีอยู่ในระบบ" };
    }

    var operator = String(payload.operatorUsername || "admin").trim();
    var nowStr = Utilities.formatDate(new Date(), "Asia/Bangkok", "yyyy-MM-dd HH:mm:ss");

    var newIsActive = (payload.isActive !== false && String(payload.isActive).toLowerCase() !== "false");

    sheet.getRange(rowId, 6).setValue(newIsActive); // is_active
    sheet.getRange(rowId, 9).setValue(nowStr);      // update_date
    sheet.getRange(rowId, 10).setValue(operator);   // updated_by

    return {
      success: true,
      message: "แก้ไขข้อมูลรอบเวลาสำเร็จ",
      rowId: rowId,
      isActive: newIsActive
    };
  } catch (err) {
    return {
      success: false,
      message: "เกิดข้อผิดพลาดในการแก้ไขรอบเวลา: " + err.message
    };
  }
}

/**
 * สลับสถานะเปิด/ปิดใช้งาน (Toggle is_active) ของรอบเวลาในตารางการจอง
 */
function toggleTimetableSlotActive(rowId, operatorUsername) {
  try {
    initSheetIfNeeded();
    rowId = parseInt(rowId, 10);
    var sheet = getSettingTimetableSheet();
    var lastRow = sheet.getLastRow();
    if (isNaN(rowId) || rowId < 2 || rowId > lastRow) {
      return { success: false, message: "ตำแหน่งแถวข้อมูลไม่ถูกต้อง" };
    }

    var operator = String(operatorUsername || "admin").trim();
    var nowStr = Utilities.formatDate(new Date(), "Asia/Bangkok", "yyyy-MM-dd HH:mm:ss");

    var currentActive = sheet.getRange(rowId, 6).getValue();
    var nextActive = !(currentActive === true || String(currentActive).toLowerCase() === "true");

    sheet.getRange(rowId, 6).setValue(nextActive);
    sheet.getRange(rowId, 9).setValue(nowStr);
    sheet.getRange(rowId, 10).setValue(operator);

    return {
      success: true,
      isActive: nextActive,
      message: "เปลี่ยนสถานะเป็น " + (nextActive ? "เปิดใช้งาน" : "ปิดการใช้งาน") + " เรียบร้อยแล้ว"
    };
  } catch (err) {
    return {
      success: false,
      message: "เกิดข้อผิดพลาดในการเปลี่ยนสถานะ: " + err.message
    };
  }
}

/**
 * สลับสถานะเปิด/ปิดใช้งานทุกรอบในวันที่ระบุ (Bulk Toggle Day Slots)
 */
function bulkToggleDayTimetableSlots(periodMonth, dayMonth, setActive, operatorUsername) {
  try {
    initSheetIfNeeded();
    if (!periodMonth || !dayMonth) {
      return { success: false, message: "กรุณาระบุเดือนและวันที่" };
    }

    var sheet = getSettingTimetableSheet();
    var lastRow = sheet.getLastRow();
    if (lastRow < 2) {
      return { success: false, message: "ไม่มีข้อมูลตารางการจองในระบบ" };
    }

    var operator = String(operatorUsername || "admin").trim();
    var nowStr = Utilities.formatDate(new Date(), "Asia/Bangkok", "yyyy-MM-dd HH:mm:ss");
    var targetDay = String(dayMonth).trim();
    if (targetDay.length === 1) targetDay = "0" + targetDay;

    var data = sheet.getRange(2, 1, lastRow - 1, 10).getValues();
    var count = 0;
    var changed = false;

    for (var r = 0; r < data.length; r++) {
      var rowMonth = String(data[r][0] || "").trim();
      var rawDay = String(data[r][1] || "").trim();
      if (rawDay.length === 1) rawDay = "0" + rawDay;

      if (rowMonth === periodMonth && rawDay === targetDay) {
        data[r][5] = (setActive === true || String(setActive).toLowerCase() === "true"); // is_active
        data[r][8] = nowStr;    // update_date
        data[r][9] = operator;  // updated_by
        count++;
        changed = true;
      }
    }

    if (changed) {
      sheet.getRange(2, 1, data.length, 10).setValues(data);
    }

    return {
      success: true,
      count: count,
      setActive: setActive,
      message: (setActive ? "เปิดใช้งาน" : "ปิดการใช้งาน") + " ทุกรอบของวันที่ " + targetDay + " สำเร็จ (" + count + " รอบ)"
    };
  } catch (err) {
    return {
      success: false,
      message: "เกิดข้อผิดพลาดในการเปลี่ยนสถานะ: " + err.message
    };
  }
}

/**
 * สลับสถานะเปิด/ปิดใช้งานทุกรอบของพนักงานที่ระบุในวันที่ระบุ (Bulk Toggle Staff Day Slots)
 */
function bulkToggleStaffDayTimetableSlots(periodMonth, dayMonth, staffId, setActive, operatorUsername) {
  try {
    initSheetIfNeeded();
    if (!periodMonth || !dayMonth || !staffId) {
      return { success: false, message: "กรุณาระบุเดือน วันที่ และรหัสพนักงาน" };
    }

    var sheet = getSettingTimetableSheet();
    var lastRow = sheet.getLastRow();
    if (lastRow < 2) {
      return { success: false, message: "ไม่มีข้อมูลตารางการจองในระบบ" };
    }

    var operator = String(operatorUsername || "admin").trim();
    var nowStr = Utilities.formatDate(new Date(), "Asia/Bangkok", "yyyy-MM-dd HH:mm:ss");
    var targetDay = String(dayMonth).trim();
    if (targetDay.length === 1) targetDay = "0" + targetDay;
    var targetStaff = String(staffId).trim();

    var data = sheet.getRange(2, 1, lastRow - 1, 10).getValues();
    var count = 0;
    var changed = false;

    for (var r = 0; r < data.length; r++) {
      var rowMonth = String(data[r][0] || "").trim();
      var rawDay = String(data[r][1] || "").trim();
      if (rawDay.length === 1) rawDay = "0" + rawDay;
      var rowStaff = String(data[r][2] || "").trim();

      if (rowMonth === periodMonth && rawDay === targetDay && rowStaff === targetStaff) {
        data[r][5] = (setActive === true || String(setActive).toLowerCase() === "true"); // is_active
        data[r][8] = nowStr;    // update_date
        data[r][9] = operator;  // updated_by
        count++;
        changed = true;
      }
    }

    if (changed) {
      sheet.getRange(2, 1, data.length, 10).setValues(data);
    }

    return {
      success: true,
      count: count,
      staffId: targetStaff,
      setActive: setActive,
      message: (setActive ? "เปิดใช้งาน" : "ปิดการใช้งาน") + " ทุกรอบของพนักงาน " + targetStaff + " ในวันที่ " + targetDay + " สำเร็จ (" + count + " รอบ)"
    };
  } catch (err) {
    return {
      success: false,
      message: "เกิดข้อผิดพลาดในการเปลี่ยนสถานะพนักงาน: " + err.message
    };
  }
}
