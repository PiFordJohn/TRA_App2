import { IonButtons, IonContent, IonHeader, IonMenuButton, IonPage, IonTitle, IonToolbar } from '@ionic/react';
import ProductContainer from '../../components/ProductContainer';

const Products: React.FC = () => {
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonMenuButton />
          </IonButtons>
          <IonTitle>Product Management</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <ProductContainer />
      </IonContent>
    </IonPage>
  );
};

export default Products;

// If you need to export Feed, use a named export instead:
// export { Feed };