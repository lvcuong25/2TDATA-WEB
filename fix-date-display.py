import re

def fix_date_formatting():
    file_path = '/home/dbuser/2TDATA-WEB-dev/FE/src/pages/DatabaseManagement/TableDetail.jsx'
    
    with open(file_path, 'r') as f:
        content = f.read()
    
    # Fix the date display logic in table cells (around line 3590)
    old_pattern1 = r'column\.dataType === \'date\' && value \? \n.*?try \{\n.*?const date = new Date\(value\);\n.*?return date\.toLocaleDateString\(\'en-CA\'\).*?\n.*?\} catch \{\n.*?return value;\n.*?\}\n.*?\}\)\(\)'
    
    new_pattern1 = '''column.dataType === 'date' && value ? 
                                    (() => {
                                      const dateFormat = column.dateConfig?.format || 'DD/MM/YYYY';
                                      return formatDateForDisplay(value, dateFormat);
                                    })()'''
    
    # Fix the date input logic (around line 2758 and 3318)
    old_pattern2 = r'const formatDateForInput = \(dateString\) => \{\n.*?if \(!dateString\) return \'\';\n.*?try \{\n.*?const date = new Date\(dateString\);\n.*?return date\.toISOString\(\)\.split\(\'T\'\)\[0\].*?\n.*?\} catch \{\n.*?return dateString;\n.*?\}\n.*?\};'
    
    # Replace with simple call to utility function
    # First, let's manually replace the specific sections
    
    # Replace date display in table cells
    content = re.sub(
        r'return date\.toLocaleDateString\(\'en-CA\'\); // YYYY-MM-DD format',
        'return formatDateForDisplay(value, column.dateConfig?.format || \'DD/MM/YYYY\');',
        content
    )
    
    # Replace the date input formatting function calls
    content = re.sub(
        r'const formatDateForInput = \(dateString\) => \{\s*if \(!dateString\) return \'\';\s*try \{\s*const date = new Date\(dateString\);\s*return date\.toISOString\(\)\.split\(\'T\'\)\[0\]; // YYYY-MM-DD format\s*\} catch \{\s*return dateString;\s*\}\s*\};',
        '// Use utility function for date input formatting',
        content,
        flags=re.MULTILINE | re.DOTALL
    )
    
    # Replace the usage of formatDateForInput
    content = re.sub(
        r'value=\{formatDateForInput\(cellValue\)\}',
        'value={formatDateForInput(cellValue)}',
        content
    )
    
    # Write back the modified content
    with open(file_path, 'w') as f:
        f.write(content)
    
    print("✅ Date formatting logic updated")

if __name__ == '__main__':
    fix_date_formatting()
