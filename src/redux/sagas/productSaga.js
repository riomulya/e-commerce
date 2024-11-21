/* eslint-disable indent */
import {
  ADD_PRODUCT,
  EDIT_PRODUCT,
  GET_PRODUCTS,
  REMOVE_PRODUCT,
  SEARCH_PRODUCT,
} from '@/constants/constants';
import { ADMIN_PRODUCTS } from '@/constants/routes';
import { displayActionMessage } from '@/helpers/utils';
import { all, call, put, select } from 'redux-saga/effects';
import { setLoading, setRequestStatus } from '@/redux/actions/miscActions';
import { history } from '@/routers/AppRouter';
import firebase from '@/services/firebase';
import {
  addProductSuccess,
  clearSearchState,
  editProductSuccess,
  getProductsSuccess,
  removeProductSuccess,
  searchProductSuccess,
} from '../actions/productActions';

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dffslhnhihfzeoznvgud.supabase.co'; // Ganti dengan URL proyek Anda
const supabaseKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRmZnNsaG5oaWhmemVvem52Z3VkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMjE4MTY0OCwiZXhwIjoyMDQ3NzU3NjQ4fQ.XvKpgWF9f6bggPqkSkhIm3GLTmLJECeV0K4S6gt2Es8'; // Ganti dengan API key Anda
const supabase = createClient(supabaseUrl, supabaseKey);

function* initRequest() {
  yield put(setLoading(true));
  yield put(setRequestStatus(null));
}

function* handleError(e) {
  yield put(setLoading(false));
  yield put(setRequestStatus(e?.message || 'Failed to fetch products'));
  console.log('ERROR: ', e);
}

function* handleAction(location, message, status) {
  if (location) yield call(history.push, location);
  yield call(displayActionMessage, message, status);
}

function* productSaga({ type, payload }) {
  switch (type) {
    case GET_PRODUCTS:
      try {
        yield initRequest();
        const state = yield select();
        const result = yield call(firebase.getProducts, payload);

        if (result.products.length === 0) {
          handleError('No items found.');
        } else {
          yield put(
            getProductsSuccess({
              products: result.products,
              lastKey: result.lastKey
                ? result.lastKey
                : state.products.lastRefKey,
              total: result.total ? result.total : state.products.total,
            })
          );
          yield put(setRequestStatus(''));
        }
        // yield put({ type: SET_LAST_REF_KEY, payload: result.lastKey });
        yield put(setLoading(false));
      } catch (e) {
        console.log(e);
        yield handleError(e);
      }
      break;

    case ADD_PRODUCT: {
      try {
        yield initRequest();

        // Upload gambar utama ke Supabase
        console.log('Uploading main image...');
        const fileName = `${Date.now()}-${payload.image.name}`;
        const { data: mainImageData, error: mainImageError } = yield call(
          [supabase.storage.from('products'), 'upload'],
          fileName,
          payload.image
        );

        if (mainImageError) {
          console.error('Main image upload error:', mainImageError.message);
          throw new Error('Failed to upload main image to Supabase');
        }

        console.log('Main image upload success:', mainImageData);

        // Generate URL untuk gambar utama
        const mainImageUrl = `https://dffslhnhihfzeoznvgud.supabase.co/storage/v1/object/public/products/${fileName}`;
        console.log('Main image URL:', mainImageUrl);

        // Upload semua gambar di imageCollection
        const uploadedImages = [];
        for (const img of payload.imageCollection) {
          const imgFileName = `${Date.now()}-${img.file.name}`;
          const { data: imgData, error: imgError } = yield call(
            [supabase.storage.from('products'), 'upload'],
            imgFileName,
            img.file
          );

          if (imgError) {
            console.error(
              `Error uploading ${img.file.name}:`,
              imgError.message
            );
            throw new Error(`Failed to upload image: ${img.file.name}`);
          }

          const imgUrl = `https://dffslhnhihfzeoznvgud.supabase.co/storage/v1/object/public/products/${imgFileName}`;
          console.log(`Image URL for ${img.file.name}:`, imgUrl);

          uploadedImages.push({
            id: imgFileName, // Gunakan nama file sebagai ID unik
            url: imgUrl,
          });
        }

        console.log('Uploaded images:', uploadedImages);

        // Buat objek produk
        const product = {
          ...payload,
          image: mainImageUrl,
          imageCollection: uploadedImages, // Masukkan koleksi gambar
          dateAdded: Date.now(), // Tambahkan waktu pembuatan
        };

        console.log('Final product data:', product);

        // Simpan metadata produk ke Firestore
        yield call(firebase.addProduct, fileName, product);
        yield put(
          addProductSuccess({
            id: fileName,
            ...product,
          })
        );

        // Redirect ke halaman produk admin
        yield handleAction(
          ADMIN_PRODUCTS,
          'Product added successfully!',
          'success'
        );
      } catch (e) {
        console.error('Error adding product:', e.message);
        yield handleError(e);
      }
      break;
    }

    case EDIT_PRODUCT: {
      try {
        yield initRequest();

        const { image, imageCollection } = payload.updates;
        let newUpdates = { ...payload.updates };

        // Logika untuk gambar utama
        if (image.constructor === File && typeof image === 'object') {
          try {
            // Hapus gambar lama dari Supabase
            yield call(
              [supabase.storage.from('products'), 'remove'],
              [payload.id]
            );
          } catch (e) {
            console.error('Failed to delete image from Supabase:', e);
          }

          // Upload gambar baru
          const fileName = `${Date.now()}-${image.name}`;
          const { data, error } = yield call(
            [supabase.storage.from('products'), 'upload'],
            fileName,
            image
          );

          if (error) {
            throw new Error(
              `Failed to upload image to Supabase: ${error.message}`
            );
          }

          // Update URL gambar baru
          const { publicUrl } = supabase.storage
            .from('products')
            .getPublicUrl(fileName);
          newUpdates = { ...newUpdates, image: publicUrl };
        }

        // Logika untuk koleksi gambar
        if (imageCollection.length > 1) {
          const existingUploads = [];
          const newUploads = [];

          imageCollection.forEach((img) => {
            if (img.file) {
              newUploads.push(img);
            } else {
              existingUploads.push(img);
            }
          });

          const imageKeys = yield all(
            newUploads.map(() => `${Date.now()}-${img.file.name}`)
          );
          const imageUrls = yield all(
            newUploads.map((img, i) =>
              call(
                [supabase.storage.from('products'), 'upload'],
                imageKeys[i],
                img.file
              )
            )
          );

          const images = imageUrls.map((result, i) => {
            if (result.error) {
              throw new Error(
                `Failed to upload image: ${result.error.message}`
              );
            }
            const { publicUrl } = supabase.storage
              .from('products')
              .getPublicUrl(imageKeys[i]);
            return { id: imageKeys[i], url: publicUrl };
          });

          newUpdates = {
            ...newUpdates,
            imageCollection: [...existingUploads, ...images],
          };
        } else {
          newUpdates = {
            ...newUpdates,
            imageCollection: [
              { id: new Date().getTime(), url: newUpdates.image },
            ],
          };
        }

        yield call(firebase.editProduct, payload.id, newUpdates);
        yield put(
          editProductSuccess({
            id: payload.id,
            updates: newUpdates,
          })
        );
        yield handleAction(
          ADMIN_PRODUCTS,
          'Item successfully edited',
          'success'
        );
        yield put(setLoading(false));
      } catch (e) {
        yield handleError(e);
        yield handleAction(
          undefined,
          `Item failed to edit: ${e.message}`,
          'error'
        );
      }
      break;
    }

    case REMOVE_PRODUCT: {
      try {
        yield initRequest();
        yield call(firebase.removeProduct, payload);
        yield put(removeProductSuccess(payload));
        yield put(setLoading(false));
        yield handleAction(
          ADMIN_PRODUCTS,
          'Item succesfully removed',
          'success'
        );
      } catch (e) {
        yield handleError(e);
        yield handleAction(
          undefined,
          `Item failed to remove: ${e.message}`,
          'error'
        );
      }
      break;
    }
    case SEARCH_PRODUCT: {
      try {
        yield initRequest();
        // clear search data
        yield put(clearSearchState());

        const state = yield select();
        const result = yield call(firebase.searchProducts, payload.searchKey);

        if (result.products.length === 0) {
          yield handleError({ message: 'No product found.' });
          yield put(clearSearchState());
        } else {
          yield put(
            searchProductSuccess({
              products: result.products,
              lastKey: result.lastKey
                ? result.lastKey
                : state.products.searchedProducts.lastRefKey,
              total: result.total
                ? result.total
                : state.products.searchedProducts.total,
            })
          );
          yield put(setRequestStatus(''));
        }
        yield put(setLoading(false));
      } catch (e) {
        yield handleError(e);
      }
      break;
    }
    default: {
      throw new Error(`Unexpected action type ${type}`);
    }
  }
}

export default productSaga;
