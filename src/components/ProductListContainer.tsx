import { useEffect, useState } from 'react';
import {
  IonContent, IonHeader, IonPage, IonTitle, IonToolbar,
  IonSpinner, IonGrid, IonRow, IonCol, IonText
} from '@ionic/react';
import { supabase } from '../utils/supabaseClient';

interface Product {
  product_id: string;
  product_name: string;
  price: number;
  stock_quantity: number;
}

const ProductListContainer: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching products:', error.message);
      } else {
        setProducts(data as Product[]);
      }
      setLoading(false);
    };

    fetchProducts();
  }, []);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Product List</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen className="ion-padding">
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <IonSpinner name="crescent" />
          </div>
        ) : products.length === 0 ? (
          <IonText>No products found.</IonText>
        ) : (
          <IonGrid>
            <IonRow>
              <IonCol><strong>Name</strong></IonCol>
              <IonCol><strong>Price</strong></IonCol>
              <IonCol><strong>Stock</strong></IonCol>
            </IonRow>
            {products.map(product => (
              <IonRow key={product.product_id}>
                <IonCol>{product.product_name}</IonCol>
                <IonCol>${product.price.toFixed(2)}</IonCol>
                <IonCol>{product.stock_quantity}</IonCol>
              </IonRow>
            ))}
          </IonGrid>
        )}
      </IonContent>
    </IonPage>
  );
};

export default ProductListContainer;
