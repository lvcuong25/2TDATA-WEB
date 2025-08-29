# Filter Feature Documentation

## Overview

The filter functionality has been implemented for the TableDetail component, allowing users to filter table records based on various criteria. This feature includes both backend and frontend components with persistent filter preferences.

## Backend Implementation

### 1. FilterPreference Model (`BE/src/model/FilterPreference.js`)

The FilterPreference model stores filter rules for each table per user per site:

```javascript
const filterRuleSchema = new mongoose.Schema({
  field: { type: String, required: true },
  operator: { 
    type: String, 
    required: true,
    enum: [
      'equals', 'not_equals', 'contains', 'not_contains',
      'starts_with', 'ends_with', 'greater_than', 'less_than',
      'greater_than_or_equal', 'less_than_or_equal',
      'is_empty', 'is_not_empty', 'is_null', 'is_not_null'
    ]
  },
  value: { type: mongoose.Schema.Types.Mixed, required: true }
}, { _id: false });

const filterPreferenceSchema = new mongoose.Schema({
  tableId: { type: mongoose.Schema.Types.ObjectId, ref: 'Table', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  siteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Site', required: true },
  filterRules: { type: [filterRuleSchema], default: [] },
  isActive: { type: Boolean, default: false }
}, { timestamps: true });
```

### 2. Filter Controller (`BE/src/controllers/filterController.js`)

The filter controller provides the following endpoints:

- `GET /tables/:tableId/filter-preference` - Get filter preferences for a table
- `POST /tables/:tableId/filter-preference` - Save filter preferences
- `DELETE /tables/:tableId/filter-preference` - Delete filter preferences
- `GET /filter-preferences` - Get all filter preferences for a user

### 3. Enhanced Record Controller

The `getRecords` function in `recordController.js` has been enhanced to support filtering:

- Accepts `filterRules` parameter in query string
- Automatically loads saved filter preferences if no rules provided
- Builds MongoDB queries based on filter rules
- Supports all filter operators for different data types

## Frontend Implementation

### 1. State Management

The TableDetail component includes new state variables for filtering:

```javascript
// Filtering state
const [filterRules, setFilterRules] = useState([]);
const [currentFilterField, setCurrentFilterField] = useState('');
const [currentFilterOperator, setCurrentFilterOperator] = useState('equals');
const [currentFilterValue, setCurrentFilterValue] = useState('');
const [showFilterDropdown, setShowFilterDropdown] = useState(false);
const [filterDropdownPosition, setFilterDropdownPosition] = useState({ x: 0, y: 0 });
const [filterFieldSearch, setFilterFieldSearch] = useState('');
const [isFilterActive, setIsFilterActive] = useState(false);
```

### 2. API Integration

- Fetches filter preferences from backend on component mount
- Saves filter preferences to backend when rules change
- Includes filter rules in record queries
- Automatically refreshes data when filters change

### 3. UI Components

#### Filter Button
- Located in the toolbar next to Group and Sort buttons
- Shows active state with blue styling when filters are applied
- Displays count badge for number of active filter rules

#### Filter Dropdown
- Comprehensive dropdown interface for managing filter rules
- Field selection with search functionality
- Operator selection based on data type
- Value input with appropriate input types (text, number, date, boolean)
- Active/inactive toggle
- Add/remove filter rules

#### Visual Indicators
- Filtered columns show blue border and background
- "F" indicator in column headers for filtered fields
- Filter button shows count badge

## Filter Operators

### Text Fields
- `equals` - Exact match
- `not_equals` - Not exact match
- `contains` - Contains substring (case-insensitive)
- `not_contains` - Does not contain substring
- `starts_with` - Starts with substring
- `ends_with` - Ends with substring
- `is_empty` - Field is empty or null
- `is_not_empty` - Field has value

### Number Fields
- `equals` - Exact match
- `not_equals` - Not exact match
- `greater_than` - Greater than value
- `less_than` - Less than value
- `greater_than_or_equal` - Greater than or equal to value
- `less_than_or_equal` - Less than or equal to value
- `is_empty` - Field is empty or null
- `is_not_empty` - Field has value

### Date Fields
- `equals` - Exact date match
- `not_equals` - Not exact date match
- `greater_than` - After date
- `less_than` - Before date
- `greater_than_or_equal` - On or after date
- `less_than_or_equal` - On or before date
- `is_empty` - Field is empty or null
- `is_not_empty` - Field has value

### Boolean Fields
- `equals` - Exact match (true/false)
- `not_equals` - Not exact match
- `is_empty` - Field is empty or null
- `is_not_empty` - Field has value

## Usage Examples

### 1. Basic Text Filter
```javascript
// Filter records where name contains "john"
{
  field: "name",
  operator: "contains",
  value: "john"
}
```

### 2. Number Range Filter
```javascript
// Filter records where age is between 25 and 50
[
  { field: "age", operator: "greater_than_or_equal", value: 25 },
  { field: "age", operator: "less_than_or_equal", value: 50 }
]
```

### 3. Date Filter
```javascript
// Filter records created after 2024-01-01
{
  field: "created_date",
  operator: "greater_than",
  value: "2024-01-01"
}
```

### 4. Boolean Filter
```javascript
// Filter records where is_active is true
{
  field: "is_active",
  operator: "equals",
  value: "true"
}
```

## API Endpoints

### Get Filter Preferences
```http
GET /database/tables/:tableId/filter-preference
```

Response:
```json
{
  "success": true,
  "data": {
    "tableId": "table_id",
    "userId": "user_id",
    "siteId": "site_id",
    "filterRules": [
      {
        "field": "name",
        "operator": "contains",
        "value": "john"
      }
    ],
    "isActive": true
  }
}
```

### Save Filter Preferences
```http
POST /database/tables/:tableId/filter-preference
Content-Type: application/json

{
  "filterRules": [
    {
      "field": "name",
      "operator": "contains",
      "value": "john"
    }
  ],
  "isActive": true
}
```

### Get Records with Filters
```http
GET /database/tables/:tableId/records?filterRules=[{"field":"name","operator":"contains","value":"john"}]
```

## Features

### 1. Persistent Filter Preferences
- Filter rules are saved per table per user per site
- Preferences persist across browser sessions
- Automatic loading of saved filters

### 2. Real-time Filtering
- Filters are applied immediately when rules change
- No need to manually refresh data
- Optimized queries with proper indexing

### 3. Multiple Filter Rules
- Support for multiple filter rules per table
- All rules are combined with AND logic
- Individual rules can be added/removed independently

### 4. Data Type Awareness
- Different operators available based on column data type
- Appropriate input controls for each data type
- Validation of filter values

### 5. Visual Feedback
- Clear indication of active filters
- Filter count badges
- Column highlighting for filtered fields

## Technical Details

### Query Building
The backend builds MongoDB queries dynamically based on filter rules:

```javascript
let filterQuery = { tableId };
const filterConditions = [];

for (const rule of filterRules) {
  const fieldPath = `data.${rule.field}`;
  let condition = {};
  
  switch (rule.operator) {
    case 'contains':
      condition[fieldPath] = { $regex: rule.value, $options: 'i' };
      break;
    case 'greater_than':
      condition[fieldPath] = { $gt: rule.value };
      break;
    // ... other operators
  }
  
  filterConditions.push(condition);
}

if (filterConditions.length > 0) {
  filterQuery.$and = filterConditions;
}
```

### Performance Considerations
- Filter queries use proper MongoDB operators
- Indexes should be created on frequently filtered fields
- Query optimization for complex filter combinations
- Efficient handling of empty/null values

## Future Enhancements

### 1. Advanced Filtering
- OR logic between filter rules
- Nested filter conditions
- Custom filter expressions

### 2. Filter Templates
- Save and reuse filter configurations
- Share filters between users
- Filter presets for common use cases

### 3. Filter Analytics
- Track most used filters
- Filter performance metrics
- Filter usage statistics

### 4. Export Filtered Data
- Export filtered records to CSV/Excel
- Filter-aware data export
- Bulk operations on filtered data

## Testing

The filter functionality has been tested with:
- Various data types (text, number, date, boolean)
- Multiple filter rules
- Edge cases (empty values, null values)
- Performance with large datasets
- UI interactions and state management

## Conclusion

The filter feature provides a comprehensive and user-friendly way to filter table data with persistent preferences, real-time updates, and visual feedback. The implementation follows best practices for both backend and frontend development, ensuring scalability and maintainability.
