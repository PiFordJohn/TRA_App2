import {
  IonButton,
  IonContent,
  IonPage,
  IonInput,
  IonAvatar,
  IonAlert,
  IonToast,
  IonCol,
  IonGrid,
  IonRow,
  IonLoading,
  IonIcon,
} from "@ionic/react";
import { eye, eyeOff } from "ionicons/icons";
import logo2 from "../../img/logo2.jpg";
import { useState } from "react";
import { useIonRouter } from "@ionic/react";
import { supabase } from "../utils/supabaseClient";

const AlertBox: React.FC<{
  message: string;
  isOpen: boolean;
  onClose: () => void;
}> = ({ message, isOpen, onClose }) => (
  <IonAlert
    isOpen={isOpen}
    onDidDismiss={onClose}
    header="Notification"
    message={message}
    buttons={["OK"]}
  />
);

const Login: React.FC = () => {
  const navigation = useIonRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showLoading, setShowLoading] = useState(false);
  const [showOtpLoading, setShowOtpLoading] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [showAlert, setShowAlert] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpInput, setOtpInput] = useState("");

  const doLogin = async () => {
    if (!email || !password) {
      setAlertMessage("Please enter email and password");
      setShowAlert(true);
      return;
    }

    setShowLoading(true);

    const userRes = await supabase
      .from("users")
      .select("*")
      .eq("user_email", email)
      .single();

    if (!userRes.data) {
      setShowLoading(false);
      setAlertMessage("Account not found.");
      setShowAlert(true);
      return;
    }

    const { user_id } = userRes.data;

    const failedRes = await supabase
      .from("failed_logins")
      .select("*")
      .eq("user_id", user_id)
      .single();

    const now = new Date();
    const lockedUntil = failedRes.data?.locked_until
      ? new Date(failedRes.data.locked_until)
      : null;

    if (lockedUntil && lockedUntil > now) {
      const minutes = Math.ceil((lockedUntil.getTime() - now.getTime()) / 60000);
      setShowLoading(false);
      setAlertMessage(`Account is locked. Try again in ${minutes} min.`);
      setShowAlert(true);
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      const attempts = (failedRes.data?.failed_attempts || 0) + 1;
      let newLock = null;

      if (attempts === 3) {
        newLock = new Date(now.getTime() + 5 * 60000); // 5 mins
      } else if (attempts >= 6) {
        newLock = new Date(now.getTime() + 10 * 60000); // 10 mins
      }

      if (failedRes.data) {
        await supabase.from("failed_logins").update({
          failed_attempts: attempts,
          last_attempt: now.toISOString(),
          locked_until: newLock,
        }).eq("user_id", user_id);
      } else {
        await supabase.from("failed_logins").insert({
          user_id,
          failed_attempts: 1,
          last_attempt: now.toISOString(),
        });
      }

      setShowLoading(false);
      setAlertMessage(error.message);
      setShowAlert(true);
      return;
    }

    // Login successful: reset failed attempts
    await supabase.from("failed_logins").delete().eq("user_id", user_id);

    const otpSent = await sendOTP();
    setShowLoading(false);
    if (otpSent) {
      setShowOtpModal(true);
    } else {
      setAlertMessage("Failed to send OTP. Try again.");
      setShowAlert(true);
    }
  };

  const sendOTP = async (): Promise<boolean> => {
    try {
      const response = await fetch("http://localhost:3000/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!response.ok) throw new Error("Failed to send OTP");
      return true;
    } catch {
      return false;
    }
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
                <IonAvatar style={{ width: 150, height: 150, marginBottom: 10 }}>
                  <img src={logo2} alt="Logo" style={{ objectFit: "cover" }} />
                </IonAvatar>
                <h1 style={{ color: "white", fontFamily: "cursive", fontWeight: "bolder" }}>
                  USER LOGIN
                </h1>

                <IonInput
                  style={{ marginTop: 10, color: "white", fontFamily: "cursive" }}
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
                    style={{ marginTop: 10, color: "white", fontFamily: "cursive" }}
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
              </div>

              <IonButton
                onClick={doLogin}
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
                style={{ color: "white", fontFamily: "cursive", marginTop: 10 }}
              >
                Don't have an account? Sign Up!
              </IonButton>
            </IonCol>
          </IonRow>
        </IonGrid>

        <IonLoading isOpen={showLoading} message="Please wait..." spinner="circles" />
        <IonLoading isOpen={showOtpLoading} message="Verifying OTP..." spinner="circles" />

        <AlertBox message={alertMessage} isOpen={showAlert} onClose={() => setShowAlert(false)} />

        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message="Login successful! Redirecting..."
          duration={1500}
          position="top"
          color="primary"
        />

        <IonAlert
          isOpen={showOtpModal}
          onDidDismiss={() => setShowOtpModal(false)}
          header="Enter OTP"
          inputs={[
            {
              name: "otp",
              type: "text",
              placeholder: "Enter the 6-digit code",
              attributes: {
                inputmode: "numeric",
                pattern: "[0-9]*",
                maxLength: 6,
              },
            },
          ]}
          buttons={[
            {
              text: "Cancel",
              role: "cancel",
              handler: () => {
                setOtpInput("");
                setShowOtpModal(false);
              },
            },
            {
              text: "Verify",
              handler: async (inputValues) => {
                const enteredOtp = (inputValues.otp ?? "").trim();
                if (!/^\d{6}$/.test(enteredOtp)) {
                  setAlertMessage("Please enter a valid 6-digit OTP");
                  setShowAlert(true);
                  return false;
                }

                setShowOtpLoading(true);
                const { data, error } = await supabase
                  .from("login_otp_codes")
                  .select("*")
                  .eq("email", email)
                  .single();
                setShowOtpLoading(false);

                if (error || !data) {
                  setAlertMessage("OTP not found. Please resend OTP.");
                  setShowAlert(true);
                  return false;
                }

                if (data.otp !== enteredOtp) {
                  setAlertMessage("Invalid OTP. Please try again.");
                  setShowAlert(true);
                  return false;
                }

                if (new Date(data.expires_at) < new Date()) {
                  setAlertMessage("OTP expired. Please resend OTP.");
                  setShowAlert(true);
                  return false;
                }

                await supabase.from("login_otp_codes").delete().eq("email", email);
                setShowToast(true);
                setShowOtpModal(false);
                setOtpInput("");

                setTimeout(() => {
                  navigation.push("/TRA_App2/app", "forward", "replace");
                }, 1500);

                return true;
              },
            },
          ]}
        />
      </IonContent>
    </IonPage>
  );
};

export default Login;