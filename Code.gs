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
const SHEET_NAME_STAFF = "ข้อมูลพนักงาน";
const SHEET_NAME_RESERVATION = "ข้อมูลการจอง";
const SHEET_NAME_SETTING_TIME = "ตั้งค่าตัวเลือกเวลาการจอง";
const MENU_NAME_SETTING = "ตั้งค่าระบบ";
const Menu_Name_Setting = "ตั้งค่าระบบ";
const Sheet_Name_Setting_Selection_Reservation_Time = SHEET_NAME_SETTING_TIME;

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
      return HtmlService.createHtmlOutput("<div style='font-family:sans-serif;padding:30px;max-width:600px;margin:40px auto;border:1px solid #c3e6cb;background:#d4edda;border-radius:10px;'><h2 style='color:#155724;margin-top:0;'>✅ อัปเดต Schema ตัวเลือกเวลาการจองสำเร็จ</h2><p style='color:#155724;font-size:16px;'>" + resTime.message + "</p><hr style='border:0;border-top:1px solid #c3e6cb;margin:20px 0;'><p style='color:#6c757d;font-size:14px;'>Google Sheet ตั้งค่าตัวเลือกเวลาการจอง (Sheet_Name_Setting_Selection_Reservation_Time) ได้รับการตั้งค่าหัวตาราง 6 คอลัมน์เรียบร้อยแล้ว ท่านสามารถปิดหน้านี้แล้วเปิดใช้งานระบบได้ตามปกติ</p></div>");
    }

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
    sheetNameStaff: SHEET_NAME_STAFF,
    sheetNameReservation: SHEET_NAME_RESERVATION,
    sheetNameSettingTime: SHEET_NAME_SETTING_TIME,
    menuNameSetting: MENU_NAME_SETTING,
    Menu_Name_Setting: MENU_NAME_SETTING,
    Sheet_Name_Setting_Selection_Reservation_Time: SHEET_NAME_SETTING_TIME,
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
      SpreadsheetApp.getActiveSpreadsheet().toast("อัปเดต Schema ข้อมูลลูกค้าเป็น 13 คอลัมน์ (พร้อม pwd) เรียบร้อยแล้ว", "สำเร็จ", 5);
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
      SpreadsheetApp.getActiveSpreadsheet().toast("อัปเดต Schema ข้อมูลพนักงานเป็น 13 คอลัมน์ (พร้อม pwd) เรียบร้อยแล้ว", "สำเร็จ", 5);
    } catch (e) {}

    return { success: true, message: "อัปเดต Schema ข้อมูลพนักงาน 13 คอลัมน์ (พร้อม pwd) และเติมรหัสผ่านเริ่มต้นเรียบร้อยแล้ว" };
  } catch (err) {
    return { success: false, message: "เกิดข้อผิดพลาดในการอัปเดต Schema พนักงาน: " + err.message };
  }
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
  setupCustomerSheetSchema();

  // 2.1 ตรวจสอบชีตข้อมูลพนักงาน (Sheet_Name_Staff)
  setupStaffSheetSchema();

  // 3. ตรวจสอบชีต "ตั้งค่าตัวเลือกเวลาการจอง" (Sheet_Name_Setting_Selection_Reservation_Time)
  setupSettingTimeSheetSchema();

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
      for (var i = 1; i < data.length; i++) {
        var row = data[i];
        var delFlag = "N";
        var isActive = true;
        if (row.length >= 7) {
          delFlag = String(row[6] || "N").trim().toUpperCase();
          isActive = (row[1] === false || String(row[1]).toLowerCase() === "false") ? false : true;
        } else {
          delFlag = String(row[5] || "N").trim().toUpperCase();
        }

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
    var headers = ["period", "is_active", "create_date", "created_by", "update_date", "updated_by", "deleted_flag"];
    var nowStr = Utilities.formatDate(new Date(), "Asia/Bangkok", "yyyy-MM-dd HH:mm:ss");

    var lastRow = sheet.getLastRow();
    if (lastRow === 0) {
      sheet.appendRow(headers);
      var headerRange = sheet.getRange(1, 1, 1, headers.length);
      headerRange.setBackground("#1B3B36");
      headerRange.setFontColor("#FFFFFF");
      headerRange.setFontWeight("bold");
      headerRange.setHorizontalAlignment("center");
      headerRange.setVerticalAlignment("middle");
      sheet.setRowHeight(1, 40);
      sheet.setFrozenRows(1);

      var defaultTimes = ["10:00", "11:30", "13:00", "14:30", "16:00", "17:30", "19:00", "20:30"];
      for (var t = 0; t < defaultTimes.length; t++) {
        sheet.appendRow([defaultTimes[t], true, nowStr, "admin", nowStr, "admin", "N"]);
      }
      sheet.getRange("A:A").setNumberFormat("@");
      for (var tc = 1; tc <= headers.length; tc++) {
        sheet.autoResizeColumn(tc);
      }
      return { success: true, message: "สร้างชีตตั้งค่าตัวเลือกเวลาการจอง 7 คอลัมน์สำเร็จ" };
    }

    // Auto-migrate: ตรวจสอบว่ามีคอลัมน์ is_active หรือไม่ หากไม่มีให้แทรกคอลัมน์ถัดจาก period (column 1)
    var currentHeaderRange = sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), 1));
    var currentHeaders = currentHeaderRange.getValues()[0];
    if (currentHeaders.indexOf("is_active") === -1) {
      sheet.insertColumnAfter(1); // แทรกคอลัมน์ B ถัดจาก period
      sheet.getRange(1, 2).setValue("is_active");
      if (lastRow > 1) {
        var activeRange = sheet.getRange(2, 2, lastRow - 1, 1);
        var activeVals = [];
        for (var i = 0; i < lastRow - 1; i++) {
          activeVals.push([true]);
        }
        activeRange.setValues(activeVals);
      }
    }

    if (sheet.getMaxColumns() < headers.length) {
      sheet.insertColumnsAfter(sheet.getMaxColumns(), headers.length - sheet.getMaxColumns());
    }

    var hRange = sheet.getRange(1, 1, 1, headers.length);
    hRange.setValues([headers]);
    hRange.setBackground("#1B3B36");
    hRange.setFontColor("#FFFFFF");
    hRange.setFontWeight("bold");
    hRange.setHorizontalAlignment("center");
    hRange.setVerticalAlignment("middle");
    sheet.setRowHeight(1, 40);
    sheet.setFrozenRows(1);

    // ตรวจสอบและเติมค่าในแถวที่มีอยู่แล้ว
    if (lastRow > 1) {
      var data = sheet.getRange(2, 1, lastRow - 1, headers.length).getValues();
      var changed = false;
      for (var r = 0; r < data.length; r++) {
        var p = formatTimeSlot(data[r][0]);
        if (p && p !== data[r][0]) {
          data[r][0] = p;
          changed = true;
        }
        // is_active (คอลัมน์ 2 index 1): ถ้ายังไม่มีค่า ให้ default เป็น true
        if (data[r][1] === "" || data[r][1] === null || data[r][1] === undefined) {
          data[r][1] = true;
          changed = true;
        }
        // create_date (คอลัมน์ 3 index 2)
        if (!data[r][2]) {
          data[r][2] = nowStr;
          changed = true;
        }
        // created_by (คอลัมน์ 4 index 3)
        if (!data[r][3]) {
          data[r][3] = "admin";
          changed = true;
        }
        // update_date (คอลัมน์ 5 index 4)
        if (!data[r][4]) {
          data[r][4] = nowStr;
          changed = true;
        }
        // updated_by (คอลัมน์ 6 index 5)
        if (!data[r][5]) {
          data[r][5] = "admin";
          changed = true;
        }
        // deleted_flag (คอลัมน์ 7 index 6)
        if (!data[r][6]) {
          data[r][6] = "N";
          changed = true;
        }
      }
      if (changed) {
        sheet.getRange(2, 1, data.length, headers.length).setValues(data);
      }
    }

    sheet.getRange("A:A").setNumberFormat("@");
    for (var c = 1; c <= headers.length; c++) {
      sheet.autoResizeColumn(c);
    }

    return {
      success: true,
      message: "อัปเดต Schema ชีตตั้งค่าตัวเลือกเวลาการจอง 7 คอลัมน์เรียบร้อยแล้ว"
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
      for (var r = 1; r < data.length; r++) {
        var row = data[r];
        var period = formatTimeSlot(row[0]);
        if (!period) continue;

        // is_active อยู่คอลัมน์ 2 (index 1)
        var isActive = (row[1] === false || String(row[1]).toLowerCase() === "false") ? false : true;
        var createDate = row[2] instanceof Date ? Utilities.formatDate(row[2], "Asia/Bangkok", "yyyy-MM-dd HH:mm") : String(row[2] || "-");
        var createdBy = String(row[3] || "-");
        var updateDate = row[4] instanceof Date ? Utilities.formatDate(row[4], "Asia/Bangkok", "yyyy-MM-dd HH:mm") : String(row[4] || "-");
        var updatedBy = String(row[5] || "-");
        var deletedFlag = String(row[6] || "N").trim().toUpperCase();

        // Soft Delete: ถ้าถูกลบแล้ว ไม่แสดงในตารางจัดการ
        if (deletedFlag === "Y") continue;

        list.push({
          rowId: r + 1,
          period: period,
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
      return a.period.localeCompare(b.period);
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
 * เพิ่มข้อมูลรอบเวลาการจองใหม่
 */
function addSettingTimeSlot(payload) {
  try {
    initSheetIfNeeded();
    if (!payload || !payload.period) {
      return { success: false, message: "กรุณาระบุเวลาที่เปิดให้จอง (period)" };
    }

    var rawPeriod = String(payload.period).trim();
    var period = formatTimeSlot(rawPeriod);
    if (!/^\d{2}:\d{2}$/.test(period)) {
      return { success: false, message: "รูปแบบเวลาไม่ถูกต้อง กรุณาระบุในรูปแบบ HH:mm เช่น 10:00, 11:30" };
    }

    var isActive = (payload.isActive !== false && String(payload.isActive).toLowerCase() !== "false");
    var operator = String(payload.operatorUsername || "admin").trim();
    var nowStr = Utilities.formatDate(new Date(), "Asia/Bangkok", "yyyy-MM-dd HH:mm:ss");

    var sheet = getSettingTimeSheet();
    var data = sheet.getDataRange().getValues();

    var existingRow = -1;
    var existingDeleted = false;

    if (data.length > 1) {
      for (var r = 1; r < data.length; r++) {
        var p = formatTimeSlot(data[r][0]);
        var delFlag = String(data[r][6] || "N").trim().toUpperCase();
        if (p === period) {
          if (delFlag === "Y") {
            existingRow = r + 1;
            existingDeleted = true;
          } else {
            return { success: false, message: "รอบเวลา " + period + " มีอยู่ในระบบแล้ว" };
          }
        }
      }
    }

    if (existingDeleted && existingRow > 0) {
      sheet.getRange(existingRow, 2).setValue(isActive); // is_active
      sheet.getRange(existingRow, 5).setValue(nowStr);   // update_date
      sheet.getRange(existingRow, 6).setValue(operator); // updated_by
      sheet.getRange(existingRow, 7).setValue("N");      // deleted_flag = N
      return {
        success: true,
        message: "เพิ่มรอบเวลา " + period + " สำเร็จ (เปิดใช้งานรอบเวลาเดิม)"
      };
    }

    sheet.appendRow([period, isActive, nowStr, operator, nowStr, operator, "N"]);
    var lastRow = sheet.getLastRow();
    sheet.getRange(lastRow, 1).setNumberFormat("@");

    return {
      success: true,
      message: "เพิ่มรอบเวลา " + period + " สำเร็จ"
    };
  } catch (err) {
    return {
      success: false,
      message: "เกิดข้อผิดพลาดในการเพิ่มรอบเวลา: " + err.message
    };
  }
}

/**
 * แก้ไขข้อมูลรอบเวลาการจอง
 */
function updateSettingTimeSlot(payload) {
  try {
    initSheetIfNeeded();
    if (!payload || !payload.rowId) {
      return { success: false, message: "ไม่พบรหัสแถวข้อมูลที่ต้องการแก้ไข" };
    }

    var rowId = parseInt(payload.rowId, 10);
    var rawPeriod = String(payload.period || "").trim();
    var period = formatTimeSlot(rawPeriod);
    if (!/^\d{2}:\d{2}$/.test(period)) {
      return { success: false, message: "รูปแบบเวลาไม่ถูกต้อง กรุณาระบุในรูปแบบ HH:mm เช่น 10:00, 11:30" };
    }

    var isActive = (payload.isActive !== false && String(payload.isActive).toLowerCase() !== "false");
    var operator = String(payload.operatorUsername || "admin").trim();
    var nowStr = Utilities.formatDate(new Date(), "Asia/Bangkok", "yyyy-MM-dd HH:mm:ss");

    var sheet = getSettingTimeSheet();
    var data = sheet.getDataRange().getValues();

    if (rowId < 2 || rowId > data.length) {
      return { success: false, message: "ไม่พบข้อมูลแถวที่ต้องการแก้ไขในระบบ" };
    }

    for (var r = 1; r < data.length; r++) {
      if (r + 1 !== rowId) {
        var p = formatTimeSlot(data[r][0]);
        var del = String(data[r][6] || "N").trim().toUpperCase();
        if (p === period && del !== "Y") {
          return { success: false, message: "รอบเวลา " + period + " ซ้ำกับรอบเวลาอื่นที่มีอยู่แล้ว" };
        }
      }
    }

    sheet.getRange(rowId, 1).setValue(period).setNumberFormat("@");
    sheet.getRange(rowId, 2).setValue(isActive); // is_active
    sheet.getRange(rowId, 5).setValue(nowStr);   // update_date
    sheet.getRange(rowId, 6).setValue(operator); // updated_by

    return {
      success: true,
      message: "แก้ไขรอบเวลาเป็น " + period + " สำเร็จ"
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

    sheet.getRange(rowId, 5).setValue(nowStr);   // update_date
    sheet.getRange(rowId, 6).setValue(operator); // updated_by
    sheet.getRange(rowId, 7).setValue("Y");      // deleted_flag = 'Y'

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
