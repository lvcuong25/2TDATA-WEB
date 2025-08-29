# Fields Feature Documentation

## Tổng quan

Chức năng Fields cho phép người dùng quản lý việc hiển thị/ẩn các cột trong bảng dữ liệu, tương tự như trong ảnh mẫu. Tính năng này bao gồm:

- **Search fields**: Tìm kiếm các trường theo tên
- **Toggle visibility**: Bật/tắt hiển thị từng trường
- **System fields**: Quản lý các trường hệ thống
- **New Field**: Thêm trường mới

## Frontend Implementation

### State Management

```javascript
// Fields management state
const [showFieldsDropdown, setShowFieldsDropdown] = useState(false);
const [fieldsDropdownPosition, setFieldsDropdownPosition] = useState({ x: 0, y: 0 });
const [fieldSearch, setFieldSearch] = useState('');
const [fieldVisibility, setFieldVisibility] = useState(() => {
  // Load saved field visibility from localStorage
  const saved = localStorage.getItem(`table_${tableId}_field_visibility`);
  return saved ? JSON.parse(saved) : {};
});
const [showSystemFields, setShowSystemFields] = useState(false);
```

### API Integration

```javascript
// Fetch field preferences from backend
const { data: fieldPreferenceResponse } = useQuery({
  queryKey: ['fieldPreference', tableId],
  queryFn: async () => {
    const response = await axiosInstance.get(`/database/tables/${tableId}/field-preference`);
    return response.data;
  },
  enabled: !!tableId,
});

// Save field preference mutation
const saveFieldPreferenceMutation = useMutation({
  mutationFn: async ({ fieldVisibility, showSystemFields }) => {
    const response = await axiosInstance.post(`/database/tables/${tableId}/field-preference`, {
      fieldVisibility,
      showSystemFields
    });
    return response.data;
  },
  onSuccess: () => {
    console.log('Field preference saved successfully');
  },
  onError: (error) => {
    console.error('Error saving field preference:', error);
  },
});
```

### Key Functions

#### Toggle Field Visibility
```javascript
const toggleFieldVisibility = (columnId) => {
  const newVisibility = {
    ...fieldVisibility,
    [columnId]: !fieldVisibility[columnId]
  };
  saveFieldVisibility(newVisibility);
};
```

#### Get Visible Columns
```javascript
const visibleColumns = useMemo(() => {
  return columns.filter(column => {
    // Always show if no visibility setting exists (default visible)
    if (fieldVisibility[column._id] === undefined) {
      return true;
    }
    return fieldVisibility[column._id];
  });
}, [columns, fieldVisibility]);
```

### UI Components

#### Fields Button
- Hiển thị trạng thái active khi có field bị ẩn
- Màu xanh khi có cài đặt visibility
- Dropdown với danh sách fields

#### Fields Dropdown
- **Header**: Tiêu đề "Fields" với icon
- **Search Bar**: Tìm kiếm fields theo tên
- **Field List**: Danh sách fields với:
  - Drag handle (⋮⋮)
  - Field type icon (T, N, D, B)
  - Field name
  - Visibility toggle checkbox
- **Bottom Actions**:
  - "System fields" button
  - "+ New Field" button

## Backend Implementation

### Model: FieldPreference

```javascript
const fieldPreferenceSchema = new mongoose.Schema({
  tableId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Table',
    required: true,
    index: true
  },
  fieldVisibility: {
    type: Map,
    of: Boolean,
    default: new Map()
  },
  showSystemFields: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});
```

### Controller: fieldPreferenceController

#### GET /tables/:tableId/field-preference
- Lấy field preferences cho table
- Tạo default preference nếu chưa có

#### POST /tables/:tableId/field-preference
- Lưu field preferences
- Cập nhật hoặc tạo mới preference

#### DELETE /tables/:tableId/field-preference
- Xóa field preferences

### Routes

```javascript
// Field preference routes
router.get("/tables/:tableId/field-preference", getFieldPreference);
router.post("/tables/:tableId/field-preference", saveFieldPreference);
router.delete("/tables/:tableId/field-preference", deleteFieldPreference);
```

## Database Schema

### FieldPreference Collection

```javascript
{
  _id: ObjectId,
  tableId: ObjectId, // Reference to Table
  fieldVisibility: {
    "columnId1": true,
    "columnId2": false,
    "columnId3": true
  },
  showSystemFields: false,
  createdAt: Date,
  updatedAt: Date
}
```

## Features

### 1. Field Visibility Toggle
- Mỗi field có checkbox để bật/tắt hiển thị
- Trạng thái được lưu vào localStorage và backend
- Default: tất cả fields đều visible

### 2. Field Search
- Tìm kiếm real-time theo tên field
- Case-insensitive search
- Filter danh sách fields trong dropdown

### 3. System Fields
- Toggle để hiển thị/ẩn system fields
- System fields có thể bao gồm: _id, createdAt, updatedAt, etc.

### 4. New Field
- Button để thêm field mới
- Mở modal "Add Column" hiện có

### 5. Drag & Drop (UI Only)
- Drag handle hiển thị cho mỗi field
- Chuẩn bị cho tính năng reorder fields trong tương lai

## Usage

### Cách sử dụng

1. **Mở Fields Dropdown**: Click vào button "Fields" trên toolbar
2. **Tìm kiếm Fields**: Nhập tên field vào search box
3. **Toggle Visibility**: Click checkbox bên cạnh field để ẩn/hiện
4. **System Fields**: Click "System fields" để quản lý system fields
5. **Thêm Field**: Click "+ New Field" để thêm field mới

### Visual Indicators

- **Fields Button**: Màu xanh khi có field bị ẩn
- **Field List**: Checkbox checked = visible, unchecked = hidden
- **Search**: Highlight kết quả tìm kiếm
- **Type Icons**: T (text), N (number), D (date), B (boolean)

## Testing

### Test File: test-fields-feature.js

```bash
node test-fields-feature.js
```

Tests bao gồm:
- Backend API testing
- Frontend functionality simulation
- Field visibility logic
- Search functionality

## Future Enhancements

1. **Field Reordering**: Drag & drop để sắp xếp lại thứ tự fields
2. **Field Groups**: Nhóm các fields liên quan
3. **Field Templates**: Lưu và áp dụng cấu hình fields
4. **Bulk Operations**: Ẩn/hiện nhiều fields cùng lúc
5. **Field Permissions**: Phân quyền hiển thị fields theo role

## Troubleshooting

### Common Issues

1. **Fields không lưu**: Kiểm tra backend API và database connection
2. **Dropdown không đóng**: Kiểm tra click outside handler
3. **Search không hoạt động**: Kiểm tra fieldSearch state và filter logic
4. **Visibility không cập nhật**: Kiểm tra visibleColumns memoization

### Debug Tips

```javascript
// Debug field visibility
console.log('Field visibility:', fieldVisibility);
console.log('Visible columns:', visibleColumns);
console.log('All columns:', columns);

// Debug API calls
console.log('Field preference response:', fieldPreferenceResponse);
```

## Performance Considerations

1. **Memoization**: visibleColumns được memoized để tránh re-render không cần thiết
2. **Local Storage**: Lưu preferences locally để tăng tốc độ load
3. **Debounced Search**: Có thể thêm debounce cho search input
4. **Virtual Scrolling**: Cho danh sách fields dài

## Security

1. **Input Validation**: Validate tableId và fieldVisibility data
2. **Authorization**: Kiểm tra quyền truy cập table
3. **Data Sanitization**: Sanitize field names và search input
4. **Rate Limiting**: Giới hạn số lần gọi API
