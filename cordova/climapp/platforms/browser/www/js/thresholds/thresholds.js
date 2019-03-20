
var thresholds = {
	// Values based only on model calculations
	default: {
		wbgt: {
			"RAL": 0
		},
		phs: {
			"sweat_threshold": 0,
			"dlim_threshold": 0

		},
		ireq: {
			"dlim_threshold": 0,
			"icl_threshold": 0
		}
	},

	// Values updated based on user feedback
	personal: {
		wbgt: {
			"RAL": 0
		},
		phs: {
			"sweat_threshold": 0,
			"dlim_threshold": 0

		},
		ireq: {
			"dlim_threshold": 0,
			"icl_threshold": 0
		}
	},
	// User's deviation from model
	delta: []
}