import './Spinner.css'

const Spinner = ({ text = 'Loading...' }) => (
  <div className="spinner-container">
    <div className="spinner-ring" />
    <p className="spinner-text">{text}</p>
  </div>
)

export default Spinner
