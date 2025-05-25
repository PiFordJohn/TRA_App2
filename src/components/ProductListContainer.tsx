import {
  IonContent, IonHeader, IonPage, IonTitle, IonToolbar,
  IonSpinner, IonGrid, IonRow, IonCol, IonText,
  IonRefresher, IonRefresherContent, IonButton, IonCard, IonCardContent,
  IonModal, IonInput, IonItem, IonLabel
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
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);

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
    event.detail.complete();
  };

  const handleDeleteProduct = async () => {
    if (!productToDelete) return;
    await supabase.from('products').delete().eq('product_id', productToDelete);
    setShowDeleteModal(false);
    setProductToDelete(null);
  };

  const handleEditChange = (field: keyof Product, value: any) => {
    if (editProduct) setEditProduct({ ...editProduct, [field]: value });
  };

  const handleSaveEdit = async () => {
    if (!editProduct) return;
    const { product_id, ...rest } = editProduct;
    await supabase.from('products').update(rest).eq('product_id', product_id);
    setEditProduct(null);
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
              <IonText color="primary">
                <h2>{category}</h2>
              </IonText>
              {categoryProducts.map(product => (
                <IonCard key={product.product_id}>
                  <IonCardContent>
                    <IonGrid>
                      <IonRow>
                        <IonCol size="6"><strong>Name:</strong> {product.product_name}</IonCol>
                        <IonCol size="6"><strong>Price:</strong> ${product.price.toFixed(2)}</IonCol>
                      </IonRow>
                      <IonRow>
                        <IonCol size="6"><strong>Stock:</strong> {product.stock_quantity}</IonCol>
                        <IonCol size="6"><strong>Updated:</strong> {product.updated_at ? new Date(product.updated_at).toLocaleString() : 'N/A'}</IonCol>
                      </IonRow>
                      <IonRow>
                        <IonCol>
                          <IonButton size="small" onClick={() => setEditProduct(product)}>Update</IonButton>
                          <IonButton size="small" color="danger" onClick={() => {
                            setProductToDelete(product.product_id);
                            setShowDeleteModal(true);
                          }}>Delete</IonButton>
                        </IonCol>
                      </IonRow>
                    </IonGrid>
                  </IonCardContent>
                </IonCard>
              ))}
            </div>
          ))
        )}

        {/* Edit Product Modal */}
        {editProduct && (
          <>
            <div style={{
              position: 'fixed',
              top: 0, left: 0, right: 0, bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              zIndex: 998
            }} onClick={() => setEditProduct(null)} />

            <div style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 999,
              width: '90%',
              maxWidth: '400px'
            }}>
              <IonCard>
                <IonCardContent>
                  <h3 style={{ textAlign: 'center' }}>Edit Product</h3>
                  <IonItem>
                    <IonLabel position="floating">Product Name</IonLabel>
                    <IonInput value={editProduct.product_name} onIonChange={e => handleEditChange('product_name', e.detail.value!)} />
                  </IonItem>
                  <IonItem>
                    <IonLabel position="floating">Price</IonLabel>
                    <IonInput type="number" value={editProduct.price} onIonChange={e => handleEditChange('price', parseFloat(e.detail.value!))} />
                  </IonItem>
                  <IonItem>
                    <IonLabel position="floating">Stock Quantity</IonLabel>
                    <IonInput type="number" value={editProduct.stock_quantity} onIonChange={e => handleEditChange('stock_quantity', parseInt(e.detail.value!))} />
                  </IonItem>
                  <IonItem>
                    <IonLabel position="floating">Category</IonLabel>
                    <IonInput value={editProduct.category ?? ''} onIonChange={e => handleEditChange('category', e.detail.value!)} />
                  </IonItem>
                  <IonButton expand="block" onClick={handleSaveEdit}>Save Changes</IonButton>
                  <IonButton expand="block" color="medium" onClick={() => setEditProduct(null)}>Cancel</IonButton>
                </IonCardContent>
              </IonCard>
            </div>
          </>
        )}

        {/* Delete Confirmation Modal */}
        <IonModal isOpen={showDeleteModal} onDidDismiss={() => setShowDeleteModal(false)}>
          <IonCard>
            <IonCardContent>
              <p>Are you sure you want to delete this product?</p>
              <IonButton color="danger" expand="block" onClick={handleDeleteProduct}>Yes, Delete</IonButton>
              <IonButton expand="block" onClick={() => setShowDeleteModal(false)}>Cancel</IonButton>
            </IonCardContent>
          </IonCard>
        </IonModal>
      </IonContent>
    </IonPage>
  );
};

export default ProductListContainer;
