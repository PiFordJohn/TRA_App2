import { 
  IonButton,
    IonButtons,
      IonContent, 
      IonHeader, 
      IonMenuButton, 
      IonPage, 
      IonTitle, 
      IonToolbar,
      IonInput,
      IonIcon,
      IonItem, 
      useIonRouter,
      IonList,
      IonInputPasswordToggle,
      IonAvatar,
      IonAlert,
      IonToast,
      IonCol,
      IonGrid,
      IonRow
  } from '@ionic/react';
  import logo2 from '../../img/logo2.jpg';
  import { useState } from 'react';
  import { supabase } from '../utils/supabaseClient';
  
  const AlertBox: React.FC<{ message: string; isOpen: boolean; onClose: () => void }> = ({ message, isOpen, onClose }) => {
    return (
      <IonAlert
        isOpen={isOpen}
        onDidDismiss={onClose}
        header="Notification"
        message={message}
        buttons={['OK']}
      />
    );
  };

  const Login: React.FC = () => {
      const navigation = useIonRouter();
      const [email, setEmail] = useState('');
      const [password, setPassword] = useState('');
      const [alertMessage, setAlertMessage] = useState('');
      const [showAlert, setShowAlert] = useState(false);
      const [showToast, setShowToast] = useState(false);
  
      const doLogin = async () => {
  const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setAlertMessage(error.message);
      setShowAlert(true);
      return;
    }

    setShowToast(true); 
    setTimeout(() => {
      navigation.push('/TRA_App2/app', 'forward', 'replace');
    }, 300);
  };

    return (
       <IonPage>
      <IonContent className='ion-padding'style={{ 
  '--background': 'url(/TRA_App2/assets/TRA_Background.jpg) no-repeat center center / cover' 
     }}>

      <IonGrid>
       <IonRow className="ion-justify-content-center">
        <IonCol size="12" sizeMd="6" sizeLg="4">

        <div style={{
          display: 'flex',
          flexDirection:'column',
          alignItems: 'center',
          justifyContent: 'center',
          marginTop:'25%'
        }}>
          <IonAvatar
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '150px',
              height: '150px',
              borderRadius: '50%', 
              overflow: 'hidden' 
            }}
          >
            <img 
             src={logo2}
            alt="User Avatar"
            style={{
           width: '100%',
          height: '100%',
          objectFit: 'cover'
    }}
  />
          </IonAvatar>
          <h1 style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color:'white',
            fontFamily: 'cursive',
            fontWeight:'bolder'
          }}
          >USER LOGIN</h1>
          <IonInput style={{ marginTop:'10px', color:'white', fontFamily:'cursive' }}
            label="Email" 
            labelPlacement="floating" 
            fill="outline"
            type="email"
            placeholder="Enter Email"
            value={email}
            onIonChange={e => setEmail(e.detail.value!)}
          />
          <IonInput style={{ marginTop:'10px', color:'white', fontFamily:'cursive'}}      
            fill="outline"
            type="password"
            placeholder="Password"
            value={password}
            onIonChange={e => setPassword(e.detail.value!)}
          >
            <IonInputPasswordToggle slot="end"></IonInputPasswordToggle>
          </IonInput>
        </div>
        <IonButton onClick={doLogin} expand="full" shape='round' color='success'>
          Login
        </IonButton>

        <IonButton style={{ color:'white', fontFamily:'cursive'}}
        routerLink="/TRA_App2/register" expand="full" fill="clear" shape='round'>
          Don't have an account? Sign Up !
        </IonButton>

        </IonCol>
        </IonRow>
    </IonGrid>

        {/* Reusable AlertBox Component */}
        <AlertBox message={alertMessage} isOpen={showAlert} onClose={() => setShowAlert(false)} />
        
        {/* IonToast for success message */}
        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message="Login successful! Redirecting..."
          duration={1500}
          position="top"
          color="primary"
        />
      </IonContent>
    </IonPage>
  );
};
  
  export default Login;

