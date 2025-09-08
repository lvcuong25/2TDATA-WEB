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

  const functionCategories = {
    'Math & Statistical': [
      { name: 'SUM', description: 'Sum of values', syntax: 'SUM(value1, [value2, ...])', examples: ['SUM(10, 5, 3) ➔ 18', 'SUM({column1}, {column2})'] },
      { name: 'AVG', description: 'Average of values', syntax: 'AVG(value1, [value2, ...])', examples: ['AVG(10, 5) ➔ 7.5', 'AVG({column1}, {column2})'] },
      { name: 'MIN', description: 'Minimum value', syntax: 'MIN(value1, [value2, ...])', examples: ['MIN(10, 5, 3) ➔ 3', 'MIN({column1}, {column2})'] },
      { name: 'MAX', description: 'Maximum value', syntax: 'MAX(value1, [value2, ...])', examples: ['MAX(10, 5, 3) ➔ 10', 'MAX({column1}, {column2})'] },
      { name: 'COUNT', description: 'Count non-empty values', syntax: 'COUNT(value1, [value2, ...])', examples: ['COUNT({column1}, {column2})', 'COUNT({jan}, {feb}, {mar})'] },
      { name: 'MEDIAN', description: 'Median value', syntax: 'MEDIAN(value1, [value2, ...])', examples: ['MEDIAN(1, 2, 3, 4, 5) ➔ 3', 'MEDIAN({scores})'] },
      { name: 'STDEV', description: 'Standard deviation', syntax: 'STDEV(value1, [value2, ...])', examples: ['STDEV(1, 2, 3, 4, 5)', 'STDEV({values})'] },
      { name: 'ROUND', description: 'Round number', syntax: 'ROUND(number, decimals)', examples: ['ROUND(3.14159, 2) ➔ 3.14', 'ROUND({price}, 2)'] },
      { name: 'ROUNDUP', description: 'Round up', syntax: 'ROUNDUP(number, decimals)', examples: ['ROUNDUP(3.1, 0) ➔ 4', 'ROUNDUP({price}, 0)'] },
      { name: 'ROUNDDOWN', description: 'Round down', syntax: 'ROUNDDOWN(number, decimals)', examples: ['ROUNDDOWN(3.9, 0) ➔ 3', 'ROUNDDOWN({price}, 0)'] },
      { name: 'ABS', description: 'Absolute value', syntax: 'ABS(number)', examples: ['ABS(-5) ➔ 5', 'ABS({difference})'] },
      { name: 'SQRT', description: 'Square root', syntax: 'SQRT(number)', examples: ['SQRT(16) ➔ 4', 'SQRT({value})'] },
      { name: 'POWER', description: 'Power function', syntax: 'POWER(number, power)', examples: ['POWER(2, 3) ➔ 8', 'POWER({base}, 2)'] }
    ],
    'Text': [
      { name: 'CONCAT', description: 'Concatenate strings', syntax: 'CONCAT(value1, [value2, ...])', examples: ['CONCAT("Hello", " ", "World")', 'CONCAT({firstName}, " ", {lastName})'] },
      { name: 'UPPER', description: 'Convert to uppercase', syntax: 'UPPER(text)', examples: ['UPPER("hello") ➔ "HELLO"', 'UPPER({status})'] },
      { name: 'LOWER', description: 'Convert to lowercase', syntax: 'LOWER(text)', examples: ['LOWER("HELLO") ➔ "hello"', 'LOWER({email})'] },
      { name: 'PROPER', description: 'Proper case', syntax: 'PROPER(text)', examples: ['PROPER("hello world") ➔ "Hello World"', 'PROPER({name})'] },
      { name: 'LEN', description: 'String length', syntax: 'LEN(text)', examples: ['LEN("Hello") ➔ 5', 'LEN({description})'] },
      { name: 'LEFT', description: 'Extract left characters', syntax: 'LEFT(text, numChars)', examples: ['LEFT("Hello", 3) ➔ "Hel"', 'LEFT({code}, 2)'] },
      { name: 'RIGHT', description: 'Extract right characters', syntax: 'RIGHT(text, numChars)', examples: ['RIGHT("Hello", 3) ➔ "llo"', 'RIGHT({code}, 2)'] },
      { name: 'MID', description: 'Extract middle characters', syntax: 'MID(text, start, numChars)', examples: ['MID("Hello", 2, 3) ➔ "ell"', 'MID({text}, 1, 5)'] },
      { name: 'FIND', description: 'Find text position', syntax: 'FIND(findText, withinText, startNum)', examples: ['FIND("l", "Hello") ➔ 3', 'FIND(" ", {fullName})'] },
      { name: 'TRIM', description: 'Remove extra spaces', syntax: 'TRIM(text)', examples: ['TRIM("  hello  ") ➔ "hello"', 'TRIM({input})'] }
    ],
    'Date & Time': [
      { name: 'TODAY', description: 'Current date', syntax: 'TODAY()', examples: ['TODAY() ➔ 2024-01-15', 'TODAY()'] },
      { name: 'NOW', description: 'Current date and time', syntax: 'NOW()', examples: ['NOW() ➔ 2024-01-15 10:30:00', 'NOW()'] },
      { name: 'DATE', description: 'Create date', syntax: 'DATE(year, month, day)', examples: ['DATE(2024, 1, 15)', 'DATE({year}, {month}, {day})'] },
      { name: 'YEAR', description: 'Extract year', syntax: 'YEAR(date)', examples: ['YEAR("2024-01-15") ➔ 2024', 'YEAR({birthDate})'] },
      { name: 'MONTH', description: 'Extract month', syntax: 'MONTH(date)', examples: ['MONTH("2024-01-15") ➔ 1', 'MONTH({birthDate})'] },
      { name: 'DAY', description: 'Extract day', syntax: 'DAY(date)', examples: ['DAY("2024-01-15") ➔ 15', 'DAY({birthDate})'] },
      { name: 'DATEDIF', description: 'Date difference', syntax: 'DATEDIF(startDate, endDate, unit)', examples: ['DATEDIF("2024-01-01", "2024-01-15", "D") ➔ 14', 'DATEDIF({start}, {end}, "D")'] },
      { name: 'DATEADD', description: 'Add days to date', syntax: 'DATEADD(date, days)', examples: ['DATEADD("2024-01-01", 7) ➔ 2024-01-08', 'DATEADD({date}, 30)'] },
      { name: 'WEEKDAY', description: 'Day of week', syntax: 'WEEKDAY(date, returnType)', examples: ['WEEKDAY("2024-01-15") ➔ 2 (Monday)', 'WEEKDAY({date})'] }
    ],
    'Logical': [
      { name: 'IF', description: 'Conditional value', syntax: 'IF(condition, trueValue, falseValue)', examples: ['IF(5 > 3, "Yes", "No") ➔ "Yes"', 'IF({age} >= 18, "Adult", "Minor")'] },
      { name: 'AND', description: 'Logical AND', syntax: 'AND(condition1, [condition2, ...])', examples: ['AND(5 > 3, 2 < 4) ➔ true', 'AND({age} >= 18, {status} == "active")'] },
      { name: 'OR', description: 'Logical OR', syntax: 'OR(condition1, [condition2, ...])', examples: ['OR(5 < 3, 2 < 4) ➔ true', 'OR({status} == "active", {status} == "pending")'] },
      { name: 'NOT', description: 'Logical NOT', syntax: 'NOT(logical)', examples: ['NOT(true) ➔ false', 'NOT({isDeleted})'] },
      { name: 'ISBLANK', description: 'Check if blank', syntax: 'ISBLANK(value)', examples: ['ISBLANK("") ➔ true', 'ISBLANK({field})'] },
      { name: 'ISNUMBER', description: 'Check if number', syntax: 'ISNUMBER(value)', examples: ['ISNUMBER(123) ➔ true', 'ISNUMBER({field})'] },
      { name: 'ISTEXT', description: 'Check if text', syntax: 'ISTEXT(value)', examples: ['ISTEXT("hello") ➔ true', 'ISTEXT({field})'] },
      { name: 'IFERROR', description: 'Handle errors', syntax: 'IFERROR(value, valueIfError)', examples: ['IFERROR(1/0, "Error") ➔ "Error"', 'IFERROR({calculation}, 0)'] }
    ]
  };

  // Flatten all functions for the old interface
  const functions = Object.values(functionCategories).flat();

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
            <Text strong style={{ display: 'block', marginBottom: '12px' }}>EXCEL FUNCTIONS</Text>
            <div style={{ 
              maxHeight: '300px', 
              overflowY: 'auto',
              border: '1px solid #e8e8e8',
              borderRadius: '4px',
              backgroundColor: 'white'
            }}>
              {Object.entries(functionCategories).map(([categoryName, categoryFunctions]) => (
                <div key={categoryName} style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <div style={{
                    padding: '8px 12px',
                    backgroundColor: '#fafafa',
                    borderBottom: '1px solid #e8e8e8',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    color: '#666',
                    textTransform: 'uppercase'
                  }}>
                    {categoryName}
                  </div>
                  {categoryFunctions.map((func, index) => (
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
                          padding: '6px 12px 6px 24px',
                          cursor: 'pointer',
                          borderBottom: index < categoryFunctions.length - 1 ? '1px solid #f8f8f8' : 'none',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          transition: 'background-color 0.2s',
                          fontSize: '13px'
                        }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = '#f5f5f5'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                        onClick={() => addFunction(func.name)}
                      >
                        <span style={{ fontSize: '14px', color: '#1890ff' }}>Σ</span>
                        <span>{func.name}()</span>
                      </div>
                    </Popover>
                  ))}
                </div>
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
