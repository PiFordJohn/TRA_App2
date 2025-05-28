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
  IonModal,
  IonInput,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonLabel,
  IonItem,
  IonText,
} from '@ionic/react';
import { pencil, trash, close } from 'ionicons/icons';
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

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const [editForm, setEditForm] = useState({
    product_name: '',
    description: '',
    price: 0,
    stock_quantity: 0,
    category: '',
    batchdate: '',
    expirationdate: '',
  });

  const [password, setPassword] = useState('');
  const [deleteError, setDeleteError] = useState('');

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

    const channel = supabase
      .channel('realtime-products')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'products' },
        (payload) => {
          console.log('Realtime event:', payload.eventType);
          fetchProducts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const openEditModal = (product: Product) => {
    setSelectedProduct(product);
    setEditForm({
      product_name: product.product_name,
      description: product.description || '',
      price: product.price,
      stock_quantity: product.stock_quantity,
      category: product.category || '',
      batchdate: product.batchdate,
      expirationdate: product.expirationdate || '',
    });
    setEditModalOpen(true);
  };

  const handleUpdate = async () => {
    if (!selectedProduct) return;

    const { error } = await supabase
      .from('products')
      .update({
        product_name: editForm.product_name,
        description: editForm.description,
        price: editForm.price,
        stock_quantity: editForm.stock_quantity,
        category: editForm.category,
        batchdate: editForm.batchdate,
        expirationdate: editForm.expirationdate || null,
        updated_at: new Date().toISOString(),
      })
      .eq('product_id', selectedProduct.product_id);

    if (error) {
      console.error('Error updating product:', error);
    } else {
      setEditModalOpen(false);
      setSelectedProduct(null);
    }
  };

  const openDeleteModal = (product: Product) => {
    setSelectedProduct(product);
    setPassword('');
    setDeleteError('');
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (password !== 'your_password') {
      setDeleteError('Incorrect password');
      return;
    }

    if (!selectedProduct) return;

    const { error } = await supabase
      .from('products')
      .delete()
      .eq('product_id', selectedProduct.product_id);

    if (error) {
      console.error('Error deleting product:', error);
      setDeleteError('Failed to delete product');
    } else {
      setDeleteModalOpen(false);
      setSelectedProduct(null);
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

  return (
    <IonContent className="ion-padding">
      <IonGrid>
        <IonRow>
          {products.map((product) => (
            <IonCol size="12" sizeMd="6" sizeLg="4" key={product.product_id}>
              <IonCard>
                <IonCardHeader>
                  <IonCardTitle>{product.product_name}</IonCardTitle>
                  <IonCardSubtitle>{product.category || 'Uncategorized'}</IonCardSubtitle>
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
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
                    <IonButton size="small" fill="clear" color="warning" onClick={() => openEditModal(product)}>
                      <IonIcon icon={pencil} />
                    </IonButton>
                    <IonButton size="small" fill="clear" color="danger" onClick={() => openDeleteModal(product)}>
                      <IonIcon icon={trash} />
                    </IonButton>
                  </div>
                </IonCardContent>
              </IonCard>
            </IonCol>
          ))}
        </IonRow>
      </IonGrid>

      {/* Edit Modal */}
      <IonModal isOpen={editModalOpen} onDidDismiss={() => setEditModalOpen(false)}>
        <IonHeader>
          <IonToolbar>
            <IonTitle>Edit Product</IonTitle>
            <IonButtons slot="end">
              <IonButton onClick={() => setEditModalOpen(false)}>
                <IonIcon icon={close} />
              </IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          <IonItem>
            <IonLabel position="floating"style={{ fontStyle: 'italic' }}>Product Name</IonLabel><br></br>
            <IonInput
              value={editForm.product_name}
              onIonChange={(e) => setEditForm({ ...editForm, product_name: e.detail.value! })}
            />
          </IonItem>

          <IonItem>
            <IonLabel position="floating"style={{ fontStyle: 'italic' }}>Description</IonLabel><br></br>
            <IonInput
              value={editForm.description}
              onIonChange={(e) => setEditForm({ ...editForm, description: e.detail.value! })}
            />
          </IonItem>

          <IonItem>
            <IonLabel position="floating"style={{ fontStyle: 'italic' }}>Price</IonLabel><br></br>
            <IonInput
              type="number"
              value={editForm.price}
              onIonChange={(e) =>
                setEditForm({ ...editForm, price: parseFloat(e.detail.value!) || 0 })
              }
            />
          </IonItem>

          <IonItem>
            <IonLabel position="floating"style={{ fontStyle: 'italic' }}>Stock Quantity</IonLabel><br></br>
            <IonInput
              type="number"
              value={editForm.stock_quantity}
              onIonChange={(e) =>
                setEditForm({ ...editForm, stock_quantity: parseInt(e.detail.value!, 10) || 0 })
              }
            />
          </IonItem>

          <IonItem>
            <IonLabel position="floating"style={{ fontStyle: 'italic' }}>Category</IonLabel><br></br>
            <IonInput
              value={editForm.category}
              onIonChange={(e) => setEditForm({ ...editForm, category: e.detail.value! })}
            />
          </IonItem>

          <IonItem>
            <IonLabel position="floating"style={{ fontStyle: 'italic' }}>Batch Date</IonLabel><br></br>
            <IonInput
              type="date"
              value={editForm.batchdate}
              onIonChange={(e) => setEditForm({ ...editForm, batchdate: e.detail.value! })}
            />
          </IonItem>

          <IonItem>
            <IonLabel position="floating" style={{ fontStyle: 'italic' }}>Expiration Date</IonLabel><br></br>
            <IonInput
              type="date"
              value={editForm.expirationdate}
              onIonChange={(e) => setEditForm({ ...editForm, expirationdate: e.detail.value! })}
            />
          </IonItem>

          <IonButton expand="block" style={{ marginTop: '20px' }} onClick={handleUpdate}>
            Update Product
          </IonButton>
        </IonContent>
      </IonModal>

      {/* Delete Modal */}
      <IonModal isOpen={deleteModalOpen} onDidDismiss={() => setDeleteModalOpen(false)}>
        <IonHeader>
          <IonToolbar>
            <IonTitle>Confirm Delete</IonTitle>
            <IonButtons slot="end">
              <IonButton onClick={() => setDeleteModalOpen(false)}>
                <IonIcon icon={close} />
              </IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          <p>Are you sure you want to delete <strong>{selectedProduct?.product_name}</strong>?</p>
          <IonItem>
            <IonLabel position="floating">Enter your password</IonLabel>
            <IonInput
              type="password"
              value={password}
              onIonChange={(e) => {
                setPassword(e.detail.value || '');
                setDeleteError('');
              }}
            />
          </IonItem>
          {deleteError && (
            <IonText color="danger" style={{ marginTop: 10 }}>
              {deleteError}
            </IonText>
          )}
          <IonButton
            color="danger"
            expand="block"
            style={{ marginTop: '20px' }}
            onClick={handleConfirmDelete}
          >
            Delete
          </IonButton>
        </IonContent>
      </IonModal>
    </IonContent>
  );
};

export default ProductListContainer;
