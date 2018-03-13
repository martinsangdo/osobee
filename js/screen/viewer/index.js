import React, {Component} from "react";
import {Image, ImageBackground, View, StatusBar, Platform, TouchableOpacity, FlatList, ScrollView, Dimensions} from "react-native";

import {Container, Content, Text, Header, Title, Body, Left, Right, Icon, Button} from "native-base";
import {NavigationActions} from "react-navigation";

import BaseScreen from "../../base/BaseScreen.js";
import common_styles from "../../../css/common";
import styles from "./style";    //CSS defined here
import Utils from "../../utils/functions";
import {C_Const, C_MULTI_LANG} from '../../utils/constant';
import store from 'react-native-simple-store';

//define label
const T_ABOUT = 'about';
const T_CONTACT = 'contact';

class Viewer extends BaseScreen {
    constructor(props) {
  		super(props);
  		this.state = {
        selectedTab: T_ABOUT,
        _language_info: {}
  		};
  	}
    //
    componentDidMount() {
    }

   //==========
    render() {
      {/* define how to render country list */}

        return (
            <Container padder>
              <Header style={[common_styles.header, common_styles.whiteBg]}>
                <Left style={styles.left}>
                  <TouchableOpacity onPress={() => this.props.navigation.goBack()}>
                    <View style={styles.left_row}>
                      <View style={[common_styles.float_center]}>
                        <Icon name="ios-arrow-back-outline" style={common_styles.default_font_color}/>
                      </View>
                    </View>
                  </TouchableOpacity>
                </Left>
                <Body style={styles.headerBody}>
                </Body>
                <Right style={styles.right}></Right>
              </Header>
              {/* END header */}
              <Content>

              </Content>
            </Container>
        );
    }
}

export default Viewer;
