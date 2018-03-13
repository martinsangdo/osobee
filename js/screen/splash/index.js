import React, {Component} from "react";
import {Image, View, Platform, Alert, NetInfo} from "react-native";

import {Container, Button, Text, Header, Title, Body, Left, Right} from "native-base";
import {NavigationActions} from "react-navigation";
import TimerMixin from 'react-timer-mixin';
import FCM, {FCMEvent, RemoteNotificationResult, WillPresentNotificationResult, NotificationType} from 'react-native-fcm';

import BaseScreen from "../../base/BaseScreen.js";
import {API_URI} from '../../utils/api_uri';

import common_styles from "../../../css/common";
import styles from "./style";    //CSS defined here
import Utils from "../../utils/functions";
import {C_Const} from '../../utils/constant';
import RNExitApp from 'react-native-exit-app';
import RequestData from '../../utils/https/RequestData';
import DeviceInfo from 'react-native-device-info';
import store from 'react-native-simple-store';

const launchscreenLogo = require("../../../img/splash/logo.png");

class Splash extends BaseScreen {
  constructor(props) {
    super(props);
    this.state = {
      chosen_language: '',    //indicate user chose language in second screen
      current_language: C_Const.EN_LANG_KEY,
      user_info: {},
      is_got_firebase_token: false,   //firebase token
      is_got_translate_keys: false    //translation key/data
    };
  }
    //like onload event
    componentDidMount() {
      // this.notificationListener = FCM.on(FCMEvent.Notification, () => {});  //avoid warning in iOS
      //check Internet connection
      NetInfo.getConnectionInfo().then((connectionInfo) => {
        if (connectionInfo.type == 'none'){
          //device is offline
          Alert.alert(
            'Alert',
            'Device is offline, app will be closed',
            [
              {text: 'OK', onPress: () => RNExitApp.exitApp()},
            ],
            { cancelable: false }
          );
        } else {
          //online, get necessary data
          //check if user installs app at the first time?
          store.get(C_Const.STORE_KEY.CHOSEN_LANGUAGE_KEY)
          .then(chosen_language => {
            if (!Utils.isEmpty(chosen_language)){
              //user already chose language in second screen
              this.setState({chosen_language: chosen_language, current_language: chosen_language});
            }
            this._get_firebase_token();
            this._get_language_keys();
          });
        }
      });
      //try to wait until all data got
      setTimeout(() => {
        if (!this._is_got_all_data()){
          //not yet get any information, let's user open app again
          Alert.alert(
            'Alert',
            'Cannot get necessary data, please try another time',
            [
              {text: 'OK', onPress: () => RNExitApp.exitApp()},
            ],
            { cancelable: false }
          );
        }
      }, C_Const.MAX_SPLASH_TIMER);

    }
    //check whether Firebase token & data from API are got
    _is_got_all_data = () => {
      return this.state.is_got_firebase_token && this.state.is_got_translate_keys;
    };

    //register Firebase functions
	 _get_firebase_token = () => {
		 FCM.requestPermissions(); // for iOS
		 FCM.getFCMToken().then(token => {
			 Utils.dlog('splash token: ' + token);
       //login server
       RequestData.sentGetRequest(API_URI.GET_GEO_INFO, (timezone_info, error) => {
         var params = {
           app_id: DeviceInfo.getBundleId(),
           app_name: DeviceInfo.getApplicationName(),
           app_version: DeviceInfo.getVersion(),
           device_id: DeviceInfo.getUniqueID(),
           device_name: DeviceInfo.getDeviceId(),
           device_version: Platform.OS + ' ' + DeviceInfo.getSystemVersion(),
           firebase_token: token
         };
         if (!Utils.isEmpty(timezone_info) && !Utils.isEmpty(timezone_info['time_zone'])){
           params['timezone'] = timezone_info['time_zone'];
         }
         RequestData.sentPostRequest(API_URI.UPSERT_USER, params, (response, error) => {
           Utils.xlog('upsert user', response);
           if (Utils.isSuccessResponse(response) && !Utils.isEmpty(response.data) && !Utils.isEmpty(response.data.user_id)){
             store.update(C_Const.STORE_KEY.USER_INFO, response.data); //save user info to Store
             this.setState({user_info: response.data, is_got_firebase_token: true});
             this._check_then_go_main();
           } else {
             //updated fails
             if (error.message == C_Const.NET_REQUEST_FAIL){
               Alert.alert(
                 'Alert',
                 'Cannot connect to server, please try another time',
                 [
                   {text: 'OK', onPress: () => RNExitApp.exitApp()},
                 ],
                 { cancelable: false }
               );
             } else {
               //another errors?
               Utils.xlog('111', error);
             }
           }
         });
       });
		 });
		this.notificationListener = FCM.on(FCMEvent.Notification, async (notif) => {
			Utils.dlog('notificationListener');
			Utils.dlog(notif);
	    // optional, do some component related stuff
    });
    // initial notification contains the notification that launchs the app. If user launchs app by clicking banner, the banner notification info will be here rather than through FCM.on event
    // sometimes Android kills activity when app goes to background, and when resume it broadcasts notification before JS is run. You can use FCM.getInitialNotification() to capture those missed events.
    // initial notification will be triggered all the time even when open app by icon so send some action identifier when you send notification
    FCM.getInitialNotification().then(notif=>{
        Utils.xlog('getInitialNotification', notif);
    });
    this.notificationListener = FCM.on(FCMEvent.Notification, notif => {
      Utils.xlog("received notification:", notif);
      if (notif.badge != null){
        //change no. in tab label
        this.props.screenProps.emit(C_Const.EMIT_KEY.CHANGE_NOTIF_NUM, {
          tab_label_notif_num: notif.badge
        });
        //refresh the Notification list
        this.props.screenProps.emit(C_Const.EMIT_KEY.CHANGE_NOTIF_NUM_FROM_PUSH, {
          new_badge: notif.badge
        });
        Utils.xlog('push badge', notif.badge);
        if (notif.badge != '' && Utils.parseInt(notif.badge) >= 0){
          FCM.setBadgeNumber(Utils.parseInt(notif.badge));   //set icon app badge
        }
      }
      if(notif.local_notification){
        return;
      }
      if(notif.opened_from_tray){
        //this.props.navigation.navigate('Chat', {friend: item} //needs to use notif. to navigate to correct chat screen
        return;
      }

      if(Platform.OS ==='ios'){
        switch(notif._notificationType){
          case NotificationType.Remote:
            notif.finish(RemoteNotificationResult.NewData) //other types available: RemoteNotificationResult.NewData, RemoteNotificationResult.ResultFailed
            break;
          case NotificationType.NotificationResponse:
            notif.finish();
            break;
          case NotificationType.WillPresent:
            notif.finish(WillPresentNotificationResult.All) //other types available: WillPresentNotificationResult.None
            break;
        }
      }
      this.refreshTokenListener = FCM.on(FCMEvent.RefreshToken, token => {
        Utils.xlog("TOKEN (refreshUnsubscribe)", token);
        this.usersRef.child(this.props.user.uid).update({
          token: token
        })
        try {
          this.props.onChangeToken(token).then(ok => {
            Utils.xlog('Refresh onChangeToken', ok);
          });
        } catch (err) {
          	Utils.xlog('Refresh onChangeToken Error', err.message);
        }
			});
		});
  };  //end function _get_firebase_token
  //
  _get_language_keys = () => {
    //check if chosen language is existed in app
      // Utils.dlog('Splash: check store language');
			store.get(C_Const.STORE_KEY.LANGUAGE)
			.then(lang_info => {
        //always update newest translation
        // Utils.dlog('Splash: begin get language');
        RequestData.sentGetRequestWithExtraHeaders(API_URI.GET_LANGUAGE_KEY, {Language: this.state.current_language}, (response, error) => {
              // Utils.dlog(response);
              if (Utils.isSuccessResponse(response) && !Utils.isEmpty(response.data) && response.data.length > 0){
    							//there is some data of translation
    							var lang_data = response.data;
    							var len = lang_data.length;
    							var lang_key_obj = {
                    'en': {},    //translation of English
                    'vn': {},    //translation of Vietnamese
                    'cn': {},    //translation of Chinese
                    'th': {},    //translation of Thailand
                  };		//save translated content of ALL languages
    							for (var i=0; i<len; i++){
    								if (!Utils.isEmpty(lang_data[i]['code']) && !Utils.isEmpty(lang_data[i]['keyword'])){
    									lang_key_obj[lang_data[i]['code']][lang_data[i]['keyword']] = lang_data[i]['_content'];
    								}
    							}
    							//save language into store
    							var store_lang_info = {
                    'current_language': Utils.isEmpty(this.state.chosen_language)?C_Const.EN_LANG_KEY:this.state.chosen_language,
                    'data_obj': lang_key_obj   //all translations
                  };
    							store.update(C_Const.STORE_KEY.LANGUAGE, store_lang_info); //save to Store
                  this.setState({is_got_translate_keys: true});
                  // Utils.dlog(store_lang_info);
                  this._check_then_go_main();
    						} else {
    							//cannot get language keyword

    						}
            });
			});
  };
  //check whether all information is got & move to Main page
  _check_then_go_main(){
    if (this._is_got_all_data()){
      setTimeout(() => {
        if (Utils.isEmpty(this.state.chosen_language)){
          this._navigateTo('ChangeLanguage');
        } else if (Utils.isEmpty(this.state.user_info['country_code'])){
          this._navigateTo('ChooseCountry');
        } else {
          this._navigateTo('Main', {current_language: this.state.current_language});
        }
      }, C_Const.SPLASH_TIMER);
    }
  };
  //
	 componentWillUnmount() {
        // stop listening for events
        // this.notificationListener.remove();
    }
   //==========
    render() {
        const {navigate} = this.props.navigation;

        return (
            <Container>
                <View style={[common_styles.mainGreenBg, styles.container]}>
                    <Image source={launchscreenLogo} style={styles.logo}/>
                </View>
            </Container>
        );
    }
}

export default Splash;
