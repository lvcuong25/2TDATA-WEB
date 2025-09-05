# Currency Column Feature Documentation

## Overview
The currency column feature allows users to create columns that store and display monetary values with proper formatting, currency symbols, and localization options.

## Features

### 1. Currency Column Creation
- Add currency as a new data type option when creating columns
- Configure currency settings including:
  - Currency code (USD, EUR, GBP, JPY, VND, etc.)
  - Custom symbol
  - Symbol position (before/after amount)
  - Decimal places (0-4)
  - Thousands separator
  - Decimal separator

### 2. Supported Currencies
The system supports 80+ currencies including:
- **Major currencies**: USD, EUR, GBP, JPY, CNY, CAD, AUD, CHF
- **Asian currencies**: VND, KRW, SGD, HKD, INR, THB, MYR
- **African currencies**: ZAR, EGP, NGN, KES, UGX, TZS
- **Middle Eastern currencies**: AED, SAR, QAR, KWD, ILS
- **And many more...**

### 3. Currency Configuration Options

#### Currency Selection
- Dropdown with 80+ supported currencies
- Each currency shows code, symbol, and full name
- Auto-populates symbol when currency is selected

#### Custom Symbol
- Override default currency symbol
- Supports any Unicode character
- Useful for custom or local symbols

#### Symbol Position
- **Before**: $100.00, €100.00, ¥100
- **After**: 100.00$, 100.00€, 100¥

#### Decimal Places
- Range: 0-4 decimal places
- Default: 2 decimal places
- Examples:
  - 0 places: $1,234 (JPY style)
  - 2 places: $1,234.56 (USD style)
  - 4 places: $1,234.5678 (high precision)

#### Separators
- **Thousands separator**: , (comma), . (period), ' (apostrophe), space
- **Decimal separator**: . (period), , (comma)
- Common combinations:
  - US: 1,234.56
  - European: 1.234,56
  - Swiss: 1'234.56

### 4. Display Features

#### Table Display
- Currency values are formatted according to configuration
- Proper alignment and spacing
- Color-coded with green theme (#52c41a)
- Dollar icon ($) for easy identification

#### Cell Editing
- Number input with step="0.01" for decimal precision
- Real-time validation
- Maintains formatting on save

#### Preview
- Live preview of formatting in configuration panel
- Shows example value (1,234,567.89) with current settings

## Technical Implementation

### Backend Changes

#### Database Schema (Column.js)
```javascript
currencyConfig: {
  type: {
    currency: {
      type: String,
      enum: ['USD', 'EUR', 'GBP', ...], // 80+ currencies
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
}
```

#### API Endpoints
- `POST /api/columns` - Create currency column
- `PUT /api/columns/:id` - Update currency column
- `GET /api/columns/:id` - Get currency column details

### Frontend Changes

#### New Components
- `CurrencyConfig.jsx` - Configuration panel for currency settings
- Currency option in column type selectors
- Currency input handling in table cells

#### Display Logic
```javascript
// Currency formatting function
const formatCurrency = (value, config) => {
  const numValue = parseFloat(value);
  if (isNaN(numValue)) return value;
  
  const formatted = numValue.toLocaleString('en-US', {
    minimumFractionDigits: config.decimalPlaces,
    maximumFractionDigits: config.decimalPlaces
  }).replace(/,/g, config.thousandsSeparator).replace(/\./g, config.decimalSeparator);
  
  return config.position === 'before' ? `${config.symbol}${formatted}` : `${formatted}${config.symbol}`;
};
```

## Usage Examples

### Creating a Currency Column
1. Click "Add Column" in table view
2. Select "Currency" from data type dropdown
3. Configure currency settings:
   - Currency: USD
   - Symbol: $ (auto-filled)
   - Position: Before
   - Decimal places: 2
   - Thousands separator: ,
   - Decimal separator: .
4. Click "Create Column"

### Common Configurations

#### US Dollar (USD)
- Currency: USD
- Symbol: $
- Position: Before
- Decimal places: 2
- Format: $1,234.56

#### Euro (EUR)
- Currency: EUR
- Symbol: €
- Position: After
- Decimal places: 2
- Format: 1.234,56€

#### Japanese Yen (JPY)
- Currency: JPY
- Symbol: ¥
- Position: Before
- Decimal places: 0
- Format: ¥1,235

#### Vietnamese Dong (VND)
- Currency: VND
- Symbol: ₫
- Position: After
- Decimal places: 0
- Format: 1,234,567₫

## Migration Notes

### Existing Data
- Existing number columns can be converted to currency columns
- Data is preserved during conversion
- Formatting is applied immediately after conversion

### Database Migration
- No database migration required
- New `currencyConfig` field is optional
- Existing columns remain unaffected

## Testing

### Test Script
Run the test script to verify functionality:
```bash
node test-currency-feature.js
```

### Manual Testing Checklist
- [ ] Create currency column with default settings
- [ ] Create currency column with custom settings
- [ ] Edit currency column configuration
- [ ] Add/edit currency values in table
- [ ] Verify formatting in table display
- [ ] Test different currency types
- [ ] Test edge cases (zero, negative, large numbers)

## Browser Compatibility
- Modern browsers with ES6+ support
- Unicode support for currency symbols
- Number input type support

## Performance Considerations
- Currency formatting is client-side for better performance
- Configuration is cached in component state
- No additional API calls for formatting

## Future Enhancements
- Exchange rate integration
- Multi-currency support in single column
- Currency conversion formulas
- Historical exchange rates
- Regional formatting presets
