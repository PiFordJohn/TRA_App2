import {
  IonButtons,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardSubtitle,
  IonCardTitle,
  IonContent,
  IonHeader,
  IonImg,
  IonMenuButton,
  IonPage,
  IonTitle,
  IonToolbar
} from '@ionic/react';
import touristImg from '../../img/logo2.jpg'; // you can change this to a more relevant image later

const About: React.FC = () => {
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonMenuButton />
          </IonButtons>
          <IonTitle>About</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <IonCard className="profile-card">
          <IonImg src={touristImg} alt="Tourist Rest Area" />
          <IonCardHeader>
            <IonCardTitle>Product Management App</IonCardTitle>
            <IonCardSubtitle>Tourist Rest Area – Manolo Fortich</IonCardSubtitle>
          </IonCardHeader>

          <IonCardContent>
            This Product Management App is designed to support the operations of the Tourist Rest Area in Manolo Fortich, Bukidnon.
            It helps manage inventory, categories, suppliers, and product stock in real-time with a clean and responsive interface.
            <br /><br />
            The system began operation in <strong>August 2023</strong> and continues to evolve as part of the digitalization of local tourism infrastructure. 
            With a focus on user-friendly functionality and real-time updates via Supabase, it serves as an essential tool for administrators and staff managing product logistics in the area.
          </IonCardContent>
        </IonCard>
      </IonContent>
    </IonPage>
  );
};

export default About;
