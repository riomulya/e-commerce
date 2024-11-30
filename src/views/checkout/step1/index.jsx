import { ArrowRightOutlined, ShopOutlined } from '@ant-design/icons';
import { BasketItem } from '@/components/basket';
import { displayMoney } from '@/helpers/utils';
import { useDocumentTitle, useScrollTop } from '@/hooks';
import PropType from 'prop-types';
import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useHistory } from 'react-router-dom';
import { StepTracker } from '../components';
import withCheckout from '../hoc/withCheckout';

const OrderSummary = ({ basket, subtotal }) => {
useEffect(() => {
  const snapScript = document.createElement('script');
  const clienKey = process.env.VITE_MIDTRANS_CLIENT_KEY;

  const script = document.createElement('script');
  script.src = 'https://app.sandbox.midtrans.com/snap/snap.js';
  script.async = true;

  document.body.appendChild(script);

  return () => {
    document.body.removeChild(script);
  }
}, [third])


  useDocumentTitle('Check Out Step 1');
  useScrollTop();
  const dispatch = useDispatch();
  const history = useHistory();

  // Function to handle payment
  const handlePayment = async () => {
    // Step 1: Prepare transaction data
    const transactionData = {
      orderId: `ORDER-${new Date().getTime()}`, // Generate unique order ID
      quantity: basket.length, // Quantity of items in the basket
      price: subtotal, // Total price
    };

    try {
      // Step 2: Send request to backend to create a transaction and get the payment token
      const response = await fetch('https://api-e-commerce-riomulyas-projects.vercel.app/createTransaction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(transactionData),
      });

      const data = await response.json();
      console.log('Transaction data:', data);

      // Check if redirect URL is available (for redirect payment flow)
       if (data.token) {
        // Use Snap (popup) for payment if redirect URL is not available
        window.snap.pay(data.token, {
          onSuccess: (result) => {
            console.log('Payment success:', result);
            alert('Pembayaran berhasil!');
          },
          onPending: (result) => {
            console.log('Payment pending:', result);
            alert('Pembayaran pending!');
          },
          onError: (result) => {
            console.error('Payment error:', result);
            alert('Pembayaran gagal.');
          },
          onClose: () => {
            alert('Anda menutup popup pembayaran.');
          },
        });
      }
    } catch (error) {
      console.error('Error during payment:', error);
      alert('Terjadi kesalahan saat memproses pembayaran.');
    }
  };

  const onClickPrevious = () => history.push('/');
  // Remove the step navigation and go directly to payment
  const onClickNext = () => handlePayment();

  return (
    <div className="checkout">
      <StepTracker current={1} />
      <div className="checkout-step-1">
        <h3 className="text-center">Order Summary</h3>
        <span className="d-block text-center">Review items in your basket.</span>
        <br />
        <div className="checkout-items">
          {basket.map((product) => (
            <BasketItem
              basket={basket}
              dispatch={dispatch}
              key={product.id}
              product={product}
            />
          ))}
        </div>
        <br />
        <div className="basket-total text-right">
          <p className="basket-total-title">Subtotal:</p>
          <h2 className="basket-total-amount">{displayMoney(subtotal)}</h2>
        </div>
        <br />
        <div className="checkout-shipping-action">
          <button
            className="button button-muted"
            onClick={onClickPrevious}
            type="button"
          >
            <ShopOutlined />
            &nbsp;
            Continue Shopping
          </button>
          <button
            className="button"
            onClick={onClickNext} // Directly trigger payment instead of navigating to Step 2
            type="submit"
          >
            Pay Now
            &nbsp;
            <ArrowRightOutlined />
          </button>
        </div>
      </div>
    </div>
  );
};

OrderSummary.propTypes = {
  basket: PropType.arrayOf(PropType.object).isRequired,
  subtotal: PropType.number.isRequired,
};

export default withCheckout(OrderSummary);
