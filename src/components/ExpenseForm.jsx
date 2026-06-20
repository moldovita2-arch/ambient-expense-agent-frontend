import { useState } from 'react';
import { Settings, Send, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { submitExpense } from '../services/agentApi';

export default function ExpenseForm() {
  const [showSettings, setShowSettings] = useState(false);

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null); // { type: 'success' | 'error' | 'info', message: '' }

  const [formData, setFormData] = useState({
    amount: '',
    submitter: '',
    category: 'meal',
    description: '',
    date: new Date().toISOString().split('T')[0]
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);

    // Format amount as float
    const payload = {
      ...formData,
      amount: parseFloat(formData.amount)
    };

    const result = await submitExpense(payload);
    
    if (result.success) {
      if (result.hitl) {
        setStatus({ type: 'info', message: result.message });
      } else {
        setStatus({ type: 'success', message: result.message });
        // Reset form on complete success
        setFormData({ ...formData, amount: '', description: '' });
      }
    } else {
      setStatus({ type: 'error', message: result.message });
    }
    
    setLoading(false);
  };

  return (
    <div className="glass-panel">
      <button 
        className="settings-toggle" 
        onClick={() => setShowSettings(!showSettings)}
        title="Settings"
      >
        <Settings size={20} />
      </button>

      <h1>Submit Expense</h1>
      <p className="subtitle">Ambient Agent Evaluation Gateway</p>

      {showSettings && (
        <div className="settings-panel">
          <p style={{ fontSize: '0.9rem', color: '#666' }}>
            Authentication is now handled automatically by the server.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="input-group">
          <label>Submitter Email</label>
          <input
            type="email"
            name="submitter"
            required
            className="glass-input"
            value={formData.submitter}
            onChange={handleChange}
            placeholder="employee@company.com"
          />
        </div>

        <div style={{ display: 'flex', gap: '16px' }}>
          <div className="input-group" style={{ flex: 1 }}>
            <label>Amount ($)</label>
            <input
              type="number"
              name="amount"
              step="0.01"
              min="0"
              required
              className="glass-input"
              value={formData.amount}
              onChange={handleChange}
              placeholder="0.00"
            />
          </div>
          
          <div className="input-group" style={{ flex: 1 }}>
            <label>Category</label>
            <select
              name="category"
              className="glass-input"
              value={formData.category}
              onChange={handleChange}
            >
              <option value="meal">Meal</option>
              <option value="travel">Travel</option>
              <option value="software">Software</option>
              <option value="hardware">Hardware</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        <div className="input-group">
          <label>Date</label>
          <input
            type="date"
            name="date"
            required
            className="glass-input"
            value={formData.date}
            onChange={handleChange}
          />
        </div>

        <div className="input-group">
          <label>Description</label>
          <textarea
            name="description"
            required
            className="glass-input"
            value={formData.description}
            onChange={handleChange}
            placeholder="What was this expense for?"
          />
        </div>

        <button type="submit" className="submit-btn" disabled={loading}>
          {loading ? (
            <div className="loader" />
          ) : (
            <>
              Send to Agent <Send size={18} />
            </>
          )}
        </button>
      </form>

      {status && (
        <div className={`status-msg ${status.type}`}>
          {status.type === 'success' && <CheckCircle size={20} />}
          {status.type === 'error' && <AlertCircle size={20} />}
          {status.type === 'info' && <Clock size={20} />}
          <span>{status.message}</span>
        </div>
      )}
    </div>
  );
}
