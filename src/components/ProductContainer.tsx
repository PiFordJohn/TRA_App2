import { useState, useEffect } from 'react';
import {
  IonContent, IonButton, IonInput, IonLabel, IonCard, IonCardContent, IonCardHeader, IonCardSubtitle, IonCardTitle,
  IonAlert, IonText, IonCol, IonGrid, IonRow, IonIcon, IonItem, IonSelect, IonSelectOption, IonSpinner
} from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { User } from '@supabase/supabase-js';
import { supabase } from '../utils/supabaseClient';
import { add, create, trash } from 'ionicons/icons';

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
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [categories] = useState<string[]>(['Accessories', 'Clothing', 'Food', 'Drinks', 'Condiments']);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [categoryCounts, setCategoryCounts] = useState<{ category: string; count: number }[]>([]);

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

      // Fetch product counts per category
      const { data: allProducts, error: allError } = await supabase
        .from('products')
        .select('category');

      if (allError) {
        console.error('Error fetching all products:', allError);
      } else if (allProducts) {
        const counts = categories.map(cat => ({
          category: cat,
          count: allProducts.filter(p => p.category === cat).length
        }));
        setCategoryCounts(counts);
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
      user_id: appUser.user_id
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

      // Refresh category counts after adding new product
      const { data: updatedProducts, error: updatedError } = await supabase
        .from('products')
        .select('category');

      if (updatedError) {
        console.error('Error refreshing products:', updatedError);
      } else if (updatedProducts) {
        const counts = categories.map(cat => ({
          category: cat,
          count: updatedProducts.filter(p => p.category === cat).length
        }));
        setCategoryCounts(counts);
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
          <div style={{ padding: '16px', display: 'flex', justifyContent: 'flex-start', gap: '16px' }}>
            <IonButton onClick={() => setShowAddForm(true)}>
              <IonIcon icon={add} slot="start" />
              Add Product
            </IonButton>
            <IonButton color="warning" onClick={() => history.push('/TRA_App2/app/home/ProductListLogs')}>
              <IonIcon icon={create} slot="start" />
              Update Product
            </IonButton>
            <IonButton color="danger" onClick={() => history.push('/TRA_App2/app/home/ProductListLogs')}>
              <IonIcon icon={trash} slot="start" />
              Delete Product
            </IonButton>
          </div>

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
            <IonGrid>
              <IonRow>
                <IonCol size="12" sizeMd="6">
                  <IonItem>
                    <IonLabel position="floating">Product Name*</IonLabel><br></br>
                    <IonInput
                      value={productName}
                      onIonChange={e => setProductName(e.detail.value!)}
                      placeholder="Enter product name"
                    />
                  </IonItem>
                </IonCol>
                <IonCol size="12" sizeMd="6">
                  <IonItem>
                    <IonLabel position="floating">Price*</IonLabel><br></br>
                    <IonInput
                      type="number"
                      value={price}
                      onIonChange={e => setPrice(e.detail.value!)}
                      placeholder="0.00"
                    />
                  </IonItem>
                </IonCol>
              </IonRow>
              <IonRow>
                <IonCol size="12" sizeMd="6">
                  <IonItem>
                    <IonLabel position="floating">Stock Quantity</IonLabel><br></br>
                    <IonInput
                      type="number"
                      value={stockQuantity}
                      onIonChange={e => setStockQuantity(e.detail.value!)}
                      placeholder="0"
                    />
                  </IonItem>
                </IonCol>
                <IonCol size="12" sizeMd="6">
                  <IonItem>
                    <IonLabel>Category</IonLabel><br></br>
                    <IonSelect
                      value={category}
                      onIonChange={e => setCategory(e.detail.value)}
                      placeholder="Select category"
                    >
                      {categories.map(cat => (
                        <IonSelectOption key={cat} value={cat}>{cat}</IonSelectOption>
                      ))}
                    </IonSelect>
                  </IonItem>
                </IonCol>
              </IonRow>
              <IonRow>
                <IonCol size="12">
                  <IonItem>
                    <IonLabel position="floating">Description</IonLabel>
                    <IonInput
                      value={description}
                      onIonChange={e => setDescription(e.detail.value!)}
                      placeholder="Product description"
                    />
                  </IonItem>
                </IonCol>
              </IonRow>
            </IonGrid>
          </IonCardContent>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px' }}>
            <IonButton onClick={createProduct}>
              <IonIcon icon={add} slot="start" />
              Add Product
            </IonButton>
            <IonButton color="medium" onClick={() => setShowAddForm(false)}>
              Cancel
            </IonButton>
          </div>
        </IonCard>
      )}

      <IonAlert
        isOpen={isAlertOpen}
        onDidDismiss={() => setIsAlertOpen(false)}
        header={'Notification'}
        message={alertMessage}
        buttons={['OK']}
      />
    </IonContent>
  );
};

export default ProductContainer;
