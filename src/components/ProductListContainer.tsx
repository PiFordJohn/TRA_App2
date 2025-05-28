import { useState, useEffect } from 'react';
import {
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonCardContent,
  IonGrid,
  IonRow,
  IonCol,
  IonButton,
  IonIcon,
  IonSpinner,
} from '@ionic/react';
import { pencil, trash } from 'ionicons/icons';
import { supabase } from '../utils/supabaseClient';

interface Product {
  product_id: string;
  product_name: string;
  description: string | null;
  price: number;
  stock_quantity: number;
  category: string | null;
  batchdate: string;
  expirationdate: string | null;
  created_at: string;
  updated_at: string | null;
}

const ProductListContainer = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProducts = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching products:', error);
    } else {
      setProducts(data as Product[]);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchProducts();

    const subscription = supabase
      .channel('public:products')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'products' },
        () => {
          fetchProducts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  const handleDelete = async (product_id: string) => {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('product_id', product_id);

    if (error) {
      console.error('Error deleting product:', error);
    } else {
      fetchProducts();
    }
  };

  if (isLoading) {
    return (
      <IonContent className="ion-padding">
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100%',
          }}
        >
          <IonSpinner name="crescent" />
        </div>
      </IonContent>
    );
  }

  return (
    <IonContent className="ion-padding">
      <IonGrid>
        <IonRow>
          {products.map((product) => (
            <IonCol size="12" sizeMd="6" sizeLg="4" key={product.product_id}>
              <IonCard>
                <IonCardHeader>
                  <IonCardTitle>{product.product_name}</IonCardTitle>
                  <IonCardSubtitle>
                    {product.category || 'Uncategorized'}
                  </IonCardSubtitle>
                </IonCardHeader>
                <IonCardContent>
                  <p><strong>Price:</strong> ₱{product.price.toFixed(2)}</p>
                  <p><strong>Stock:</strong> {product.stock_quantity}</p>
                  <p><strong>Batch:</strong> {product.batchdate}</p>
                  {product.expirationdate && (
                    <p><strong>Expires:</strong> {product.expirationdate}</p>
                  )}
                  {product.description && (
                    <p><strong>Description:</strong> {product.description}</p>
                  )}
                  <p><strong>Created At:</strong> {new Date(product.created_at).toLocaleString()}</p>
                  {product.updated_at && (
                    <p><strong>Last Updated:</strong> {new Date(product.updated_at).toLocaleString()}</p>
                  )}

                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'flex-end',
                      gap: '8px',
                      marginTop: '10px',
                    }}
                  >
                    <IonButton size="small" fill="clear" color="warning">
                      <IonIcon icon={pencil} />
                    </IonButton>
                    <IonButton
                      size="small"
                      fill="clear"
                      color="danger"
                      onClick={() => handleDelete(product.product_id)}
                    >
                      <IonIcon icon={trash} />
                    </IonButton>
                  </div>
                </IonCardContent>
              </IonCard>
            </IonCol>
          ))}
        </IonRow>
      </IonGrid>
    </IonContent>
  );
};

export default ProductListContainer;
