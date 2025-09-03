import React, { useState, useEffect } from 'react';
import { Input, Typography, Select, Card, Tooltip, Popover } from 'antd';
import { FunctionOutlined, CloseOutlined } from '@ant-design/icons';

const { Text, Title } = Typography;
const { TextArea } = Input;

const FormulaConfig = ({ 
  formulaConfig, 
  onFormulaConfigChange, 
  availableColumns = []
}) => {
  const [formula, setFormula] = useState(formulaConfig?.formula || '');
  const [activeTab, setActiveTab] = useState('formula');
  const [openTooltip, setOpenTooltip] = useState(null);

  // Update parent component when config changes
  useEffect(() => {
    const config = {
      formula,
      resultType: 'number', // Default to number
      dependencies: [],
      description: ''
    };
    
    onFormulaConfigChange(config);
  }, [formula]);

  const functions = [
    { name: 'AVG', description: 'Average of input parameters', syntax: 'AVG(value1, [value2, ...])', examples: ['AVG(10, 5) ➔ 7.5', 'AVG({column1}, {column2})', 'AVG({column1}, {column2}, {column3})'] },
    { name: 'ADD', description: 'Sum of input parameters', syntax: 'ADD(value1, [value2, ...])', examples: ['ADD(10, 5) ➔ 15', 'ADD({column1}, {column2})', 'ADD({column1}, {column2}, {column3})'] },
    { name: 'DATEADD', description: 'Add days to a date', syntax: 'DATEADD(date, days)', examples: ['DATEADD({date}, 7) ➔ date + 7 days', 'DATEADD({startDate}, 30) ➔ startDate + 30 days'] },
    { name: 'DATESTR', description: 'Convert date to string', syntax: 'DATESTR(date, format)', examples: ['DATESTR({date}, "YYYY-MM-DD")', 'DATESTR({date}, "DD/MM/YYYY")'] },
    { name: 'DAY', description: 'Extract day from date', syntax: 'DAY(date)', examples: ['DAY({date}) ➔ 15', 'DAY({birthDate}) ➔ 25'] },
    { name: 'MONTH', description: 'Extract month from date', syntax: 'MONTH(date)', examples: ['MONTH({date}) ➔ 3', 'MONTH({birthDate}) ➔ 12'] },
    { name: 'YEAR', description: 'Extract year from date', syntax: 'YEAR(date)', examples: ['YEAR({date}) ➔ 2024', 'YEAR({birthDate}) ➔ 1990'] },
    { name: 'SUM', description: 'Sum of input parameters', syntax: 'SUM(value1, [value2, ...])', examples: ['SUM(10, 5, 3) ➔ 18', 'SUM({column1}, {column2})', 'SUM({jan}, {feb}, {mar})'] },
    { name: 'MIN', description: 'Minimum of input parameters', syntax: 'MIN(value1, [value2, ...])', examples: ['MIN(10, 5, 3) ➔ 3', 'MIN({column1}, {column2})', 'MIN({price1}, {price2}, {price3})'] },
    { name: 'MAX', description: 'Maximum of input parameters', syntax: 'MAX(value1, [value2, ...])', examples: ['MAX(10, 5, 3) ➔ 10', 'MAX({column1}, {column2})', 'MAX({score1}, {score2}, {score3})'] },
    { name: 'COUNT', description: 'Count non-empty values', syntax: 'COUNT(value1, [value2, ...])', examples: ['COUNT({column1}, {column2})', 'COUNT({jan}, {feb}, {mar})'] },
    { name: 'IF', description: 'Conditional value', syntax: 'IF(condition, trueValue, falseValue)', examples: ['IF({status} == "active", "Yes", "No")', 'IF({age} >= 18, "Adult", "Minor")'] },
    { name: 'CONCAT', description: 'Concatenate strings', syntax: 'CONCAT(value1, [value2, ...])', examples: ['CONCAT({firstName}, " ", {lastName})', 'CONCAT({city}, ", ", {country})'] },
    { name: 'UPPER', description: 'Convert to uppercase', syntax: 'UPPER(text)', examples: ['UPPER({status})', 'UPPER({name})'] },
    { name: 'LOWER', description: 'Convert to lowercase', syntax: 'LOWER(text)', examples: ['LOWER({email})', 'LOWER({status})'] },
    { name: 'LEN', description: 'String length', syntax: 'LEN(text)', examples: ['LEN({description})', 'LEN({name})'] },
    { name: 'ROUND', description: 'Round number', syntax: 'ROUND(number, decimals)', examples: ['ROUND({price}, 2)', 'ROUND({score}, 0)'] },
    { name: 'ABS', description: 'Absolute value', syntax: 'ABS(number)', examples: ['ABS({value})', 'ABS({difference})'] }
  ];

  const addFunction = (funcName) => {
    const newFormula = formula + `${funcName}()`;
    setFormula(newFormula);
  };

  const addColumnReference = (columnName) => {
    const columnRef = `{${columnName}}`;
    
    // Look for the pattern: FUNCTION(){existing_columns}
    const functionWithTrailingColumnsPattern = /(SUM|AVG|ADD|MIN|MAX|COUNT)\(\)(\{[^}]+\})+$/;
    const trailingMatch = formula.match(functionWithTrailingColumnsPattern);
    
    if (trailingMatch) {
      // Case: SUM(){col1}{col2} -> need to move everything inside parentheses
      const funcName = trailingMatch[1];
      const allTrailingColumns = formula.substring(formula.indexOf(funcName) + funcName.length + 2); // Skip "FUNC()"
      
      // Extract all column references
      const columnMatches = allTrailingColumns.match(/\{[^}]+\}/g) || [];
      
      // Build parameters list with new column
      const allColumns = [...columnMatches, columnRef];
      const params = allColumns.join(', ');
      
      // Reconstruct formula
      const beforeFunction = formula.substring(0, formula.indexOf(funcName));
      const newFormula = beforeFunction + `${funcName}(${params})`;
      setFormula(newFormula);
      return;
    }
    
    // Look for empty function: FUNCTION()
    const emptyFunctionPattern = /(SUM|AVG|ADD|MIN|MAX|COUNT)\(\)$/;
    if (formula.match(emptyFunctionPattern)) {
      const newFormula = formula.replace(emptyFunctionPattern, `$1(${columnRef})`);
      setFormula(newFormula);
      return;
    }
    
    // Look for function with existing parameters: FUNCTION(params)
    const functionWithParamsPattern = /(SUM|AVG|ADD|MIN|MAX|COUNT)\(([^)]*)\)$/;
    const funcMatch = formula.match(functionWithParamsPattern);
    if (funcMatch) {
      const funcName = funcMatch[1];
      const currentParams = funcMatch[2].trim();
      const newParams = currentParams ? `${currentParams}, ${columnRef}` : columnRef;
      const newFormula = formula.replace(functionWithParamsPattern, `${funcName}(${newParams})`);
      setFormula(newFormula);
      return;
    }
    
    // Default: add at the end
    setFormula(formula + columnRef);
  };

  const renderFunctionTooltip = (func) => (
    <div style={{ 
      maxWidth: '320px', 
      backgroundColor: 'white',
      border: '1px solid #d9d9d9',
      borderRadius: '8px',
      padding: '16px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
    }}>
      {/* Header with close button */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '12px'
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px',
          fontSize: '16px',
          fontWeight: 'bold',
          color: '#1890ff'
        }}>
          <span style={{ fontSize: '20px' }}>Σ</span>
          <span>{func.name}()</span>
        </div>
        <CloseOutlined 
          style={{ 
            cursor: 'pointer', 
            color: '#999',
            fontSize: '14px'
          }} 
          onClick={() => setOpenTooltip(null)}
        />
      </div>

      {/* Description */}
      <div style={{ 
        marginBottom: '12px', 
        color: '#333',
        fontSize: '14px'
      }}>
        {func.description}
      </div>

      {/* Syntax */}
      <div style={{ marginBottom: '12px' }}>
        <Text strong style={{ color: '#333', fontSize: '13px' }}>SYNTAX:</Text>
        <div style={{ 
          backgroundColor: '#f5f5f5', 
          padding: '8px 12px', 
          borderRadius: '6px',
          fontFamily: 'monospace',
          fontSize: '13px',
          color: '#333',
          marginTop: '6px',
          border: '1px solid #e8e8e8'
        }}>
          {func.syntax}
        </div>
      </div>

      {/* Examples */}
      <div style={{ marginBottom: '12px' }}>
        <Text strong style={{ color: '#333', fontSize: '13px' }}>EXAMPLES:</Text>
        {func.examples.map((example, idx) => (
          <div key={idx} style={{ 
            fontFamily: 'monospace', 
            fontSize: '12px',
            marginTop: '6px',
            color: '#666',
            padding: '4px 0'
          }}>
            {example}
          </div>
        ))}
      </div>


    </div>
  );

  return (
    <div style={{ padding: '16px', backgroundColor: '#fafafa', borderRadius: '8px', border: '1px solid #d9d9d9' }}>
      <Title level={5} style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <FunctionOutlined style={{ color: '#1890ff' }} />
        Formula Configuration
      </Title>

      {/* Tabs */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', borderBottom: '1px solid #e8e8e8' }}>
          <div
            style={{
              padding: '8px 16px',
              cursor: 'pointer',
              borderBottom: activeTab === 'formula' ? '2px solid #1890ff' : 'none',
              color: activeTab === 'formula' ? '#1890ff' : '#666',
              fontWeight: activeTab === 'formula' ? '500' : '400'
            }}
            onClick={() => setActiveTab('formula')}
          >
            Formula
          </div>
          <div
            style={{
              padding: '8px 16px',
              cursor: 'pointer',
              borderBottom: activeTab === 'formatting' ? '2px solid #1890ff' : 'none',
              color: activeTab === 'formatting' ? '#1890ff' : '#666',
              fontWeight: activeTab === 'formatting' ? '500' : '400'
            }}
            onClick={() => setActiveTab('formatting')}
          >
            Formatting
          </div>
        </div>
      </div>

      {/* Formula Tab Content */}
      {activeTab === 'formula' && (
        <>
          {/* Formula Input */}
          <div style={{ marginBottom: '16px' }}>
            <TextArea
              value={formula}
              onChange={(e) => setFormula(e.target.value)}
              placeholder="Enter your formula (e.g., {price} * {quantity})"
              rows={4}
              style={{ 
                marginTop: '8px',
                fontFamily: 'monospace',
                fontSize: '14px'
              }}
            />
          </div>

          {/* Formulas List */}
          <div style={{ marginBottom: '16px' }}>
            <Text strong style={{ display: 'block', marginBottom: '12px' }}>FORMULAS</Text>
            <div style={{ 
              maxHeight: '200px', 
              overflowY: 'auto',
              border: '1px solid #e8e8e8',
              borderRadius: '4px',
              backgroundColor: 'white'
            }}>
              {functions.map((func, index) => (
                <Popover
                  key={func.name}
                  content={renderFunctionTooltip(func)}
                  title={null}
                  trigger="click"
                  open={openTooltip === func.name}
                  onOpenChange={(visible) => {
                    if (visible) {
                      setOpenTooltip(func.name);
                    } else {
                      setOpenTooltip(null);
                    }
                  }}
                  placement="right"
                  overlayStyle={{ 
                    maxWidth: '350px',
                    padding: '0'
                  }}
                >
                  <div
                    style={{
                      padding: '8px 12px',
                      cursor: 'pointer',
                      borderBottom: index < functions.length - 1 ? '1px solid #f0f0f0' : 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#f5f5f5'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                    onClick={() => addFunction(func.name)}
                  >
                    <span style={{ fontSize: '16px', color: '#1890ff' }}>Σ</span>
                    <span>{func.name}()</span>
                  </div>
                </Popover>
              ))}
            </div>
          </div>

          {/* Available Columns */}
          <div>
            <Text strong style={{ display: 'block', marginBottom: '8px' }}>Available Columns</Text>
            <div style={{ 
              display: 'flex', 
              flexWrap: 'wrap', 
              gap: '6px',
              maxHeight: '100px',
              overflowY: 'auto',
              padding: '8px',
              backgroundColor: 'white',
              border: '1px solid #e8e8e8',
              borderRadius: '4px'
            }}>
              {availableColumns
                .filter(col => col.dataType !== 'formula')
                .map(column => (
                  <div
                    key={column._id}
                    style={{
                      padding: '4px 8px',
                      backgroundColor: '#e6f7ff',
                      border: '1px solid #91d5ff',
                      borderRadius: '12px',
                      fontSize: '12px',
                      cursor: 'pointer',
                      color: '#1890ff',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = '#bae7ff';
                      e.target.style.borderColor = '#69c0ff';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = '#e6f7ff';
                      e.target.style.borderColor = '#91d5ff';
                    }}
                    onClick={() => addColumnReference(column.name)}
                  >
                    {column.name}
                  </div>
                ))}
            </div>
          </div>
        </>
      )}

      {/* Formatting Tab Content */}
      {activeTab === 'formatting' && (
        <div style={{ padding: '20px 0', textAlign: 'center', color: '#999' }}>
          <Text>Formatting options will be available here</Text>
        </div>
      )}
    </div>
  );
};

export default FormulaConfig;
