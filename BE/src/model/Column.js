import mongoose from "mongoose";

const columnSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  tableId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Table',
    required: true
  },
  databaseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Database',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  siteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Site',
    required: true
  },
  dataType: {
    type: String,
    required: true,
    enum: ['string', 'number', 'date', 'year', 'text', 'email', 'url', 'json', 'checkbox', 'single_select', 'multi_select', 'formula', 'currency']
  },
  isRequired: {
    type: Boolean,
    default: false
  },
  isUnique: {
    type: Boolean,
    default: false
  },
  defaultValue: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  checkboxConfig: {
    type: {
      icon: {
        type: String,
        enum: ['check-circle', 'border'],
        default: 'check-circle'
      },
      color: {
        type: String,
        default: '#52c41a'
      },
      defaultValue: {
        type: Boolean,
        default: false
      }
    },
    default: undefined
  },
  singleSelectConfig: {
    type: {
      options: {
        type: [String],
        default: []
      },
      defaultValue: {
        type: String,
        default: ''
      }
    },
    default: undefined
  },
  multiSelectConfig: {
    type: {
      options: {
        type: [String],
        default: []
      },
      defaultValue: {
        type: [String],
        default: []
      }
    },
    default: undefined
  },
  formulaConfig: {
    type: {
      formula: {
        type: String,
        required: true,
        trim: true
      },
      resultType: {
        type: String,
        enum: ['number', 'text', 'date', 'boolean'],
        default: 'number'
      },
      dependencies: {
        type: [String],
        default: []
      },
      description: {
        type: String,
        default: ''
      }
    },
    default: undefined
  },
  dateConfig: {
    type: {
      format: {
        type: String,
        enum: ['YYYY-MM-DD', 'YYYY/MM/DD', 'DD-MM-YYYY', 'MM-DD-YYYY', 'DD/MM/YYYY', 'MM/DD/YYYY', 'DD MM YYYY'],
        default: 'YYYY-MM-DD'
      }
    },
    default: undefined
  },
  currencyConfig: {
    type: {
      currency: {
        type: String,
        enum: ['USD', 'EUR', 'GBP', 'JPY', 'CNY', 'VND', 'CAD', 'AUD', 'CHF', 'SEK', 'NOK', 'DKK', 'PLN', 'CZK', 'HUF', 'RUB', 'BRL', 'INR', 'KRW', 'SGD', 'HKD', 'NZD', 'MXN', 'ZAR', 'TRY', 'ILS', 'AED', 'SAR', 'QAR', 'KWD', 'BHD', 'OMR', 'JOD', 'LBP', 'EGP', 'MAD', 'TND', 'DZD', 'LYD', 'SDG', 'ETB', 'KES', 'UGX', 'TZS', 'MWK', 'ZMW', 'BWP', 'SZL', 'LSL', 'NAD', 'AOA', 'MZN', 'XOF', 'XAF', 'CDF', 'RWF', 'BIF', 'KMF', 'DJF', 'SOS', 'ERN', 'STN', 'CVE', 'GMD', 'GNF', 'LRD', 'SLL', 'NGN', 'GHS', 'XPF', 'TOP', 'WST', 'FJD', 'VUV', 'SBD', 'PGK', 'KID', 'TVD', 'XDR'],
        default: 'USD'
      },
      symbol: {
        type: String,
        default: '$'
      },
      position: {
        type: String,
        enum: ['before', 'after'],
        default: 'before'
      },
      decimalPlaces: {
        type: Number,
        min: 0,
        max: 4,
        default: 2
      },
      thousandsSeparator: {
        type: String,
        default: ','
      },
      decimalSeparator: {
        type: String,
        default: '.'
      }
    },
    default: undefined
  },
  urlConfig: {
    type: {
      protocol: {
        type: String,
        enum: ['https', 'http', 'none'],
        default: 'https'
      }
    },
    default: undefined
  },
  order: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound index to ensure unique column names per table
columnSchema.index({ name: 1, tableId: 1 }, { unique: true });

// Pre-save middleware to update the updatedAt field
columnSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const Column = mongoose.model('Column', columnSchema);

export default Column;
