import {
  IonContent, IonButton, IonInput, IonLabel, IonCard, IonCardContent, IonCardHeader, IonCardSubtitle,
  IonCardTitle, IonAlert, IonText, IonCol, IonGrid, IonRow, IonIcon, IonItem, IonSelect, IonSelectOption, IonSpinner
} from '@ionic/react';
import { useState, useEffect } from 'react';
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
  batchdate: string;
  expirationdate: string | null;
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

  const [expiredCount, setExpiredCount] = useState(0);
  const [outOfStockCount, setOutOfStockCount] = useState(0);
  const [needRestockCount, setNeedRestockCount] = useState(0);
  const [totalProducts, setTotalProducts] = useState(0);

  const [expiredProducts, setExpiredProducts] = useState<Product[]>([]);
  const [outOfStockProducts, setOutOfStockProducts] = useState<Product[]>([]);
  const [needRestockProducts, setNeedRestockProducts] = useState<Product[]>([]);

  const loadProductData = async () => {
    setIsLoading(true);
    const { data: authUserData, error: authError } = await supabase.auth.getUser();
    if (authError) {
      console.error('Error getting auth user:', authError);
      setIsLoading(false);
      return;
    }
    const fetchedUser = authUserData?.user ?? null;
    setAuthUser(fetchedUser);

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
      if (userData) setAppUser(userData as AppUser);
    }

    const { data: allProducts, error: allError } = await supabase.from('products').select('*');
    if (allError) {
      console.error('Error fetching all products:', allError);
    } else if (allProducts) {
      setTotalProducts(allProducts.length);

      const counts = categories.map(cat => ({
        category: cat,
        count: allProducts.filter((p: Product) => p.category === cat).length
      }));
      setCategoryCounts(counts);

      const today = new Date();

      const expiredList = allProducts.filter(p =>
        p.expirationdate ? new Date(p.expirationdate) < today : false
      );
      setExpiredProducts(expiredList);
      setExpiredCount(expiredList.length);

      const outOfStockList = allProducts.filter(p => p.stock_quantity === 0);
      setOutOfStockProducts(outOfStockList);
      setOutOfStockCount(outOfStockList.length);

      const needRestockList = allProducts.filter(p => p.stock_quantity > 0 && p.stock_quantity < 5);
      setNeedRestockProducts(needRestockList);
      setNeedRestockCount(needRestockList.length);
    }

    setIsLoading(false);
  };

  useEffect(() => {
    loadProductData();
    const productSubscription = supabase
      .channel('public:products')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => {
        loadProductData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(productSubscription);
    };
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

    const { data, error } = await supabase.from('products').insert([productData]).select('*');
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
    }
  };

  const handleSummaryClick = (type: 'expired' | 'outOfStock' | 'needRestock') => {
    let products: Product[] = [];
    switch (type) {
      case 'expired':
        products = expiredProducts;
        break;
      case 'outOfStock':
        products = outOfStockProducts;
        break;
      case 'needRestock':
        products = needRestockProducts;
        break;
    }

    if (products.length === 0) {
      setAlertMessage('Nothing to display.');
    } else {
      setAlertMessage(products.map(p => p.product_name).join(', '));
    }
    setIsAlertOpen(true);
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
          <IonGrid>
            <IonRow>
              <IonCol size="12" sizeMd="6">
                <IonCard>
                  <IonCardContent>
                    <IonButton onClick={() => setShowAddForm(true)}>
                      <IonIcon icon={add} slot="start" />
                      Add Product
                    </IonButton>
                  </IonCardContent>
                </IonCard>
              </IonCol>
              <IonCol size="12" sizeMd="6">
                <IonCard color="primary">
                  <IonCardHeader>
                    <IonCardTitle>Total Products</IonCardTitle>
                    <IonCardSubtitle>{totalProducts}</IonCardSubtitle>
                  </IonCardHeader>
                </IonCard>
              </IonCol>
            </IonRow>
          </IonGrid>

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

          <IonGrid>
            <IonRow>
              <IonCol size="12" sizeMd="4">
                <IonButton expand="block" color="danger" onClick={() => handleSummaryClick('expired')}>
                  <IonCardTitle>Expired</IonCardTitle>
                  <IonCardSubtitle color="light">{expiredCount}</IonCardSubtitle>
                </IonButton>
              </IonCol>
              <IonCol size="12" sizeMd="4">
                <IonButton expand="block" color="medium" onClick={() => handleSummaryClick('outOfStock')}>
                  <IonCardTitle>Out of Stock</IonCardTitle>
                  <IonCardSubtitle color="light">{outOfStockCount}</IonCardSubtitle>
                </IonButton>
              </IonCol>
              <IonCol size="12" sizeMd="4">
                <IonButton expand="block" color="warning" onClick={() => handleSummaryClick('needRestock')}>
                  <IonCardTitle>Need Restock</IonCardTitle>
                  <IonCardSubtitle color="light">{needRestockCount}</IonCardSubtitle>
                </IonButton>
              </IonCol>
            </IonRow>
          </IonGrid>
        </>
      ) : (
        // Add Product Form goes here
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>Add New Product</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            {/* Input fields */}
            {/* ... (omitted here for brevity, but should include form fields from your original code) */}
          </IonCardContent>
        </IonCard>
      )}

      <IonAlert
        isOpen={isAlertOpen}
        onDidDismiss={() => setIsAlertOpen(false)}
        header="Notice"
        message={alertMessage}
        buttons={['OK']}
      />
    </IonContent>
  );
};

export default ProductContainer;
