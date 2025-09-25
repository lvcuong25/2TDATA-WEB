import React, { createContext, useContext, useState } from 'react';

const TableContext = createContext();

export const useTableContext = () => {
  const context = useContext(TableContext);
  if (!context) {
    throw new Error('useTableContext must be used within a TableProvider');
  }
  return context;
};

export const TableProvider = ({ children }) => {
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [selectAll, setSelectAll] = useState(false);

  const handleSelectAll = (checked, records = []) => {
    // Toggle logic: nếu đã chọn tất cả thì bỏ chọn, ngược lại chọn tất cả
    const allKeys = records.map(record => record._id);
    const isAllSelected = selectedRowKeys.length === records.length && records.length > 0;
    
    if (isAllSelected) {
      // Đã chọn tất cả → bỏ chọn tất cả
      setSelectAll(false);
      setSelectedRowKeys([]);
      console.log('🔄 Deselected all rows');
    } else {
      // Chưa chọn tất cả → chọn tất cả
      setSelectAll(true);
      setSelectedRowKeys(allKeys);
      console.log('🔄 Selected all rows:', allKeys.length);
    }
  };

  const handleSelectRow = (recordId, checked) => {
    if (checked) {
      setSelectedRowKeys(prev => [...prev, recordId]);
    } else {
      setSelectedRowKeys(prev => prev.filter(key => key !== recordId));
      setSelectAll(false);
    }
  };

  const setAllRecords = (records) => {
    if (selectAll && records) {
      const allKeys = records.map(record => record._id);
      setSelectedRowKeys(allKeys);
    }
  };

  const value = {
    selectedRowKeys,
    setSelectedRowKeys,
    selectAll,
    setSelectAll,
    handleSelectAll,
    handleSelectRow,
    setAllRecords
  };

  return (
    <TableContext.Provider value={value}>
      {children}
    </TableContext.Provider>
  );
};
