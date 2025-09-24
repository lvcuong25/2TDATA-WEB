import React, { useState } from 'react';
import { toast } from 'react-toastify';
import axiosInstance from '../../utils/axiosInstance-cookie-only';

const DatabaseExcelActions = ({ 
  databaseId, 
  databaseName,
  onImportSuccess,
  className = ""
}) => {
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [tableName, setTableName] = useState('');
  const [overwrite, setOverwrite] = useState(false);

  // Export database to Excel
  const handleExportDatabase = async () => {
    if (!databaseId) {
      toast.error('Database ID is required for export');
      return;
    }

    try {
      setIsExporting(true);
      const response = await axiosInstance.get(`/database/databases/${databaseId}/export/excel`, {
        responseType: 'blob'
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${databaseName}_export_${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success('Database exported to Excel successfully!');
    } catch (error) {
      console.error('Export error:', error);
      toast.error(error.response?.data?.message || 'Failed to export database');
    } finally {
      setIsExporting(false);
    }
  };


  // Handle file selection
  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
        'text/csv'
      ];
      
      if (!allowedTypes.includes(file.type)) {
        toast.error('Please select a valid Excel file (.xlsx, .xls) or CSV file');
        return;
      }

      // Validate file size (20MB limit)
      if (file.size > 20 * 1024 * 1024) {
        toast.error('File size must be less than 20MB');
        setSelectedFile(null);
        return;
      }

      // Additional validation for very large files that might cause timeout
      if (file.size > 15 * 1024 * 1024) {
        toast.warning('Large file detected. Import may take longer than usual.');
      }

      setSelectedFile(file);
      
      // Auto-generate table name from filename
      const fileName = file.name.replace(/\.[^/.]+$/, ""); // Remove extension
      setTableName(fileName);
    }
  };

  // Import Excel to database (create new table)
  const handleImportExcel = async () => {
    if (!databaseId) {
      toast.error('Database ID is required for import');
      return;
    }

    if (!selectedFile) {
      toast.error('Please select an Excel file to import');
      return;
    }

    if (!tableName.trim()) {
      toast.error('Please enter a table name');
      return;
    }

    try {
      setIsImporting(true);
      const formData = new FormData();
      formData.append('excelFile', selectedFile);
      formData.append('tableName', tableName.trim());
      formData.append('overwrite', overwrite);

      const response = await axiosInstance.post(`/database/databases/${databaseId}/import/excel`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        timeout: 120000 // 2 minutes timeout for large Excel files
      });

      const { data } = response.data;
      
      // Show import results
      if (data.errors && data.errors.length > 0) {
        toast.warning(`Import completed with ${data.errors.length} errors. ${data.importedCount} records imported successfully.`);
        console.log('Import errors:', data.errors);
      } else {
        toast.success(`Successfully created table "${data.tableName}" with ${data.importedCount} records!`);
      }

      // Close modal and reset state
      setShowImportModal(false);
      setSelectedFile(null);
      setTableName('');
      setOverwrite(false);
      
      // Trigger refresh if callback provided
      if (onImportSuccess) {
        onImportSuccess();
      }
    } catch (error) {
      console.error('Import error:', error);
      
      if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        toast.error('Import timeout. File may be too large or server is busy. Please try again with a smaller file.');
      } else if (error.response?.status === 413) {
        toast.error('File too large. Please use a file smaller than 20MB.');
      } else if (error.response?.data?.message) {
        toast.error(`Import failed: ${error.response.data.message}`);
      } else {
        toast.error('Failed to import Excel file. Please check your file and try again.');
      }
    } finally {
      setIsImporting(false);
    }
  };

  // Don't render if no databaseId
  if (!databaseId) {
    return null;
  }

  // Debug log
  console.log('DatabaseExcelActions render - showImportModal:', showImportModal);

  return (
    <>
      <div className={`flex items-center gap-2 ${className}`}>
        {/* Export Database Button */}
        <button
          onClick={handleExportDatabase}
          disabled={isExporting}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Export entire database to Excel"
        >
          {isExporting ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          )}
          Export Database
        </button>

        {/* Import Button */}
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Import button clicked, opening modal...');
            setShowImportModal(true);
          }}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
          title="Import Excel and create new table"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
          </svg>
          Import Excel
        </button>

      </div>

      {/* Import Modal */}
      {showImportModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
          style={{ 
            zIndex: 9999,
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0
          }}
        >
          <div 
            className="bg-white rounded-lg p-6 w-full max-w-md mx-4 shadow-xl"
            style={{ 
              maxHeight: '90vh',
              overflowY: 'auto'
            }}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Import Excel & Create Table</h2>
              <button
                onClick={() => setShowImportModal(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Excel File
              </label>
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileSelect}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              {selectedFile && (
                <p className="mt-2 text-sm text-gray-600">
                  Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              )}
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Table Name *
              </label>
              <input
                type="text"
                value={tableName}
                onChange={(e) => setTableName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Enter table name"
                required
              />
            </div>

            <div className="mb-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={overwrite}
                  onChange={(e) => setOverwrite(e.target.checked)}
                  className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Overwrite if table exists
                </span>
              </label>
            </div>

            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm text-blue-800">
                <strong>How it works:</strong>
              </p>
              <ul className="mt-1 text-xs text-blue-700 list-disc list-inside">
                <li>Creates a new table with the name you specify</li>
                <li>Auto-detects column types from your data</li>
                <li>Imports all data from the Excel file</li>
                <li>Supports .xlsx, .xls, and .csv formats</li>
              </ul>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setShowImportModal(false);
                  setSelectedFile(null);
                  setTableName('');
                  setOverwrite(false);
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                disabled={isImporting}
              >
                Cancel
              </button>
              <button
                onClick={handleImportExcel}
                disabled={!selectedFile || !tableName.trim() || isImporting}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isImporting ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Creating Table...
                  </div>
                ) : (
                  'Create Table & Import'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DatabaseExcelActions;
