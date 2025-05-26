import { 
  IonButtons,
  IonContent, 
  IonHeader, 
  IonMenuButton, 
  IonPage, 
  IonTitle, 
  IonToolbar 
} from '@ionic/react';
import ProductListContainer from '../../components/ProductListContainer';

const ProductListLogs: React.FC = () => {
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot='start'>
            <IonMenuButton />
          </IonButtons>
          <IonTitle>Product List Logs</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen>
        <ProductListContainer /> {/* ✅ Add this to show the product data */}
      </IonContent>
    </IonPage>
  );
};

export default ProductListLogs;
