import { useState, useEffect } from 'react';
import {
  IonContent, IonButton, IonInput, IonLabel, IonCard, IonCardContent, IonCardHeader, IonCardSubtitle, IonCardTitle,
  IonAlert, IonText, IonCol, IonGrid, IonRow, IonIcon, IonItem, IonSelect, IonSelectOption, IonSpinner
} from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { User } from '@supabase/supabase-js';
import { supabase } from '../utils/supabaseClient';
import { add } from 'ionicons/icons';

interface Product {
  product_id: string;
  user_id: number;
  product_name: string;
  description: string | null;
  price: number;
  stock_quantity: number;
  category: string | null;
  created_at: string;
  updated_at: string;
  batchdate: string;        // new
  expirationdate: string | null;  // new
}

interface AppUser {
  user_id: number;
  email: string;
  username?: string;
  user_avatar_url?: string;
}

const ProductContainer = () => {
  const history = useHistory();
  const [productName, setProductName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [stockQuantity, setStockQuantity] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const [batchDate, setBatchDate] = useState('');
  const [expirationDate, setExpirationDate] = useState('');
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [categories] = useState<string[]>(['Accessories', 'Clothing', 'Food', 'Drinks', 'Condiments']);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [categoryCounts, setCategoryCounts] = useState<{ category: string; count: number }[]>([]);

  // New states for summary counts
  const [expiredCount, setExpiredCount] = useState(0);
  const [outOfStockCount, setOutOfStockCount] = useState(0);
  const [needRestockCount, setNeedRestockCount] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);

      // Fetch auth user
      const { data: authUserData, error: authError } = await supabase.auth.getUser();
      if (authError) {
        console.error('Error getting auth user:', authError);
        setIsLoading(false);
        return;
      }
      const fetchedUser = authUserData?.user ?? null;
      setAuthUser(fetchedUser);

      // Fetch app user info from your users table
      if (fetchedUser?.email) {
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('user_email', fetchedUser.email)
          .single();

        if (userError) {
          console.error('Error fetching app user:', userError);
          setIsLoading(false);
          return;
        }

        if (userData) {
          setAppUser(userData as AppUser);
        }
      }

      // Fetch all products with needed fields
      const { data: allProducts, error: allError } = await supabase
        .from('products')
        .select('category, stock_quantity, expirationdate');

      if (allError) {
        console.error('Error fetching all products:', allError);
      } else if (allProducts) {
        // Calculate category counts
        const counts = categories.map(cat => ({
          category: cat,
          count: allProducts.filter(p => p.category === cat).length
        }));
        setCategoryCounts(counts);

        // Calculate expired, out of stock, and need restock counts
        const today = new Date();

        const expired = allProducts.filter(p => {
          if (!p.expirationdate) return false;
          return new Date(p.expirationdate) < today;
        }).length;

        const outOfStock = allProducts.filter(p => p.stock_quantity === 0).length;

        const needRestock = allProducts.filter(p => p.stock_quantity > 0 && p.stock_quantity < 5).length;

        setExpiredCount(expired);
        setOutOfStockCount(outOfStock);
        setNeedRestockCount(needRestock);
      }

      setIsLoading(false);
    };

    fetchData();
  }, [categories]);

  const resetForm = () => {
    setProductName('');
    setDescription('');
    setPrice('');
    setStockQuantity('');
    setCategory(null);
    setBatchDate('');
    setExpirationDate('');
  };

  const createProduct = async () => {
    if (!productName.trim()) {
      setAlertMessage('Product name is required');
      setIsAlertOpen(true);
      return;
    }

    if (!price || isNaN(parseFloat(price)) || parseFloat(price) <= 0) {
      setAlertMessage('Please enter a valid price');
      setIsAlertOpen(true);
      return;
    }

    if (!batchDate) {
      setAlertMessage('Batch date is required');
      setIsAlertOpen(true);
      return;
    }

    if (!appUser) {
      setAlertMessage('User information not available');
      setIsAlertOpen(true);
      return;
    }

    const productData = {
      product_name: productName,
      description: description.trim() ? description : null,
      price: parseFloat(price),
      stock_quantity: stockQuantity ? parseInt(stockQuantity) : 0,
      category: category ? category : null,
      user_id: appUser.user_id,
      batchdate: batchDate,
      expirationdate: expirationDate || null
    };

    const { data, error } = await supabase
      .from('products')
      .insert([productData])
      .select('*');

    if (error) {
      console.error('Error creating product:', error);
      setAlertMessage(`Error: ${error.message}`);
      setIsAlertOpen(true);
      return;
    }

    if (data && data[0]) {
      setAlertMessage('Product created successfully!');
      setIsAlertOpen(true);
      resetForm();
      setShowAddForm(false);

      // Refresh category counts and summaries after adding new product
      const { data: updatedProducts, error: updatedError } = await supabase
        .from('products')
        .select('category, stock_quantity, expirationdate');

      if (updatedError) {
        console.error('Error refreshing products:', updatedError);
      } else if (updatedProducts) {
        const counts = categories.map(cat => ({
          category: cat,
          count: updatedProducts.filter(p => p.category === cat).length
        }));
        setCategoryCounts(counts);

        const today = new Date();

        const expired = updatedProducts.filter(p => {
          if (!p.expirationdate) return false;
          return new Date(p.expirationdate) < today;
        }).length;

        const outOfStock = updatedProducts.filter(p => p.stock_quantity === 0).length;

        const needRestock = updatedProducts.filter(p => p.stock_quantity > 0 && p.stock_quantity < 5).length;

        setExpiredCount(expired);
        setOutOfStockCount(outOfStock);
        setNeedRestockCount(needRestock);
      }
    }
  };

  if (isLoading) {
    return (
      <IonContent className="ion-padding">
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
          <IonSpinner name="crescent" />
        </div>
      </IonContent>
    );
  }

  if (!authUser) {
    return (
      <IonContent className="ion-padding">
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>Access Denied</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <IonText>Please log in to manage products.</IonText>
          </IonCardContent>
        </IonCard>
      </IonContent>
    );
  }

  return (
    <IonContent className="ion-padding">
      {!showAddForm ? (
        <>
          {/* Add Product button inside IonCard */}
          <IonCard style={{ margin: '16px' }}>
            <IonCardContent style={{ display: 'flex', justifyContent: 'flex-start' }}>
              <IonButton onClick={() => setShowAddForm(true)}>
                <IonIcon icon={add} slot="start" />
                Add Product
              </IonButton>
            </IonCardContent>
          </IonCard>

          <IonGrid>
            <IonRow>
              {categoryCounts.map(({ category, count }) => (
                <IonCol key={category} size="6" sizeMd="4" sizeLg="3" style={{ marginTop: 16 }}>
                  <IonCard>
                    <IonCardHeader>
                      <IonCardTitle>{category}</IonCardTitle>
                      <IonCardSubtitle>{count} products</IonCardSubtitle>
                    </IonCardHeader>
                  </IonCard>
                </IonCol>
              ))}
            </IonRow>
          </IonGrid>

          {/* New summary cards for expired, out of stock, restock */}
          <IonGrid>
            <IonRow>
              <IonCol size="12" sizeMd="4" style={{ marginTop: 16 }}>
                <IonCard color="danger">
                  <IonCardHeader>
                    <IonCardTitle>Expired Products</IonCardTitle>
                  </IonCardHeader>
                  <IonCardContent>
                    <IonText>{expiredCount}</IonText>
                  </IonCardContent>
                </IonCard>
              </IonCol>
              <IonCol size="12" sizeMd="4" style={{ marginTop: 16 }}>
                <IonCard color="medium">
                  <IonCardHeader>
                    <IonCardTitle>Out of Stocks</IonCardTitle>
                  </IonCardHeader>
                  <IonCardContent>
                    <IonText>{outOfStockCount}</IonText>
                  </IonCardContent>
                </IonCard>
              </IonCol>
              <IonCol size="12" sizeMd="4" style={{ marginTop: 16 }}>
                <IonCard color="warning">
                  <IonCardHeader>
                    <IonCardTitle>Need for Restocking</IonCardTitle>
                  </IonCardHeader>
                  <IonCardContent>
                    <IonText>{needRestockCount}</IonText>
                  </IonCardContent>
                </IonCard>
              </IonCol>
            </IonRow>
          </IonGrid>
        </>
      ) : (
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>Add New Product</IonCardTitle>
            <IonCardSubtitle>
              {appUser?.username ? `Logged in as: ${appUser.username}` : ''}
            </IonCardSubtitle>
          </IonCardHeader>
                    <IonCardContent>
            <IonItem>
              <IonLabel position="floating">Product Name *</IonLabel>
              <IonInput
                value={productName}
                onIonChange={e => setProductName(e.detail.value!)}
                required
              />
            </IonItem>

            <IonItem>
              <IonLabel position="floating">Description</IonLabel>
              <IonInput
                value={description}
                onIonChange={e => setDescription(e.detail.value!)}
              />
            </IonItem>

            <IonItem>
              <IonLabel position="floating">Price *</IonLabel>
              <IonInput
                type="number"
                value={price}
                onIonChange={e => setPrice(e.detail.value!)}
                required
                min="0"
                step="0.01"
              />
            </IonItem>

            <IonItem>
              <IonLabel position="floating">Stock Quantity</IonLabel>
              <IonInput
                type="number"
                value={stockQuantity}
                onIonChange={e => setStockQuantity(e.detail.value!)}
                min="0"
                step="1"
              />
            </IonItem>

            <IonItem>
              <IonLabel>Category</IonLabel>
              <IonSelect
                value={category}
                placeholder="Select Category"
                onIonChange={e => setCategory(e.detail.value)}
              >
                {categories.map(cat => (
                  <IonSelectOption key={cat} value={cat}>
                    {cat}
                  </IonSelectOption>
                ))}
              </IonSelect>
            </IonItem>

            <IonItem>
              <IonLabel position="floating">Batch Date *</IonLabel>
              <IonInput
                type="date"
                value={batchDate}
                onIonChange={e => setBatchDate(e.detail.value!)}
                required
              />
            </IonItem>

            <IonItem>
              <IonLabel position="floating">Expiration Date</IonLabel>
              <IonInput
                type="date"
                value={expirationDate}
                onIonChange={e => setExpirationDate(e.detail.value!)}
              />
            </IonItem>

            <IonButton expand="block" onClick={createProduct} style={{ marginTop: 20 }}>
              Save Product
            </IonButton>
            <IonButton
              expand="block"
              color="medium"
              onClick={() => {
                setShowAddForm(false);
                resetForm();
              }}
              style={{ marginTop: 10 }}
            >
              Cancel
            </IonButton>
          </IonCardContent>
        </IonCard>
      )}

      <IonAlert
        isOpen={isAlertOpen}
        onDidDismiss={() => setIsAlertOpen(false)}
        header={'Notice'}
        message={alertMessage}
        buttons={['OK']}
      />
    </IonContent>
  );
};

export default ProductContainer;

