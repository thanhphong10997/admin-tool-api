const fs = require('fs').promises;
const path = require('path');
const process = require('process');
const {authenticate} = require('@google-cloud/local-auth');
const {google} = require('googleapis');
const {GoogleAuth} = require('google-auth-library');

async function GoogleSheet(sheetId, columns) {

    const auth = new google.auth.GoogleAuth({
        keyFile: path.join(__dirname, 'credentials.json'),
        scopes: "https://www.googleapis.com/auth/spreadsheets",
    });

    // Create client instance for auth
    const client = await auth.getClient();

    // Instance of google sheets api
    const googleSheets = google.sheets({ 
        version: "v4", 
        auth:client
    });

    const spreadsheetId = sheetId;

    // Read row from spreadsheet
    // const getRows = await googleSheets.spreadsheets.values.get({
    //     auth,
    //     spreadsheetId,
    //     range: "Sheet1"
    // })

    // Write row(s) to spreadsheet
    await googleSheets.spreadsheets.values.append({
        auth,
        spreadsheetId,
        range: "Sheet1",
        valueInputOption: "USER_ENTERED",
        resource: {
            values: [
                columns,
            ],
        },
    });

    // Get metadata about spreadsheet
    const metaData =  await googleSheets.spreadsheets.get({
        auth,
        spreadsheetId,
    });

    console.log(metaData.data.spreadsheetUrl);

    return metaData.data.spreadsheetUrl;
}

async function createGoogleSheet(title) {
    const {GoogleAuth} = require('google-auth-library');
    const {google} = require('googleapis');

    const auth = new google.auth.GoogleAuth({
      scopes: ['https://www.googleapis.com/auth/spreadsheets', 'https://www.googleapis.com/auth/drive'],
      keyFile: path.join(__dirname, 'credentials.json'),
    });

    const service = google.sheets({version: 'v4', auth});
    const drive = google.drive({ version: 'v3', auth });

    const resource = {
      properties: {
        title,
      },
    };

    try {
        const spreadsheet = await service.spreadsheets.create({
            resource,
            fields: 'spreadsheetId',
        });

        const fileId = spreadsheet.data.spreadsheetId;
        
        const res = await drive.permissions.create({
            resource: {
                type: "user",
                role: "writer",
                emailAddress: "giahuy4842@gmail.com",  // Please set the email address you want to give the permission.
            },
            fileId: fileId,
            fields: "id",
        });

        console.log(`Spreadsheet ID: ${spreadsheet.data.spreadsheetId}`);

        return spreadsheet.data.spreadsheetId;

    } catch (err) {
        // TODO (developer) - Handle exception
        throw err;
    }
}

async function updateValues(spreadsheetId, data) {
    const {GoogleAuth} = require('google-auth-library');
    const {google} = require('googleapis');

    const auth = new google.auth.GoogleAuth({
        scopes: 'https://www.googleapis.com/auth/spreadsheets',
        keyFile: path.join(__dirname, 'credentials.json'),
    });
  
    const service = google.sheets({version: 'v4', auth});

    try {
        const result = await service.spreadsheets.values.append({
            spreadsheetId,
            range: "Sheet1",
            valueInputOption: "USER_ENTERED",
            resource: {
                values: [
                    data,
                ],
            },
        });
        console.log('Cells added.');
        return result;
    } catch (err) {
        // TODO (Developer) - Handle exception
        throw err;
    }
}

module.exports = {
    GoogleSheet: GoogleSheet,
    createGoogleSheet: createGoogleSheet,
    updateValues: updateValues,
}