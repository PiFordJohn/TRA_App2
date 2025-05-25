import {
  IonContent, IonHeader, IonPage, IonTitle, IonToolbar,
  IonSpinner, IonGrid, IonRow, IonCol, IonText,
  IonRefresher, IonRefresherContent
} from '@ionic/react';
import { RefresherEventDetail } from '@ionic/core';
import { useEffect, useState } from 'react';
import { supabase } from '../utils/supabaseClient';

interface Product {
  product_id: string;
  product_name: string;
  price: number;
  stock_quantity: number;
  updated_at: string;
  category: string | null;
}

const ProductListContainer: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('category', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching products:', error.message);
    } else {
      setProducts(data as Product[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProducts();

    const subscription = supabase
      .channel('public:products')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'products' },
        payload => {
          setProducts(currentProducts => {
            const newProduct = payload.new as Product;
            const oldProduct = payload.old as Product;

            switch (payload.eventType) {
              case 'INSERT':
                return [newProduct, ...currentProducts];
              case 'UPDATE':
                return currentProducts.map(prod =>
                  prod.product_id === newProduct.product_id ? newProduct : prod
                );
              case 'DELETE':
                return currentProducts.filter(prod => prod.product_id !== oldProduct.product_id);
              default:
                return currentProducts;
            }
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  const handleRefresh = async (event: CustomEvent<RefresherEventDetail>) => {
    await fetchProducts();
    event.detail.complete(); // finish the refresher UI
  };

  const groupedByCategory = products.reduce((groups: Record<string, Product[]>, product) => {
    const category = product.category || 'Uncategorized';
    if (!groups[category]) groups[category] = [];
    groups[category].push(product);
    return groups;
  }, {});

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Product List</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen className="ion-padding">
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent pullingText="Pull to refresh" refreshingSpinner="circles" />
        </IonRefresher>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <IonSpinner name="crescent" />
          </div>
        ) : products.length === 0 ? (
          <IonText>No products found.</IonText>
        ) : (
          Object.entries(groupedByCategory).map(([category, categoryProducts]) => (
            <div key={category} style={{ marginBottom: '2rem' }}>
              <h2>{category}</h2>
              <IonGrid>
                <IonRow>
                  <IonCol><strong>Name</strong></IonCol>
                  <IonCol><strong>Price</strong></IonCol>
                  <IonCol><strong>Stock</strong></IonCol>
                  <IonCol><strong>Last Updated</strong></IonCol>
                </IonRow>
                {categoryProducts.map(product => (
                  <IonRow key={product.product_id}>
                    <IonCol>{product.product_name}</IonCol>
                    <IonCol>${product.price.toFixed(2)}</IonCol>
                    <IonCol>{product.stock_quantity}</IonCol>
                    <IonCol>{product.updated_at ? new Date(product.updated_at).toLocaleString() : 'N/A'}</IonCol>
                  </IonRow>
                ))}
              </IonGrid>
            </div>
          ))
        )}
      </IonContent>
    </IonPage>
  );
};

export default ProductListContainer;
