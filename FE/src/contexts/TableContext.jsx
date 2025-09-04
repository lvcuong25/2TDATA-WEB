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
    setSelectAll(checked);
    if (checked && records.length > 0) {
      const allKeys = records.map(record => record._id);
      setSelectedRowKeys(allKeys);
    } else {
      setSelectedRowKeys([]);
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
