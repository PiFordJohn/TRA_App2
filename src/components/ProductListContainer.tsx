import { useEffect, useState } from 'react';
import { 
  IonContent, 
  IonHeader, 
  IonPage, 
  IonTitle, 
  IonToolbar, 
  IonList, 
  IonItem, 
  IonLabel, 
  IonSpinner 
} from '@ionic/react';
import { supabase } from '../utils/supabaseClient'; // Adjust the import path as necessary

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
        console.error('Error fetching products:', error);
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
      <IonContent fullscreen>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <IonSpinner name="crescent" />
          </div>
        ) : (
          <IonList>
            {products.map(product => (
              <IonItem key={product.product_id}>
                <IonLabel>
                  <h2>{product.product_name}</h2>
                  <p>Price: ${product.price.toFixed(2)}</p>
                  <p>Stock: {product.stock_quantity}</p>
                </IonLabel>
              </IonItem>
            ))}
          </IonList>
        )}
      </IonContent>
    </IonPage>
  );
};

export default ProductListContainer;
