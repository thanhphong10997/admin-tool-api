const multer = require('multer');

const excelFilter = (req, file, cb) => {
    if (
        file.mimetype.includes("excel") ||
        file.mimetype.includes("spreadsheetml")
    ) {
        cb(null, true);
    } else {
        cb("Please upload only excel file.", false);
    }
};

var d = new Date();
var day = d.getDay();
var month = d.getMonth();
var year = d.getFullYear();
var time = day + "-" + month + "-" + year;

var storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './test/uploads/');
    },
    filename: (req, file, cb) => {
        console.log(file.originalname);
        cb(null, `${time}-${file.originalname}`);
    },
});

var uploadFile = multer({ storage: storage, fileFilter: excelFilter });
module.exports = uploadFile;