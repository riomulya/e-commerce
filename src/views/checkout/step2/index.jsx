/* eslint-disable react/forbid-prop-types */
/* eslint-disable no-nested-ternary */
import { ArrowLeftOutlined, ArrowRightOutlined } from '@ant-design/icons';
import { Boundary } from '@/components/common';
import { CHECKOUT_STEP_1 } from '@/constants/routes';
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

const ShippingDetails = ({ profile, shipping, subtotal }) => {
  useDocumentTitle('Check Out Step 2');
  useScrollTop();
  const dispatch = useDispatch();
  const history = useHistory();

  const initFormikValues = {
    fullname: shipping.fullname || profile.fullname || '',
    email: shipping.email || profile.email || '',
    address: shipping.address || profile.address || '',
    mobile: shipping.mobile || profile.mobile || {},
    isInternational: shipping.isInternational || false,
    isDone: shipping.isDone || false
  };

  const onSubmitForm = async (form) => {
    // Step 1: Simpan shipping details ke Redux
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
    // Step 2: Kirim request ke backend untuk mendapatkan Midtrans token
    try {
      const response = await fetch('http://localhost:8080/createTransaction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: `ORDER-${new Date().getTime()}`, // Order ID unik
          quantity: 1,
          price: subtotal , // Total harga termasuk biaya internasional
        }),
      });
      console.log({transactionData});
      const data = await response.json();

    // Redirect ke URL Midtrans atau gunakan Snap popup
      if (data.redirect_url) {
        // Redirect pengguna ke halaman pembayaran Midtrans
        window.location.href = data.redirect_url;
      } else {
        // Alternatif: gunakan Snap popup jika Anda ingin tetap di halaman
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

  return (
    <Boundary>
      <div className="checkout">
        <StepTracker current={2} />
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
                {/*  ---- TOTAL --------- */}
                <ShippingTotal subtotal={subtotal} />
                <br />
                {/*  ----- NEXT/PREV BUTTONS --------- */}
                <div className="checkout-shipping-action">
                  <button
                    className="button button-muted"
                    onClick={() => history.push(CHECKOUT_STEP_1)}
                    type="button"
                  >
                    <ArrowLeftOutlined />
                    &nbsp;
                    Go Back
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

ShippingDetails.propTypes = {
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

export default withCheckout(ShippingDetails);
