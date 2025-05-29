import { 
  IonButton,
  IonContent, 
  IonPage,
  IonInput,
  useIonRouter,
  IonInputPasswordToggle,
  IonAvatar,
  IonAlert,
  IonToast,
  IonModal,
  IonLabel,
  IonGrid,
  IonRow,
  IonCol,
  IonIcon,
  IonLoading
} from '@ionic/react';
import logo2 from '../../img/logo2.jpg';
import { useState } from 'react';
import { supabase } from '../utils/supabaseClient';
import { eyeOff, eye } from 'ionicons/icons';

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
  const [otp, setOtp] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [showAlert, setShowAlert] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const sendOtp = async () => {
    if (!email) {
      setAlertMessage('Please enter your email');
      setShowAlert(true);
      return false;
    }

    setIsSendingOtp(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: window.location.origin,
          shouldCreateUser: false
        }
      });

      if (error) throw error;
      
      setShowOtpModal(true);
      setShowToast(true);
      return true;
    } catch (error: any) {
      setAlertMessage(error.message || 'Failed to send OTP');
      setShowAlert(true);
      return false;
    } finally {
      setIsSendingOtp(false);
    }
  };

  const verifyAndLogin = async () => {
    if (!otp || !password) {
      setAlertMessage('Please enter both OTP and password');
      setShowAlert(true);
      return;
    }

    setIsVerifying(true);
    try {
      // Verify OTP first
      const { error: otpError } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: 'email'
      });
      if (otpError) throw otpError;

      // Then login with password
      const { error: loginError } = await supabase.auth.signInWithPassword({ 
        email, 
        password 
      });
      if (loginError) throw loginError;

      setShowToast(true);
      setTimeout(() => {
        navigation.push('/TRA_APP2/app', 'forward', 'replace');
      }, 500);
      
      setShowOtpModal(false);
    } catch (error: any) {
      setAlertMessage(error.message || 'Verification failed. Please try again.');
      setShowAlert(true);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      setAlertMessage('Please enter both email and password');
      setShowAlert(true);
      return;
    }
    await sendOtp();
  };

  return (
  <IonPage>
    <IonContent
      className="ion-padding"
      style={{
        "--background":
          "url(/TRA_App2/assets/TRA_Background.jpg) no-repeat center center / cover",
      }}
    >
      <IonGrid>
        <IonRow className="ion-justify-content-center">
          <IonCol size="12" sizeMd="6" sizeLg="4">
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                marginTop: "25%",
              }}
            >
              <IonAvatar
                style={{ width: 150, height: 150, marginBottom: 10 }}
              >
                <img src={logo2} alt="Logo" />
              </IonAvatar>
              <h1
                style={{
                  color: "white",
                  fontFamily: "cursive",
                  fontWeight: "bolder",
                }}
              >
                USER LOGIN
              </h1>

              <IonInput
                style={{ marginTop: 10, color: "white" }}
                label="Email"
                labelPlacement="floating"
                fill="outline"
                type="email"
                placeholder="Enter Email"
                value={email}
                onIonChange={(e) => setEmail(e.detail.value!)}
              />
              <div style={{ position: "relative", width: "100%" }}>
                <IonInput
                  style={{ marginTop: 10, color: "white" }}
                  fill="outline"
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onIonChange={(e) => setPassword(e.detail.value!)}
                />
                <IonIcon
                  icon={showPassword ? eyeOff : eye}
                  slot="end"
                  onClick={() => setShowPassword((prev) => !prev)}
                  style={{
                    position: "absolute",
                    top: "25px",
                    right: "10px",
                    cursor: "pointer",
                    color: "white",
                  }}
                />
              </div>

              <IonButton
                onClick={handleLogin}
                expand="full"
                shape="round"
                color="success"
                style={{ marginTop: 20 }}
              >
                Login
              </IonButton>
              <IonButton
                routerLink="/TRA_App2/register"
                expand="full"
                fill="clear"
                shape="round"
                style={{ color: "white", marginTop: 10 }}
              >
                Don't have an account? Sign Up!
              </IonButton>
            </div>
          </IonCol>
        </IonRow>
      </IonGrid>
      <IonLoading isOpen={isLoading} message="Please wait..." spinner="circles" />


        {/* OTP Verification Modal */}
        <IonModal isOpen={showOtpModal} onDidDismiss={() => setShowOtpModal(false)}>
          <IonContent className="ion-padding">
            <IonGrid>
              <IonRow className="ion-justify-content-center">
                <IonCol size="12" sizeMd="8" sizeLg="6">
                  <div style={{ textAlign: 'center', marginTop: '50%' }}>
                    <IonLabel>
                      <h2>Two-Factor Verification</h2>
                      <p>We've sent a 6-digit code to {email}</p>
                    </IonLabel>
                    
                    <IonInput
                      fill="outline"
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxlength={6}
                      placeholder="Enter OTP"
                      value={otp}
                      onIonChange={e => setOtp(e.detail.value!)}
                      style={{ margin: '20px 0' }}
                    />
                    
                    <IonButton 
                      expand="block" 
                      onClick={verifyAndLogin}
                      disabled={isVerifying}
                    >
                      {isVerifying ? 'Verifying...' : 'Verify & Login'}
                    </IonButton>
                    
                    <IonButton 
                      expand="block" 
                      fill="clear" 
                      onClick={() => setShowOtpModal(false)}
                    >
                      Cancel
                    </IonButton>
                  </div>
                </IonCol>
              </IonRow>
            </IonGrid>
          </IonContent>
        </IonModal>

        <AlertBox 
          message={alertMessage} 
          isOpen={showAlert} 
          onClose={() => setShowAlert(false)} 
        />
        
        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message="OTP sent successfully! Please check your email."
          duration={3000}
          position="top"
          color="primary"
        />
      </IonContent>
    </IonPage>
  );
};

export default Login;