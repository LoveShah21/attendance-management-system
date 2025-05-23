// src/components/PaymentForm.jsx
import React, { useState } from 'react';
import axios from 'axios';
import '../css/paymentForm.css';

const PaymentForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    amount: '500', // Default to 500
  });
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Razorpay link with dynamic amount
  const razorpayBaseLink = 'https://razorpay.me/@apexchessacademy?amount=bd6mwPoVV2sRePhB8DGUcw%3D%3D';

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (!selectedFile.name.toLowerCase().endsWith('.pgn')) {
        setError('Only .pgn files are allowed!');
        e.target.value = null;
        setFile(null);
      } else {
        setFile(selectedFile);
        setError(null);
      }
    }
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('Name is required');
      return false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Valid email is required');
      return false;
    }
    
    if (!file) {
      setError('PGN file is required');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Create form data to send to server
      const data = new FormData();
      data.append('name', formData.name);
      data.append('email', formData.email);
      data.append('amount', formData.amount);
      data.append('pgnFile', file);
      
      // Call the API to initialize the payment
      const response = await axios.post('http://localhost:5000/api/payments/initialize', data, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      // Store the payment ID
      const paymentId = response.data.data.paymentId;
      
      // Create event handler for when payment completes
      window.addEventListener('focus', async function onFocus() {
        // This runs when user returns from Razorpay payment page
        
        // Ask user if payment was successful
        const wasPaymentSuccessful = window.confirm('Did you complete the payment successfully?');
        
        if (wasPaymentSuccessful) {
          try {
            // Get payment ID from Razorpay (this would normally come from a webhook)
            // For demo purposes, we're using a prompt - in production, this should be handled properly
            const razorpayPaymentId = prompt('Please enter the Razorpay Payment ID (for demo purposes):');
            
            if (razorpayPaymentId) {
              // Confirm the payment in your system
              await axios.post('http://localhost:5000/api/payments/confirm', {
                paymentId,
                razorpayPaymentId
              });
              
              setSuccess(true);
            }
          } catch (confirmError) {
            console.error('Error confirming payment:', confirmError);
            setError('Error confirming payment. Please contact support.');
          }
        }
        
        // Remove the event listener
        window.removeEventListener('focus', onFocus);
      });
      
      // Redirect to Razorpay payment page
      window.location.href = razorpayBaseLink;
      
    } catch (err) {
      console.error('Error submitting form:', err);
      setError('Error processing your request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="payment-form-container">
        <div className="payment-success">
          <h2 className='payment-done'>Payment Successful!</h2>
          <p>Thank you for your payment. Your transaction has been completed successfully.</p>
          <p>A confirmation email has been sent to {formData.email}.</p>
          <button 
            className="form-button"
            onClick={() => window.location.reload()}
          >
            Make Another Payment
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="payment-form-container">
      <div className="payment-form-card">
        <h2>Apex Chess Academy Payment</h2>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group fg">
            <label className='lbl' htmlFor="name">Full Name</label>
            <input
              className='fields'
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter your full name"
              required
            />
          </div>
          
          <div className="form-group fg">
            <label className='lbl' htmlFor="email">Email Address</label>
            <input
              className='fields'
              type="text"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email address"
              required
            />
          </div>
          
          <div className="form-group fg">
            <label className='lbl' htmlFor="amount">Payment Amount</label>
            <select
            className='fields'
              id="amount"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              required
            >
              <option value="500">₹500</option>
              <option value="3000">₹3000</option>
            </select>
          </div>
          
          <div className="form-group fg">
            <label className='lbl' htmlFor="pgnFile">Upload PGN File</label>
            <input
              className='fields f'
              type="file"
              id="pgnFile"
              name="pgnFile"
              onChange={handleFileChange}
              accept=".pgn"
              required
            />
            <small id='sm'>Only .pgn files are allowed</small>
          </div>
          
          <button 
            type="submit" 
            className="form-button fb"
            disabled={loading}
          >
            {loading ? 'Processing...' : 'Pay Now'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default PaymentForm;