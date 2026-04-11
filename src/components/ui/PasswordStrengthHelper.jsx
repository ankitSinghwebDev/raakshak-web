import { PASSWORD_RULES } from '../../utils/passwordRules'
import './PasswordStrengthHelper.css'

const PasswordStrengthHelper = ({ password = '' }) => {
  if (!password) return null

  return (
    <ul className="pw-helper">
      {PASSWORD_RULES.map((rule) => {
        const passed = rule.test(password)
        return (
          <li key={rule.key} className={`pw-helper-item ${passed ? 'pw-helper-ok' : 'pw-helper-missing'}`}>
            <span className="pw-helper-icon">{passed ? '✓' : '○'}</span>
            <span>{rule.label}</span>
          </li>
        )
      })}
    </ul>
  )
}

export default PasswordStrengthHelper
