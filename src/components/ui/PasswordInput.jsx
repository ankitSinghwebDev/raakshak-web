import { useState } from 'react'
import { EyeOutlined, EyeInvisibleOutlined } from '@ant-design/icons'
import './PasswordInput.css'

const PasswordInput = ({ value, onChange, placeholder, className, ...props }) => {
  const [visible, setVisible] = useState(false)

  return (
    <div className="pwd-wrapper">
      <input
        type={visible ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`pwd-input ${className || ''}`}
        {...props}
      />
      <button
        type="button"
        className="pwd-toggle"
        onClick={() => setVisible(!visible)}
        tabIndex={-1}
        aria-label={visible ? 'Hide password' : 'Show password'}
      >
        <span className="pwd-icon-slot">
          {visible ? <EyeInvisibleOutlined /> : <EyeOutlined />}
        </span>
      </button>
    </div>
  )
}

export default PasswordInput
