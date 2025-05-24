import { useState, useEffect, ChangeEvent } from 'react';
import { 
  IonContent, IonButton, IonInput, IonLabel, IonCard, IonCardContent, IonCardHeader, IonCardSubtitle, IonCardTitle,
  IonAlert, IonText, IonCol, IonGrid, IonRow, IonIcon, IonItem, IonSelect, IonSelectOption, IonThumbnail, IonBadge, IonSpinner
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
  image_url: string;
  created_at: string;
  updated_at: string;
}

interface AppUser  {
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
  const [imageUrl, setImageUrl] = useState('');
  const [authUser , setAuthUser ] = useState<User | null>(null);
  const [appUser , setAppUser ] = useState<AppUser  | null>(null);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [categories] = useState<string[]>(['Electronics', 'Clothing', 'Food', 'Other']);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);

      // Fetch authenticated user
      const { data: authUserData, error: authError } = await supabase.auth.getUser();
      if (authError) {
        console.error('Error getting auth user:', authError);
        setIsLoading(false);
        return;
      }
      const fetchedUser = authUserData?.user ?? null;
      setAuthUser(fetchedUser);

      if (fetchedUser?.email) {
        // Fetch app user info by email
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
          setAppUser (userData as AppUser );
        } else {
          console.warn('No user data found for email:', fetchedUser.email);
        }
      } else {
        console.warn('No authenticated user found.');
      }

      // Fetch products list
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
    };

    fetchData();
  }, []);

  const resetForm = () => {
    setProductName('');
    setDescription('');
    setPrice('');
    setStockQuantity('');
    setCategory(null);
    setImageUrl('');
  };

  // Implement image upload to Supabase storage bucket "product-images"
  async function handleImageUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }

    // Optional: Validate file type and size here

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { data, error } = await supabase.storage
        .from('product-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Error uploading image:', error);
        setAlertMessage('Error uploading image: ' + error.message);
        setIsAlertOpen(true);
        return;
      }

      // Get public URL for the uploaded image
      const { data: publicUrlData } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      setImageUrl(publicUrlData.publicUrl);

    } catch (uploadError) {
      console.error('Upload error:', uploadError);
      setAlertMessage('Upload error: ' + (uploadError as Error).message);
      setIsAlertOpen(true);
    }
  }

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

    if (!appUser ) {
      setAlertMessage('User  information not available');
      setIsAlertOpen(true);
      return;
    }

    const productData = {
      product_name: productName,
      description: description.trim() ? description : null,
      price: parseFloat(price),
      stock_quantity: stockQuantity ? parseInt(stockQuantity) : 0,
      category: category ? category : null,
      image_url: imageUrl || 'https://via.placeholder.com/150',
      user_id: appUser .user_id
    };

    console.log('Creating product with:', productData);

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

  if (!authUser ) {
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
            {appUser ?.username ? `Logged in as: ${appUser .username}` : ''}
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
            <IonRow>
              <IonCol size="12">
                <IonItem>
                  <IonLabel>Product Image</IonLabel>
                  <input 
                    type="file" 
                    onChange={handleImageUpload} 
                    accept="image/*"
                    style={{ marginLeft: '10px' }}
                  />
                </IonItem>
                {imageUrl && (
                  <IonThumbnail style={{ margin: '10px' }}>
                    <img src={imageUrl} alt="Product preview" />
                  </IonThumbnail>
                )}
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

      {/* Product list rendering */}
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
                    <IonCol size="3">
                      <IonThumbnail>
                        <img src={product.image_url} alt={product.product_name} />
                      </IonThumbnail>
                    </IonCol>
                    <IonCol>
                      <IonCardTitle>{product.product_name}</IonCardTitle>
                      <IonCardSubtitle>
                        <IonBadge color="primary" style={{ marginRight: '6px' }}>
                          <IonIcon icon={cash} />
                          ${product.price.toFixed(2)}
                        </IonBadge>
                        <IonBadge color={product.stock_quantity > 0 ? "success" : "danger"} style={{ marginRight: '6px' }}>
                          {product.stock_quantity} in stock
                        </IonBadge>
                        {product.category && (
                          <IonBadge color="tertiary">{product.category}</IonBadge>
                        )}
                      </IonCardSubtitle>
                    </IonCol>
                  </IonRow>
                </IonGrid>
              </IonCardHeader>
              <IonCardContent>
                <IonText>
                  <p>{product.description}</p>
                </IonText>
                <IonText color="medium">
                  <small>Last updated: {new Date(product.updated_at).toLocaleString()}</small>
                </IonText>
              </IonCardContent>
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
