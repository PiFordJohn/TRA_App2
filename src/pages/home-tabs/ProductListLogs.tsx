import { 
  IonButtons,
  IonContent, 
  IonHeader, 
  IonMenuButton, 
  IonPage, 
  IonTitle, 
  IonToolbar 
} from '@ionic/react';

const ProductListLogs: React.FC = () => {
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot='start'>
            <IonMenuButton></IonMenuButton>
          </IonButtons>
          <IonTitle>Product List Logs</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <div 
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
          }}
        >
          Product List Logs
        </div>
      </IonContent>
    </IonPage>
  );
};

export default ProductListLogs;
