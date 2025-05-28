import { useState, useEffect } from 'react';
import {
  IonContent, IonButton, IonInput, IonLabel, IonCard, IonCardContent, IonCardHeader, IonCardSubtitle, IonCardTitle,
  IonAlert, IonText, IonCol, IonGrid, IonRow, IonIcon, IonItem, IonSelect, IonSelectOption, IonSpinner
} from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { User } from '@supabase/supabase-js';
import { supabase } from '../utils/supabaseClient';
import { add } from 'ionicons/icons';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer
} from 'recharts';


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

  // Summary counts and product lists for modal display
  const [expiredCount, setExpiredCount] = useState(0);
  const [outOfStockCount, setOutOfStockCount] = useState(0);
  const [needRestockCount, setNeedRestockCount] = useState(0);

  const [expiredProducts, setExpiredProducts] = useState<Product[]>([]);
  const [outOfStockProducts, setOutOfStockProducts] = useState<Product[]>([]);
  const [needRestockProducts, setNeedRestockProducts] = useState<Product[]>([]);

  // Function to load products and update counts + lists
  const loadProductData = async () => {
    setIsLoading(true);

    // Get auth user
    const { data: authUserData, error: authError } = await supabase.auth.getUser();
    if (authError) {
      console.error('Error getting auth user:', authError);
      setIsLoading(false);
      return;
    }
    const fetchedUser = authUserData?.user ?? null;
    setAuthUser(fetchedUser);

    // Get app user
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
      .select('*'); // get all fields so we can show names

    if (allError) {
      console.error('Error fetching all products:', allError);
    } else if (allProducts) {
      // Calculate category counts
      const counts = categories.map(cat => ({
        category: cat,
        count: allProducts.filter((p: Product) => p.category === cat).length
      }));
      setCategoryCounts(counts);

      const today = new Date();

      // Expired products
      const expiredList = allProducts.filter((p: Product) => {
        if (!p.expirationdate) return false;
        return new Date(p.expirationdate) < today;
      });
      setExpiredProducts(expiredList);
      setExpiredCount(expiredList.length);

      // Out of stock products
      const outOfStockList = allProducts.filter((p: Product) => p.stock_quantity === 0);
      setOutOfStockProducts(outOfStockList);
      setOutOfStockCount(outOfStockList.length);

      // Need restock products (stock > 0 but < 5)
      const needRestockList = allProducts.filter((p: Product) => p.stock_quantity > 0 && p.stock_quantity < 5);
      setNeedRestockProducts(needRestockList);
      setNeedRestockCount(needRestockList.length);
    }

    setIsLoading(false);
  };

  useEffect(() => {
    loadProductData();

    // Setup realtime subscription for changes on products table
    const productSubscription = supabase
      .channel('public:products')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'products' },
        () => {
          loadProductData(); // refresh data on any product insert/update/delete
        }
      )
      .subscribe();

    // Cleanup subscription on unmount
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
      // loadProductData() will be called automatically by realtime subscription
    }
  };

  // Handle alert display for product lists when user clicks the summary cards
  const handleSummaryClick = (type: 'expired' | 'outOfStock' | 'needRestock') => {
    let products: Product[] = [];
    let title = '';
    switch (type) {
      case 'expired':
        products = expiredProducts;
        title = 'Expired Products';
        break;
      case 'outOfStock':
        products = outOfStockProducts;
        title = 'Out of Stock Products';
        break;
      case 'needRestock':
        products = needRestockProducts;
        title = 'Products Need Restocking';
        break;
    }

    if (products.length === 0) {
      setAlertMessage('Nothing to display.');
    } else {
      // List product names separated by commas
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
          {/* Add Product button inside IonCard */}
          <IonCard style={{ margin: '16px' }}>
            <IonCardContent style={{ display: 'flex', justifyContent: 'flex-start' }}>
              <IonButton onClick={() => setShowAddForm(true)}>
                <IonIcon icon={add} slot="start" />
                Add Product
              </IonButton>
            </IonCardContent>
          </IonCard>

          {/* Summary cards now act as buttons */}
          <IonGrid>
            <IonRow>
              <IonCol size="12" sizeMd="4" style={{ marginTop: 16 }}>
                <IonButton
                  expand="block"
                  color="danger"
                  onClick={() => handleSummaryClick('expired')}
                >
                  <IonCardTitle>Expired Products</IonCardTitle>
                  <IonCardSubtitle color="light">{expiredCount}</IonCardSubtitle>
                </IonButton>
              </IonCol>
              <IonCol size="12" sizeMd="4" style={{ marginTop: 16 }}>
                <IonButton
                  expand="block"
                  color="medium"
                  onClick={() => handleSummaryClick('outOfStock')}
                >
                  <IonCardTitle>Out of Stocks</IonCardTitle>
                  <IonCardSubtitle color="light">{outOfStockCount}</IonCardSubtitle>
                </IonButton>
              </IonCol>
              <IonCol size="12" sizeMd="4" style={{ marginTop: 16 }}>
                <IonButton
                  expand="block"
                  color="warning"
                  onClick={() => handleSummaryClick('needRestock')}
                >
                  <IonCardTitle>Need for Restocking</IonCardTitle>
                  <IonCardSubtitle color="light">{needRestockCount}</IonCardSubtitle>
                </IonButton>
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

  {/* 📊 Bar Chart of Category Counts */}
  <IonRow>
    <IonCol size="12">
      <IonCard>
        <IonCardHeader>
          <IonCardTitle>Category Distribution</IonCardTitle>
        </IonCardHeader>
        <IonCardContent style={{ height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={categoryCounts}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="category" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#3880ff" />
            </BarChart>
          </ResponsiveContainer>
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
          </IonCardHeader>
          <IonCardContent>
            <IonItem>
              <IonLabel position="floating">Product Name*</IonLabel>
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
              <IonLabel position="floating">Price*</IonLabel>
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
              <IonLabel position="floating">Batch Date*</IonLabel>
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

            <IonButton expand="block" onClick={createProduct} style={{ marginTop: 16 }}>
              Create Product
            </IonButton>
            <IonButton expand="block" color="medium" onClick={() => setShowAddForm(false)} style={{ marginTop: 8 }}>
              Cancel
            </IonButton>
          </IonCardContent>
        </IonCard>
      )}

      <IonAlert
        isOpen={isAlertOpen}
        onDidDismiss={() => setIsAlertOpen(false)}
        header="Info"
        message={alertMessage}
        buttons={['OK']}
      />
    </IonContent>
  );
};

export default ProductContainer;

