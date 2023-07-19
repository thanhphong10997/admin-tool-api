var express = require("express");
var router = express.Router();

var utilsApi = require("../../../app/utilsApi");
var smsApi = require("../../../app/smsApi");
var otpApi = require("../../../app/otpApi");
var addressCmd = require("../../../app/cmd/addressCmd");
var smsCmd = require("../../../app/cmd/smsCmd");
var reportCmd = require("../../../app/cmd/reportCmd");
var googleSheetCmd = require("../../../app/cmd/googleSheetCmd");

var utils = require("../utils/utils");
var upload = require("../utils/upload");
var googleFormCmd = require("../../../app/cmd/googleFormCmd");
var otpCmd = require("../../../app/cmd/otpCmd");

router.post(
	"/api/excel/upload-employees",
	upload.single("file"),
	function (req, res) {
		utilsApi
			.uploadEmployees(req)
			.then(function (rs) {
				res.json(rs);
			})
			.catch(function (reason) {
				res.status(500).json(reason);
			});
	}
);

router.get("/api/excel/download-employees", function (req, res) {
	utilsApi
		.downloadEmployees(req)
		.then(function (rs) {
			res.json(rs);
		})
		.catch(function (reason) {
			res.status(500).json(reason);
		});
});

router.get("/api/excel/download-reports", function (req, res) {
	utilsApi
		.downloadReports(req)
		.then(function (rs) {
			res.json(rs);
		})
		.catch(function (reason) {
			res.status(500).json(reason);
		});
});

router.get("/games/:gameId/download", function (req, res) {
	utilsApi
		.downloadGames(req)
		.then(function (rs) {
			res.json(rs);
		})
		.catch(function (reason) {
			res.status(500).json(reason);
		});
});

router.get("/address", function (req, res) {
	utilsApi
		.getAddress(req)
		.then(function (rs) {
			res.json(rs);
		})
		.catch(function (reason) {
			res.status(500).json(reason);
		});
});

router.get("/address/:addressId", function (req, res) {
	utilsApi
		.getAddressById(req)
		.then(function (rs) {
			res.json(rs);
		})
		.catch(function (reason) {
			res.status(500).json(reason);
		});
});

router.post(
	"/address",
	addressCmd.validate(),
	utils.handleValidation,
	function (req, res) {
		utilsApi
			.createAddress(req)
			.then(function (rs) {
				res.json(rs);
			})
			.catch(function (reason) {
				res.status(500).json(reason);
			});
	}
);

router.put("/address/:addressId", function (req, res) {
	utilsApi
		.updateAddress(req)
		.then(function (rs) {
			res.json(rs);
		})
		.catch(function (reason) {
			res.status(500).json(reason);
		});
});

router.delete("/address/:addressId", function (req, res) {
	utilsApi
		.deleteAddress(req)
		.then(function (rs) {
			res.json(rs);
		})
		.catch(function (reason) {
			res.status(500).json(reason);
		});
});

// SMS route
router.get("/sms", function (req, res) {
	smsApi
		.getSMS(req)
		.then(function (rs) {
			res.json(rs);
		})
		.catch(function (reason) {
			res.status(500).json(reason);
		});
});

router.get("/sms/:smsId", function (req, res) {
	smsApi
		.getSMSById(req)
		.then(function (rs) {
			res.json(rs);
		})
		.catch(function (reason) {
			res.status(500).json(reason);
		});
});

router.post(
	"/sms",
	smsCmd.validate(),
	utils.handleValidation,
	function (req, res) {
		smsApi
			.createSMS(req)
			.then(function (rs) {
				res.json(rs);
			})
			.catch(function (reason) {
				res.status(500).json(reason);
			});
	}
);

router.put("/sms/:smsId", function (req, res) {
	smsApi
		.updateSMS(req)
		.then(function (rs) {
			res.json(rs);
		})
		.catch(function (reason) {
			res.status(500).json(reason);
		});
});

router.delete("/sms/:smsId", function (req, res) {
	smsApi
		.deleteSMS(req)
		.then(function (rs) {
			res.json(rs);
		})
		.catch(function (reason) {
			res.status(500).json(reason);
		});
});

router.get("/reports", function (req, res) {
	utilsApi
		.getReports(req)
		.then(function (rs) {
			res.json(rs);
		})
		.catch(function (reason) {
			res.status(500).json(reason);
		});
});

router.post(
	"/reports",
	reportCmd.validate(),
	utils.handleValidation,
	function (req, res) {
		utilsApi
			.createReport(req)
			.then(function (rs) {
				res.json(rs);
			})
			.catch(function (reason) {
				res.status(500).json(reason);
			});
	}
);

router.put("/reports/:reportId", function (req, res) {
	utilsApi
		.updateReport(req)
		.then(function (rs) {
			res.json(rs);
		})
		.catch(function (reason) {
			res.status(500).json(reason);
		});
});

router.delete("/reports/:reportId", function (req, res) {
	utilsApi
		.deleteReport(req)
		.then(function (rs) {
			res.json(rs);
		})
		.catch(function (reason) {
			res.status(500).json(reason);
		});
});

router.get("/google-sheets", function (req, res) {
	utilsApi
		.getGoogleSheets(req)
		.then(function (rs) {
			res.json(rs);
		})
		.catch(function (reason) {
			res.status(500).json(reason);
		});
});

router.post(
	"/google-sheets",
	googleSheetCmd.validate(),
	utils.handleValidation,
	function (req, res) {
		utilsApi
			.createGoogleSheets(req)
			.then(function (rs) {
				res.json(rs);
			})
			.catch(function (reason) {
				res.status(500).json(reason);
			});
	}
);

router.post(
	"/google-sheets/:googleSheetId/add-data-sheet",
	googleSheetCmd.validateValuesUpdate(),
	utils.handleValidation,
	function (req, res) {
		utilsApi
			.addDataSheet(req)
			.then(function (rs) {
				res.json(rs);
			})
			.catch(function (reason) {
				res.status(500).json(reason);
			});
	}
);

router.put("/google-sheets/:googleSheetId", function (req, res) {
	utilsApi
		.updateGoogleSheets(req)
		.then(function (rs) {
			res.json(rs);
		})
		.catch(function (reason) {
			res.status(500).json(reason);
		});
});

router.delete("/google-sheets/:googleSheetId", function (req, res) {
	utilsApi
		.deleteGoogleSheets(req)
		.then(function (rs) {
			res.json(rs);
		})
		.catch(function (reason) {
			res.status(500).json(reason);
		});
});

router.post(
	"/google-form",
	googleFormCmd.validate(),
	utils.handleValidation,
	function (req, res) {
		utilsApi
			.saveGoogleForm(req)
			.then(function (rs) {
				res.json(rs);
			})
			.catch(function (reason) {
				res.status(500).json(reason);
			});
	}
);

//------------------- OTP ----------------
router.get("/otp", function (req, res) {
	otpApi
		.getOtp(req)
		.then(function (rs) {
			res.json(rs);
		})
		.catch(function (reason) {
			res.status(500).json(reason);
		});
});

router.get("/otp/:otpId", function (req, res) {
	otpApi
		.getOtpById(req)
		.then(function (rs) {
			res.json(rs);
		})
		.catch(function (reason) {
			res.status(500).json(reason);
		});
});

router.post(
	"/otp",
	otpCmd.validate(),
	utils.handleValidation,
	function (req, res) {
		otpApi
			.createOtp(req)
			.then(function (rs) {
				res.json(rs);
			})
			.catch(function (reason) {
				res.status(500).json(reason);
			});
	}
);

router.put("/otp/:otpId", function (req, res) {
	otpApi
		.updateOtp(req)
		.then(function (rs) {
			res.json(rs);
		})
		.catch(function (reason) {
			res.status(500).json(reason);
		});
});

router.delete("/otp/:otpId", function (req, res) {
	otpApi
		.deleteOtp(req)
		.then(function (rs) {
			res.json(rs);
		})
		.catch(function (reason) {
			res.status(500).json(reason);
		});
});

module.exports = router;
