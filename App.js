/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 * @flow
 * author: Martin SangDo
 */

import React, {Component} from 'react';
import {Root, Icon, Badge} from "native-base";
import {
    Platform,
    StyleSheet,
    Text,
    View
} from 'react-native';

import {
    StackNavigator, TabNavigator
} from 'react-navigation';
import common_styles from "./css/common";
import {C_Const, C_MULTI_LANG} from './js/utils/constant';
import Utils from "./js/utils/functions";

import store from 'react-native-simple-store';
import EventEmitter from 'EventEmitter';
import TabLabel from './js/plugin/tab_label'
//define screens
import BaseScreen from "./js/base/BaseScreen"
import Timeline from "./js/screen/timeline";
import Viewer from "./js/screen/viewer";

const eventEmitter = new EventEmitter();
//https://github.com/react-navigation/react-navigation/issues/628
const AppNavigator = StackNavigator({
        BaseScreen: {screen: BaseScreen},
        Timeline: {screen: Timeline},
        Viewer: {screen: Viewer},
    },
    {
        initialRouteName: "Timeline",   //open this page first time
        headerMode: "none",
        cardStyle: {
          paddingTop: 0,
          backgroundColor: '#fff'
        }
    });

export default class App extends Component{
  constructor(props) {
    super(props);
  }

  componentDidMount() {
    console.ignoredYellowBox = ['Remote debugger'];   //don't show warning in app when debugging
  }
  //
  render() {
    return (
      <Root>
          <AppNavigator screenProps={eventEmitter}/>
      </Root>
    )
  }
}
