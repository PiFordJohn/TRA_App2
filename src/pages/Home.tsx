import { 
  IonButton,
  IonButtons,
  IonContent, 
  IonHeader,
  IonIcon, 
  IonLabel, 
  IonMenuButton, 
  IonPage,
  IonRouterOutlet, 
  IonTabBar, 
  IonTabButton, 
  IonTabs,  
  IonTitle, 
  IonToolbar 
} from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { bookOutline,star,starHalf } from 'ionicons/icons'; 
import { Route, Redirect } from 'react-router';

import Products from './home-tabs/Products';
import ProductListLogs from './home-tabs/ProductListLogs';

const Home: React.FC = () => {
  const tabs = [
    { name: 'Products', tab: 'Products', url: '/TRA_App2/app/home/Products', icon: bookOutline },
    { name: 'ProductListLogs', tab: 'ProductListLogs', url: '/TRA_App2/app/home/ProductListLogs', icon: starHalf},
  ];

  return (
    <IonReactRouter>
      <IonTabs>
        <IonTabBar slot="bottom">
          {tabs.map((item, index) => (
            <IonTabButton key={index} tab={item.tab} href={item.url}>
              <IonIcon icon={item.icon} />
              <IonLabel>{item.name}</IonLabel>
            </IonTabButton>
          ))}
        </IonTabBar>

       <IonRouterOutlet>
    <Route exact path="/TRA_App2/app/home/Products" component={Products} />
    <Route exact path="/TRA_App2/app/home/ProductListLogs" component={ProductListLogs} />
    <Route exact path="/TRA_App2/app/home">
    <Redirect to="/TRA_App2/app/home/Products" />
    </Route>
   </IonRouterOutlet>

      </IonTabs>
    </IonReactRouter>
  );
};

export default Home;
