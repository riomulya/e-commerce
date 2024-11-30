/* eslint-disable react/forbid-prop-types */
/* eslint-disable no-nested-ternary */
import { ArrowLeftOutlined, ArrowRightOutlined, ShopOutlined } from '@ant-design/icons';
import { BasketItem } from '@/components/basket';
import { Boundary } from '@/components/common';
import { CHECKOUT_STEP_1, CHECKOUT_STEP_2 } from '@/constants/routes';
import { displayMoney } from '@/helpers/utils';
import { Form, Formik } from 'formik';
import { useDocumentTitle, useScrollTop } from '@/hooks';
import PropType from 'prop-types';
import React from 'react';
import { useDispatch } from 'react-redux';
import { useHistory } from 'react-router-dom';
import { setShippingDetails } from '@/redux/actions/checkoutActions';
import * as Yup from 'yup';
import { StepTracker } from '../components';
import withCheckout from '../hoc/withCheckout';
import ShippingForm from './ShippingForm';
import ShippingTotal from './ShippingTotal';

// Schema Formulir
const FormSchema = Yup.object().shape({
  fullname: Yup.string()
    .required('Full name is required.')
    .min(2, 'Full name must be at least 2 characters long.')
    .max(60, 'Full name must only be less than 60 characters.'),
  email: Yup.string()
    .email('Email is not valid.')
    .required('Email is required.'),
  address: Yup.string()
    .required('Shipping address is required.'),
  mobile: Yup.object()
    .shape({
      country: Yup.string(),
      countryCode: Yup.string(),
      dialCode: Yup.string().required('Mobile number is required'),
      value: Yup.string().required('Mobile number is required')
    })
    .required('Mobile number is required.'),
  isInternational: Yup.boolean(),
  isDone: Yup.boolean()
});

const Checkout = ({ profile, shipping, basket, subtotal }) => {
  const dispatch = useDispatch();
  const history = useHistory();

  // Inisialisasi Nilai Formulir
  const initFormikValues = {
    fullname: shipping.fullname || profile.fullname || '',
    email: shipping.email || profile.email || '',
    address: shipping.address || profile.address || '',
    mobile: shipping.mobile || profile.mobile || {},
    isInternational: shipping.isInternational || false,
    isDone: shipping.isDone || false
  };

  const onSubmitForm = async (form) => {
    // Menyimpan detail pengiriman di Redux
    dispatch(setShippingDetails({
      fullname: form.fullname,
      email: form.email,
      address: form.address,
      mobile: form.mobile,
      isInternational: form.isInternational,
      isDone: true
    }));

    const transactionData = {
      orderId: `ORDER-${new Date().getTime()}`, // ID unik untuk pesanan
      quantity: 1, // Ubah sesuai dengan logika jumlah item
      price: subtotal // Total harga
    };

    try {
      const response = await fetch('http://localhost:8080/createTransaction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: `ORDER-${new Date().getTime()}`,
          quantity: 1,
          price: subtotal,
        }),
      });

      const data = await response.json();

      if (data.redirect_url) {
        window.location.href = data.redirect_url;
      } else {
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

  useDocumentTitle('Checkout');
  useScrollTop();

  const onClickPrevious = () => history.push('/');
  const onClickNext = () => history.push(CHECKOUT_STEP_2);

  return (
    <Boundary>
      <div className="checkout">
        <StepTracker current={1} />
        
        {/* Order Summary */}
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
          {/* <div className="basket-total text-right">
            <p className="basket-total-title">Subtotal:</p>
            <h2 className="basket-total-amount">{displayMoney(subtotal)}</h2>
          </div> */}
          <br />
        </div>

        {/* Shipping Details Form */}
        {/* <StepTracker current={2} /> */}
        <div className="checkout-step-2">
          <h3 className="text-center">Shipping Details</h3>
          <Formik
            initialValues={initFormikValues}
            validateOnChange
            validationSchema={FormSchema}
            onSubmit={onSubmitForm}
          >
            {({ values }) => (
              <Form>
                <ShippingForm />
                <br />
                {/* ---- Shipping Total --------- */}
                <ShippingTotal subtotal={subtotal} />
                <br />
                {/* ----- Next/Previous Buttons --------- */}
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
                    className="button button-icon"
                    type="submit"
                  >
                    Confirm & Pay
                    &nbsp;
                    <ArrowRightOutlined />
                  </button>
                </div>
              </Form>
            )}
          </Formik>
        </div>
      </div>
    </Boundary>
  );
};

Checkout.propTypes = {
  basket: PropType.arrayOf(PropType.object).isRequired,
  subtotal: PropType.number.isRequired,
  profile: PropType.shape({
    fullname: PropType.string,
    email: PropType.string,
    address: PropType.string,
    mobile: PropType.object
  }).isRequired,
  shipping: PropType.shape({
    fullname: PropType.string,
    email: PropType.string,
    address: PropType.string,
    mobile: PropType.object,
    isInternational: PropType.bool,
    isDone: PropType.bool
  }).isRequired
};

export default withCheckout(Checkout);
