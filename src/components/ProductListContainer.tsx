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
        () => {
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
      fetchProducts();
    }
  };

  const openDeleteModal = (product: Product) => {
    setSelectedProduct(product);
    setPassword('');
    setDeleteError('');
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    // Get current user info
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.email) {
      setDeleteError('User not logged in');
      return;
    }

    // Re-authenticate user with entered password
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: password,
    });

    if (signInError) {
      setDeleteError('Incorrect password');
      return;
    }

    if (!selectedProduct) return;

    // Proceed with delete
    const { error: deleteError } = await supabase
      .from('products')
      .delete()
      .eq('product_id', selectedProduct.product_id);

    if (deleteError) {
      console.error('Error deleting product:', deleteError);
      setDeleteError('Failed to delete product');
    } else {
      setDeleteModalOpen(false);
      setSelectedProduct(null);
      fetchProducts();
    }
  };

  // ====== PRINT REPORT FUNCTION ======
 const handlePrint = () => {
  const reportWindow = window.open('', '_blank');
  if (!reportWindow) return;

  const preparedDate = new Date().toLocaleString();

  const htmlContent = `
    <html>
      <head>
        <title>Product Report</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { text-align: center; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
          .footer-section {
            margin-top: 40px;
            font-size: 14px;
          }
          .prepared-by-line {
            margin-top: 50px;
            border-bottom: 1px solid black;
            width: 300px;
            height: 20px;
          }
        </style>
      </head>
      <body>
        <h1>Product Report</h1>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Category</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Batch Date</th>
              <th>Expiration Date</th>
            </tr>
          </thead>
          <tbody>
            ${products
              .map(
                (p) => `
              <tr>
                <td>${p.product_name}</td>
                <td>${p.category || 'Uncategorized'}</td>
                <td>₱${p.price.toFixed(2)}</td>
                <td>${p.stock_quantity}</td>
                <td>${p.batchdate}</td>
                <td>${p.expirationdate || '-'}</td>
              </tr>
            `
              )
              .join('')}
          </tbody>
        </table>

        <div class="footer-section">
          <p><strong>Date Prepared:</strong> ${preparedDate}</p>
          <p><strong>Prepared By:</strong></p>
          <div class="prepared-by-line"></div>
        </div>
      </body>
    </html>
  `;

  reportWindow.document.write(htmlContent);
  reportWindow.document.close();
  reportWindow.focus();
  reportWindow.print();
  reportWindow.close();
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
      {/* Print Report Button */}
      <IonButton onClick={handlePrint} style={{ marginBottom: '16px' }}>
        Print Report
      </IonButton>

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
                  <p>
                    <strong>Price:</strong> ₱{product.price.toFixed(2)}
                  </p>
                  <p>
                    <strong>Stock:</strong> {product.stock_quantity}
                  </p>
                  <p>
                    <strong>Batch:</strong> {product.batchdate}
                  </p>
                  {product.expirationdate && (
                    <p>
                      <strong>Expires:</strong> {product.expirationdate}
                    </p>
                  )}
                  {product.description && (
                    <p>
                      <strong>Description:</strong> {product.description}
                    </p>
                  )}
                  <p>
                    <strong>Created At:</strong>{' '}
                    {new Date(product.created_at).toLocaleString()}
                  </p>
                  {product.updated_at && (
                    <p>
                      <strong>Last Updated:</strong>{' '}
                      {new Date(product.updated_at).toLocaleString()}
                    </p>
                  )}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'flex-end',
                      gap: '8px',
                      marginTop: '10px',
                    }}
                  >
                    <IonButton
                      size="small"
                      fill="clear"
                      color="warning"
                      onClick={() => openEditModal(product)}
                    >
                      <IonIcon icon={pencil} />
                    </IonButton>
                    <IonButton
                      size="small"
                      fill="clear"
                      color="danger"
                      onClick={() => openDeleteModal(product)}
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

      {/* Edit Modal */}
      <IonModal
        isOpen={editModalOpen}
        onDidDismiss={() => setEditModalOpen(false)}
        backdropDismiss={false}
      >
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
            <IonLabel position="floating" style={{ fontStyle: 'italic' }}>
              Product Name
            </IonLabel>
            <IonInput
              value={editForm.product_name}
              onIonChange={(e) =>
                setEditForm({ ...editForm, product_name: e.detail.value! })
              }
            />
          </IonItem>

          <IonItem>
            <IonLabel position="floating" style={{ fontStyle: 'italic' }}>
              Description
            </IonLabel>
            <IonInput
              value={editForm.description}
              onIonChange={(e) =>
                setEditForm({ ...editForm, description: e.detail.value! })
              }
            />
          </IonItem>

          <IonItem>
            <IonLabel position="floating" style={{ fontStyle: 'italic' }}>
              Price
            </IonLabel>
            <IonInput
              type="number"
              value={editForm.price}
              onIonChange={(e) =>
                setEditForm({
                  ...editForm,
                  price: parseFloat(e.detail.value!) || 0,
                })
              }
            />
          </IonItem>

          <IonItem>
            <IonLabel position="floating" style={{ fontStyle: 'italic' }}>
              Stock Quantity
            </IonLabel>
            <IonInput
              type="number"
              value={editForm.stock_quantity}
              onIonChange={(e) =>
                setEditForm({
                  ...editForm,
                  stock_quantity: parseInt(e.detail.value!, 10) || 0,
                })
              }
            />
          </IonItem>

          <IonItem>
            <IonLabel position="floating" style={{ fontStyle: 'italic' }}>
              Category
            </IonLabel>
            <IonInput
              value={editForm.category}
              onIonChange={(e) =>
                setEditForm({ ...editForm, category: e.detail.value! })
              }
            />
          </IonItem>

          <IonItem>
            <IonLabel position="floating" style={{ fontStyle: 'italic' }}>
              Batch Date
            </IonLabel>
            <IonInput
              type="date"
              value={editForm.batchdate}
              onIonChange={(e) =>
                setEditForm({ ...editForm, batchdate: e.detail.value! })
              }
            />
          </IonItem>

          <IonItem>
            <IonLabel position="floating" style={{ fontStyle: 'italic' }}>
              Expiration Date
            </IonLabel>
            <IonInput
              type="date"
              value={editForm.expirationdate}
              onIonChange={(e) =>
                setEditForm({ ...editForm, expirationdate: e.detail.value! })
              }
            />
          </IonItem>

          <IonButton expand="block" onClick={handleUpdate} style={{ marginTop: 20 }}>
            Update Product
          </IonButton>
        </IonContent>
      </IonModal>

      {/* Delete Confirmation Modal */}
      <IonModal
        isOpen={deleteModalOpen}
        onDidDismiss={() => setDeleteModalOpen(false)}
        backdropDismiss={false}
      >
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
          <IonText>
            Are you sure you want to delete the product{' '}
            <strong>{selectedProduct?.product_name}</strong>?
          </IonText>

          <IonItem style={{ marginTop: '20px' }}>
            <IonLabel position="floating">Enter your password</IonLabel>
            <IonInput
              type="password"
              value={password}
              onIonChange={(e) => setPassword(e.detail.value!)}
            />
          </IonItem>
          {deleteError && (
            <IonText color="danger" style={{ marginTop: '10px' }}>
              {deleteError}
            </IonText>
          )}

          <IonButton
            expand="block"
            color="danger"
            onClick={handleConfirmDelete}
            style={{ marginTop: '20px' }}
          >
            Delete Product
          </IonButton>
        </IonContent>
      </IonModal>
    </IonContent>
  );
};

export default ProductListContainer;
