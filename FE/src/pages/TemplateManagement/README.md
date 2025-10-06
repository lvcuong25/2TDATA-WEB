# Template Management với Database Management UI

## Tổng quan

Đã copy toàn bộ giao diện từ DatabaseManagement sang TemplateManagement để có giao diện table giống hệt như trong hình CRM_Lead.

## Cấu trúc thư mục

```
FE/src/pages/TemplateManagement/
├── Components/          # Copy từ DatabaseManagement
│   ├── AddColumnModal.jsx
│   ├── EditColumnModal.jsx
│   ├── TableHeader.jsx
│   ├── TableBody.jsx
│   ├── ContextMenu.jsx
│   ├── RowHeightDropdown.jsx
│   ├── LinkedTableSelectModal.jsx
│   ├── LookupDropdown.jsx
│   ├── ProgressBar.jsx
│   ├── RecordLinkModal.jsx
│   ├── SimpleLinkedTableDropdown.jsx
│   ├── DraggableColumnHeader.jsx
│   ├── LinkedTableDropdown.jsx
│   ├── LinkedTableTabs.jsx
│   ├── ConditionalFormatting/
│   └── CRMTable.css      # CSS styling cho giao diện CRM
├── Utils/               # Copy từ DatabaseManagement
│   ├── cellUtils.jsx
│   ├── columnOrderUtils.jsx
│   ├── columnUtils.jsx
│   ├── dataTypeUtils.jsx
│   ├── fieldVisibilityUtils.jsx
│   ├── filterUtils.jsx
│   ├── groupUtils.jsx
│   ├── permissionUtils.jsx
│   ├── rowHeightUtils.jsx
│   └── tableDetailSortUtils.jsx
├── Hooks/               # Copy từ DatabaseManagement
│   ├── useTableData.jsx
│   └── useTemplateTableData.jsx  # Hook tùy chỉnh cho Template
├── Modals/              # Copy từ DatabaseManagement
│   └── EditRecordModal.jsx
├── Config/              # Copy từ DatabaseManagement
│   └── ...
├── TableDetail.jsx      # Component chính với giao diện DatabaseManagement
├── TemplateDetail.jsx
├── TemplateList.jsx
└── README.md
```

## Tính năng đã copy

### ✅ **Giao diện hoàn chỉnh:**
- **Table Header**: Với navigation, search, và action buttons
- **Table Control Bar**: Fields, Filter, Group, Sort buttons
- **Data Table**: Hiển thị columns với styling giống CRM
- **Modals**: Add/Edit column modals
- **Context Menu**: Right-click menu
- **Responsive Design**: Tương thích mọi thiết bị

### ✅ **Tính năng:**
- **Column Management**: Add, Edit, Delete columns
- **Data Types**: Text, Number, Date, Email, URL, Phone, Currency, Percent, etc.
- **Sorting**: Multi-column sorting
- **Filtering**: Advanced filtering options
- **Grouping**: Group by columns
- **Field Visibility**: Show/hide columns
- **Row Height**: Adjustable row height
- **Column Resizing**: Drag to resize columns
- **Column Reordering**: Drag to reorder columns

### ✅ **Styling:**
- **CRM Table CSS**: Styling giống hệt giao diện CRM_Lead
- **Ant Design**: Sử dụng Ant Design components
- **Custom CSS**: Styling tùy chỉnh cho table
- **Responsive**: Mobile-friendly design

## Cách sử dụng

### 1. **Truy cập Template Table:**
```
/templates/{templateId}/tables/{tableIndex}
```

### 2. **Thêm Column:**
- Click "Add Column" button
- Điền thông tin column
- Chọn data type
- Set properties (Required, Unique)

### 3. **Edit Column:**
- Click edit icon trên column
- Cập nhật thông tin
- Save changes

### 4. **Delete Column:**
- Click delete icon trên column
- Confirm deletion

### 5. **Table Controls:**
- **Fields**: Show/hide columns
- **Filter**: Filter data
- **Group**: Group by columns
- **Sort**: Sort data

## API Endpoints

### Template API:
- `GET /templates/{templateId}` - Get template details
- `PUT /templates/admin/{templateId}` - Update template
- `POST /templates/{templateId}/tables/{tableIndex}/columns` - Add column
- `PUT /templates/{templateId}/tables/{tableIndex}/columns/{columnIndex}` - Update column
- `DELETE /templates/{templateId}/tables/{tableIndex}/columns/{columnIndex}` - Delete column

## Lưu ý

### **Khác biệt với Database Management:**
- **Không có Records**: Templates chỉ có structure, không có data
- **Simplified Permissions**: Templates có permissions đơn giản hơn
- **Mock Mutations**: Một số mutations được mock vì không cần thiết
- **Template-specific API**: Sử dụng template API thay vì database API

### **Tương thích:**
- **100% UI Compatible**: Giao diện giống hệt DatabaseManagement
- **Component Reuse**: Tái sử dụng toàn bộ components
- **Utility Functions**: Sử dụng chung utility functions
- **Styling**: CSS styling tương thích

## Troubleshooting

### **Lỗi thường gặp:**

1. **Import Error**: Đảm bảo tất cả files đã được copy
2. **API Error**: Kiểm tra template API endpoints
3. **Permission Error**: Templates có permissions đơn giản hơn
4. **Styling Issue**: Kiểm tra CSS import

### **Debug:**
- Kiểm tra console logs
- Sử dụng React DevTools
- Kiểm tra network requests
- Verify API responses

## Kết luận

Template Management giờ đây có giao diện giống hệt Database Management với đầy đủ tính năng table management, phù hợp cho việc quản lý template structure.