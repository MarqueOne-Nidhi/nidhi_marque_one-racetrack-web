# 🛠️ Fix Google Sheet 401 Unauthorized Permission & Setup Guide

I tested sending data to your Web App endpoint `https://script.google.com/a/macros/marque.one/s/.../exec`.
Google returned **`401 Unauthorized`**.

This happens because the deployment permission under your Google Workspace (`marque.one`) is set to restricted access. Follow these 2 quick steps to fix it in 30 seconds:

---

## Step 1: Set "Who has access" to "Anyone" (Fix 401 Unauthorized)

1. Open your Google Sheet → **Extensions** → **Apps Script**.
2. At the top right, click **Deploy** → **Manage deployments**.
3. Click the **Pencil ✏️ (Edit)** icon at the top right of the popup.
4. Under **Version**, select **`New version`**.
5. Under **Who has access**, change it to **`Anyone`** *(Not "Only myself" or "Anyone within marque.one")*.
6. Click **Deploy**.

> 💡 *Why is this required?* Website visitors submitting the membership request are unauthenticated web users. Setting access to "Anyone" allows their submissions to reach your sheet without requiring them to log into `@marque.one`.

---

## Step 2: Use this Updated `doPost(e)` Code

Replace your current code in `Code.gs` with this upgraded script that handles both JSON and Form submissions:

```javascript
function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var data = {};

    // Parse JSON payload or URL parameters
    if (e && e.postData && e.postData.contents) {
      try {
        data = JSON.parse(e.postData.contents);
      } catch (err) {
        data = e.parameter || {};
      }
    } else if (e && e.parameter) {
      data = e.parameter;
    }

    var timestamp = data["Timestamp"] || data["timestamp"] || new Date().toLocaleString();
    var name = data["Full Name"] || data["name"] || "N/A";
    var phone = data["Phone/WhatsApp"] || data["phone"] || "N/A";
    var email = data["Email Address"] || data["email"] || "N/A";
    var vehicle = data["Primary Performance Vehicle (Optional)"] || data["vehicle"] || "N/A";
    var referralCode = data["Invitation Code/Referral (Optional)"] || data["code"] || "N/A";

    sheet.appendRow([
      timestamp,
      name,
      phone,
      email,
      vehicle,
      referralCode
    ]);

    return ContentService
      .createTextOutput(JSON.stringify({ result: "success" }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ result: "error", error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
```

---

## Step 3: Test Submission
Once you set **Who has access** to **`Anyone`** and click **Deploy (New version)**, every form request from `http://localhost:5173/` or your website will appear instantly in your Google Sheet!
