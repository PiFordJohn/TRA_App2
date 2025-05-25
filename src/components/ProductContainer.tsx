import { useState, useEffect } from 'react';
import {
  IonContent, IonButton, IonInput, IonLabel, IonCard, IonCardContent, IonCardHeader, IonCardSubtitle, IonCardTitle,
  IonAlert, IonText, IonCol, IonGrid, IonRow, IonIcon, IonItem, IonSelect, IonSelectOption, IonBadge, IonSpinner
} from '@ionic/react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../utils/supabaseClient';
import { pencil, add, cash } from 'ionicons/icons';

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
  const [products, setProducts] = useState<Product[]>([]);
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

  useEffect(() => {
    let subscription: any;

    const fetchData = async () => {
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
        if (userData) {
          setAppUser(userData as AppUser);
        }
      }

      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (productsError) {
        console.error('Error fetching products:', productsError);
      } else if (productsData) {
        setProducts(productsData as Product[]);
      }

      setIsLoading(false);

      subscription = supabase
        .channel('public:products')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'products' },
          (payload) => {
            setProducts((current) => [payload.new as Product, ...current]);
          }
        )
        .subscribe();
    };

    fetchData();

    return () => {
      if (subscription) {
        supabase.removeChannel(subscription);
      }
    };
  }, []);

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
      setProducts([data[0] as Product, ...products]);
      setAlertMessage('Product created successfully!');
      setIsAlertOpen(true);
      resetForm();
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
                  <IonLabel position="floating">Product Name*</IonLabel>
                  <IonInput
                    value={productName}
                    onIonChange={e => setProductName(e.detail.value!)}
                    placeholder="Enter product name"
                  />
                </IonItem>
              </IonCol>
              <IonCol size="12" sizeMd="6">
                <IonItem>
                  <IonLabel position="floating">Price*</IonLabel>
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
                  <IonLabel position="floating">Stock Quantity</IonLabel>
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
                  <IonLabel>Category</IonLabel>
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
        <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '16px' }}>
          <IonButton onClick={createProduct} expand="block">
            <IonIcon icon={add} slot="start" />
            Add Product
          </IonButton>
        </div>
      </IonCard>

      <IonGrid className="ion-margin-top">
        <IonRow>
          <IonCol>
            <h2>Product List</h2>
          </IonCol>
        </IonRow>
        {products.length === 0 ? (
          <IonCard>
            <IonCardContent>
              <IonText>No products found. Add your first product above.</IonText>
            </IonCardContent>
          </IonCard>
        ) : (
          products.map(product => (
            <IonCard key={product.product_id} className="ion-margin-top">
              <IonCardHeader>
                <IonGrid>
                  <IonRow className="ion-align-items-center">
                    <IonCol>
                      <IonCardTitle>{product.product_name}</IonCardTitle>
                      <IonCardSubtitle>
                        <IonBadge color="primary" style={{ marginRight: '6px' }}>
                          <IonIcon icon={cash} />
                          ${product.price.toFixed(2)}
                        </IonBadge>
                        <IonBadge color="secondary">
                          Stock: {product.stock_quantity}
                        </IonBadge>
                      </IonCardSubtitle>
                      <p>{product.description}</p>
                    </IonCol>
                    <IonCol size="1" className="ion-text-right">
                      <IonButton fill="clear" size="small" color="medium">
                        <IonIcon icon={pencil} />
                      </IonButton>
                    </IonCol>
                  </IonRow>
                </IonGrid>
              </IonCardHeader>
            </IonCard>
          ))
        )}
      </IonGrid>

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
