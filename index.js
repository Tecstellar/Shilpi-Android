import { registerRootComponent } from 'expo';
import * as SplashScreen from 'expo-splash-screen';
import App from './App';

// Prevent splash from auto-hiding immediately before React has mounted
SplashScreen.preventAutoHideAsync().catch(() => {});

registerRootComponent(App);
