import React, { useState } from 'react';
import { Select, Space, Typography, Input, InputNumber, Radio } from 'antd';
import { DollarOutlined } from '@ant-design/icons';

const { Option } = Select;
const { Text } = Typography;

const CurrencyConfig = ({ config, onChange }) => {
  const [showCurrencyDropdown, setShowCurrencyDropdown] = useState(false);

  const currencies = [
    { code: 'USD', symbol: '$', name: 'US Dollar' },
    { code: 'EUR', symbol: '€', name: 'Euro' },
    { code: 'GBP', symbol: '£', name: 'British Pound' },
    { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
    { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
    { code: 'VND', symbol: '₫', name: 'Vietnamese Dong' },
    { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
    { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
    { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc' },
    { code: 'SEK', symbol: 'kr', name: 'Swedish Krona' },
    { code: 'NOK', symbol: 'kr', name: 'Norwegian Krone' },
    { code: 'DKK', symbol: 'kr', name: 'Danish Krone' },
    { code: 'PLN', symbol: 'zł', name: 'Polish Zloty' },
    { code: 'CZK', symbol: 'Kč', name: 'Czech Koruna' },
    { code: 'HUF', symbol: 'Ft', name: 'Hungarian Forint' },
    { code: 'RUB', symbol: '₽', name: 'Russian Ruble' },
    { code: 'BRL', symbol: 'R$', name: 'Brazilian Real' },
    { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
    { code: 'KRW', symbol: '₩', name: 'South Korean Won' },
    { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
    { code: 'HKD', symbol: 'HK$', name: 'Hong Kong Dollar' },
    { code: 'NZD', symbol: 'NZ$', name: 'New Zealand Dollar' },
    { code: 'MXN', symbol: '$', name: 'Mexican Peso' },
    { code: 'ZAR', symbol: 'R', name: 'South African Rand' },
    { code: 'TRY', symbol: '₺', name: 'Turkish Lira' },
    { code: 'ILS', symbol: '₪', name: 'Israeli Shekel' },
    { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham' },
    { code: 'SAR', symbol: '﷼', name: 'Saudi Riyal' },
    { code: 'QAR', symbol: '﷼', name: 'Qatari Riyal' },
    { code: 'KWD', symbol: 'د.ك', name: 'Kuwaiti Dinar' },
    { code: 'BHD', symbol: 'د.ب', name: 'Bahraini Dinar' },
    { code: 'OMR', symbol: '﷼', name: 'Omani Rial' },
    { code: 'JOD', symbol: 'د.ا', name: 'Jordanian Dinar' },
    { code: 'LBP', symbol: 'ل.ل', name: 'Lebanese Pound' },
    { code: 'EGP', symbol: '£', name: 'Egyptian Pound' },
    { code: 'MAD', symbol: 'د.م.', name: 'Moroccan Dirham' },
    { code: 'TND', symbol: 'د.ت', name: 'Tunisian Dinar' },
    { code: 'DZD', symbol: 'د.ج', name: 'Algerian Dinar' },
    { code: 'LYD', symbol: 'ل.د', name: 'Libyan Dinar' },
    { code: 'SDG', symbol: 'ج.س.', name: 'Sudanese Pound' },
    { code: 'ETB', symbol: 'Br', name: 'Ethiopian Birr' },
    { code: 'KES', symbol: 'KSh', name: 'Kenyan Shilling' },
    { code: 'UGX', symbol: 'USh', name: 'Ugandan Shilling' },
    { code: 'TZS', symbol: 'TSh', name: 'Tanzanian Shilling' },
    { code: 'MWK', symbol: 'MK', name: 'Malawian Kwacha' },
    { code: 'ZMW', symbol: 'ZK', name: 'Zambian Kwacha' },
    { code: 'BWP', symbol: 'P', name: 'Botswana Pula' },
    { code: 'SZL', symbol: 'L', name: 'Swazi Lilangeni' },
    { code: 'LSL', symbol: 'L', name: 'Lesotho Loti' },
    { code: 'NAD', symbol: 'N$', name: 'Namibian Dollar' },
    { code: 'AOA', symbol: 'Kz', name: 'Angolan Kwanza' },
    { code: 'MZN', symbol: 'MT', name: 'Mozambican Metical' },
    { code: 'XOF', symbol: 'CFA', name: 'West African CFA Franc' },
    { code: 'XAF', symbol: 'FCFA', name: 'Central African CFA Franc' },
    { code: 'CDF', symbol: 'FC', name: 'Congolese Franc' },
    { code: 'RWF', symbol: 'RF', name: 'Rwandan Franc' },
    { code: 'BIF', symbol: 'FBu', name: 'Burundian Franc' },
    { code: 'KMF', symbol: 'CF', name: 'Comorian Franc' },
    { code: 'DJF', symbol: 'Fdj', name: 'Djiboutian Franc' },
    { code: 'SOS', symbol: 'S', name: 'Somali Shilling' },
    { code: 'ERN', symbol: 'Nfk', name: 'Eritrean Nakfa' },
    { code: 'STN', symbol: 'Db', name: 'São Tomé and Príncipe Dobra' },
    { code: 'CVE', symbol: '$', name: 'Cape Verdean Escudo' },
    { code: 'GMD', symbol: 'D', name: 'Gambian Dalasi' },
    { code: 'GNF', symbol: 'FG', name: 'Guinean Franc' },
    { code: 'LRD', symbol: 'L$', name: 'Liberian Dollar' },
    { code: 'SLL', symbol: 'Le', name: 'Sierra Leonean Leone' },
    { code: 'NGN', symbol: '₦', name: 'Nigerian Naira' },
    { code: 'GHS', symbol: '₵', name: 'Ghanaian Cedi' },
    { code: 'XPF', symbol: '₣', name: 'CFP Franc' },
    { code: 'TOP', symbol: 'T$', name: 'Tongan Paʻanga' },
    { code: 'WST', symbol: 'WS$', name: 'Samoan Tala' },
    { code: 'FJD', symbol: 'FJ$', name: 'Fijian Dollar' },
    { code: 'VUV', symbol: 'Vt', name: 'Vanuatu Vatu' },
    { code: 'SBD', symbol: 'SI$', name: 'Solomon Islands Dollar' },
    { code: 'PGK', symbol: 'K', name: 'Papua New Guinean Kina' },
    { code: 'KID', symbol: '$', name: 'Kiribati Dollar' },
    { code: 'TVD', symbol: '$', name: 'Tuvaluan Dollar' },
    { code: 'XDR', symbol: 'SDR', name: 'Special Drawing Rights' }
  ];

  const handleCurrencyChange = (currencyCode) => {
    const selectedCurrency = currencies.find(c => c.code === currencyCode);
    const newConfig = { 
      ...(config || {}), 
      currency: currencyCode,
      symbol: selectedCurrency.symbol
    };
    onChange(newConfig);
    setShowCurrencyDropdown(false);
  };

  const handleSymbolChange = (e) => {
    const newConfig = { ...(config || {}), symbol: e.target.value };
    onChange(newConfig);
  };

  const handlePositionChange = (e) => {
    const newConfig = { ...(config || {}), position: e.target.value };
    onChange(newConfig);
  };

  const handleDecimalPlacesChange = (value) => {
    const newConfig = { ...(config || {}), decimalPlaces: value };
    onChange(newConfig);
  };

  const handleThousandsSeparatorChange = (e) => {
    const newConfig = { ...(config || {}), thousandsSeparator: e.target.value };
    onChange(newConfig);
  };

  const handleDecimalSeparatorChange = (e) => {
    const newConfig = { ...(config || {}), decimalSeparator: e.target.value };
    onChange(newConfig);
  };

  const selectedCurrency = currencies.find(c => c.code === (config?.currency || 'USD'));

  return (
    <div style={{ marginTop: '16px' }}>
      <Text strong style={{ display: 'block', marginBottom: '8px' }}>
        Cấu hình Tiền tệ
      </Text>
      
      <Space direction="vertical" style={{ width: '100%' }}>
        {/* Currency Selection */}
        <div style={{ position: 'relative' }}>
          <Text style={{ display: 'block', marginBottom: '4px', fontSize: '12px' }}>
            Loại tiền tệ
          </Text>
          
          <div
            onClick={() => setShowCurrencyDropdown(!showCurrencyDropdown)}
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '8px 12px',
              border: '1px solid #d9d9d9',
              borderRadius: '6px',
              cursor: 'pointer',
              backgroundColor: 'white',
              transition: 'all 0.2s',
              position: 'relative'
            }}
            onMouseEnter={(e) => e.target.style.borderColor = '#40a9ff'}
            onMouseLeave={(e) => e.target.style.borderColor = '#d9d9d9'}
          >
            <DollarOutlined 
              style={{ 
                marginRight: '8px', 
                color: '#666',
                fontSize: '14px'
              }} 
            />
            <span style={{ flex: 1, fontSize: '14px' }}>
              {selectedCurrency ? `${selectedCurrency.code} - ${selectedCurrency.name}` : 'USD - US Dollar'}
            </span>
            <span style={{ 
              color: '#666', 
              fontSize: '12px',
              transition: 'transform 0.2s',
              transform: showCurrencyDropdown ? 'rotate(180deg)' : 'rotate(0deg)'
            }}>
              ▼
            </span>
          </div>

          {/* Currency Dropdown */}
          {showCurrencyDropdown && (
            <>
              <div
                style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  zIndex: 999
                }}
                onClick={() => setShowCurrencyDropdown(false)}
              />
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  backgroundColor: 'white',
                  border: '1px solid #d9d9d9',
                  borderRadius: '6px',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                  zIndex: 1000,
                  marginTop: '4px',
                  maxHeight: '200px',
                  overflow: 'auto'
                }}
              >
                {currencies.map((currency, index) => (
                  <div
                    key={currency.code}
                    onClick={() => handleCurrencyChange(currency.code)}
                    style={{
                      padding: '8px 12px',
                      cursor: 'pointer',
                      borderBottom: index < currencies.length - 1 ? '1px solid #f0f0f0' : 'none',
                      transition: 'background-color 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#f5f5f5'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '14px', fontWeight: 'bold', minWidth: '40px' }}>
                        {currency.symbol}
                      </span>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: 'bold' }}>{currency.code}</div>
                        <div style={{ fontSize: '12px', color: '#666' }}>{currency.name}</div>
                      </div>
                    </div>
                    {(config?.currency || 'USD') === currency.code && (
                      <span style={{ color: '#1890ff', fontSize: '14px' }}>✓</span>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Custom Symbol */}
        <div>
          <Text style={{ display: 'block', marginBottom: '4px', fontSize: '12px' }}>
            Ký hiệu tùy chỉnh (Tùy chọn)
          </Text>
          <Input
            value={config?.symbol || selectedCurrency?.symbol || '$'}
            onChange={handleSymbolChange}
            placeholder="Ký hiệu tiền tệ"
            style={{ width: '100%' }}
          />
        </div>

        {/* Symbol Position */}
        <div>
          <Text style={{ display: 'block', marginBottom: '4px', fontSize: '12px' }}>
            Vị trí ký hiệu
          </Text>
          <Radio.Group
            value={config?.position || 'before'}
            onChange={handlePositionChange}
            style={{ width: '100%' }}
          >
            <Radio value="before">Trước số tiền ($100)</Radio>
            <Radio value="after">Sau số tiền (100$)</Radio>
          </Radio.Group>
        </div>

        {/* Decimal Places */}
        <div>
          <Text style={{ display: 'block', marginBottom: '4px', fontSize: '12px' }}>
            Số chữ số thập phân
          </Text>
          <InputNumber
            value={config?.decimalPlaces !== undefined ? config.decimalPlaces : 2}
            onChange={handleDecimalPlacesChange}
            min={0}
            max={4}
            style={{ width: '100%' }}
          />
        </div>

        {/* Thousands Separator */}
        <div>
          <Text style={{ display: 'block', marginBottom: '4px', fontSize: '12px' }}>
            Ký tự phân cách hàng nghìn
          </Text>
          <Input
            value={config?.thousandsSeparator || ','}
            onChange={handleThousandsSeparatorChange}
            placeholder="Ký tự phân cách hàng nghìn"
            style={{ width: '100%' }}
            maxLength={1}
          />
        </div>

        {/* Decimal Separator */}
        <div>
          <Text style={{ display: 'block', marginBottom: '4px', fontSize: '12px' }}>
            Ký tự phân cách thập phân
          </Text>
          <Input
            value={config?.decimalSeparator || '.'}
            onChange={handleDecimalSeparatorChange}
            placeholder="Ký tự phân cách thập phân"
            style={{ width: '100%' }}
            maxLength={1}
          />
        </div>
        {/* Default Value */}
        <div>
          <Text style={{ display: 'block', marginBottom: '4px', fontSize: '12px' }}>
            Giá trị mặc định
          </Text>
          <InputNumber
            value={config?.defaultValue !== undefined ? config.defaultValue : 0}
            onChange={(value) => {
              const newConfig = { ...(config || {}), defaultValue: value || 0 };
              onChange(newConfig);
            }}
            style={{ width: '100%' }}
            placeholder="Nhập giá trị mặc định"
          />
        </div>



        {/* Preview */}
        <div style={{ 
          marginTop: '12px', 
          padding: '8px 12px', 
          backgroundColor: '#f5f5f5', 
          borderRadius: '6px',
          border: '1px solid #d9d9d9'
        }}>
          <Text style={{ fontSize: '12px', color: '#666', display: 'block', marginBottom: '4px' }}>
            Xem trước:
          </Text>
          <Text style={{ fontSize: '16px', fontWeight: 'bold' }}>
            {(() => {
              const symbol = config?.symbol || selectedCurrency?.symbol || '$';
              const position = config?.position || 'before';
              const decimalPlaces = config?.decimalPlaces !== undefined ? config.decimalPlaces : 2;
              const thousandsSep = config?.thousandsSeparator || ',';
              const decimalSep = config?.decimalSeparator || '.';
              
              const amount = 1234567.89;
              const formatted = amount.toLocaleString('en-US', {
                minimumFractionDigits: decimalPlaces,
                maximumFractionDigits: decimalPlaces
              }).replace(/,/g, thousandsSep).replace(/\./g, decimalSep);
              
              return position === 'before' ? `${symbol}${formatted}` : `${formatted}${symbol}`;
            })()}
          </Text>
        </div>
      </Space>
    </div>
  );
};

export default CurrencyConfig;
