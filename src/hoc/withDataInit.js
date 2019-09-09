import delay from 'delay';
import { isNil } from 'lodash';
import { Alert } from 'react-native';
import { connect } from 'react-redux';
import { compose, withHandlers } from 'recompact';
import { getIsWalletEmpty } from '../handlers/commonStorage';
import { hasEthBalance } from '../handlers/web3';
import {
  dataClearState,
  dataLoadState,
  dataInit,
} from '../redux/data';
import { clearIsWalletEmpty } from '../redux/isWalletEmpty';
import { setIsWalletEthZero } from '../redux/isWalletEthZero';
import { nonceClearState } from '../redux/nonce';
import { clearOpenFamilyTab } from '../redux/openFamilyTabs';
import {
  requestsLoadState,
  requestsClearState,
} from '../redux/requests';
import {
  settingsLoadState,
  settingsUpdateAccountAddress,
  settingsUpdateAccountColor,
  settingsUpdateAccountName,
} from '../redux/settings';
import {
  uniswapLoadState,
  uniswapClearState,
  uniswapUpdateState,
} from '../redux/uniswap';
import {
  uniqueTokensClearState,
  uniqueTokensLoadState,
  uniqueTokensRefreshState,
} from '../redux/uniqueTokens';
import { walletInit, saveWalletDetails, saveName, loadUserDataForAddress, createWallet } from '../model/wallet';
import {
  walletConnectLoadState,
  walletConnectClearState,
} from '../redux/walletconnect';
import withHideSplashScreen from './withHideSplashScreen';
import withAccountAddress from './withAccountAddress';

const PromiseAllWithFails = async (promises) => (
  Promise.all(promises.map(promise => (
    (promise && promise.catch)
      ? promise.catch(error => error)
      : promise
  ))));

const walletInitialization = async (isImported, isNew, walletAddress, ownProps) => {
  if (isNil(walletAddress)) {
    Alert.alert('Import failed due to an invalid private key. Please try again.');
    return null;
  }
  if (isImported) {
    await ownProps.clearAccountData();
  }
  ownProps.settingsUpdateAccountAddress(walletAddress, 'RAINBOWWALLET');
  if (isNew) {
    ownProps.setIsWalletEthZero(true);
  } else if (isImported) {
    await ownProps.checkEthBalance(walletAddress);
  } else {
    const isWalletEmpty = await getIsWalletEmpty(walletAddress, 'mainnet');
    if (isNil(isWalletEmpty)) {
      ownProps.checkEthBalance(walletAddress);
    } else {
      ownProps.setIsWalletEthZero(isWalletEmpty);
    }
  }
  if (!(isImported || isNew)) {
    await ownProps.loadAccountData();
  }
  ownProps.onHideSplashScreen();
  ownProps.initializeAccountData();
  return walletAddress;
}

export default Component => compose(
  connect(null, {
    clearIsWalletEmpty,
    clearOpenFamilyTab,
    dataClearState,
    dataInit,
    dataLoadState,
    nonceClearState,
    requestsClearState,
    requestsLoadState,
    setIsWalletEthZero,
    settingsLoadState,
    settingsUpdateAccountAddress,
    settingsUpdateAccountColor,
    settingsUpdateAccountName,
    uniqueTokensClearState,
    uniqueTokensLoadState,
    uniqueTokensRefreshState,
    uniswapClearState,
    uniswapLoadState,
    uniswapUpdateState,
    walletConnectClearState,
    walletConnectLoadState,
  }),
  withAccountAddress,
  withHideSplashScreen,
  withHandlers({
    checkEthBalance: (ownProps) => async (walletAddress) => {
      try {
        const ethBalance = await hasEthBalance(walletAddress);
        ownProps.setIsWalletEthZero(!ethBalance);
      } catch (error) {
        console.log('Error: Checking eth balance', error);
      }
    },
    clearAccountData: (ownProps) => async () => {
      const p1 = ownProps.clearIsWalletEmpty();
      const p3 = ownProps.clearOpenFamilyTab();
      const p4 = ownProps.walletConnectClearState();
      const p5 = ownProps.nonceClearState();
      const p6 = ownProps.requestsClearState();
      const p7 = ownProps.uniswapClearState();
      return PromiseAllWithFails([p1, p3, p4, p5, p6, p7]);
    },
    initializeAccountData: (ownProps) => async () => {
      try {
        ownProps.dataInit();
        await ownProps.uniqueTokensRefreshState();
      } catch (error) {
        // TODO
      }
    },
    loadAccountData: (ownProps) => async () => {
      const p1 = ownProps.settingsLoadState();
      const p2 = ownProps.dataLoadState();
      const p3 = ownProps.uniqueTokensLoadState();
      const p4 = ownProps.walletConnectLoadState();
      const p5 = ownProps.uniswapLoadState();
      const p6 = ownProps.requestsLoadState();
      return PromiseAllWithFails([p1, p2, p3, p4, p5, p6]);
    },
    refreshAccountData: (ownProps) => async () => {
      try {
        const getUniswap = ownProps.uniswapUpdateState();
        const getUniqueTokens = ownProps.uniqueTokensRefreshState();

        return Promise.all([
          delay(1250), // minimum duration we want the "Pull to Refresh" animation to last
          getUniswap,
          getUniqueTokens,
        ]);
      } catch (error) {
        console.log('Error refreshing data', error);
        throw error;
      }
    },
  }),
  withHandlers({
    createNewWallet: (ownProps) => async () => {
      try {
        const name = ownProps.accountName || 'My Wallet';
        const color = ownProps.accountColor || 0;
        const walletAddress = await createWallet(false, name, color);
        ownProps.settingsUpdateAccountName(name);
        ownProps.settingsUpdateAccountColor(color);
        await ownProps.uniqueTokensLoadState(walletAddress);
        await ownProps.dataLoadState(walletAddress);
        return await walletInitialization(false, true, walletAddress, ownProps);
      } catch (error) {
        // TODO specify error states more granular
        ownProps.onHideSplashScreen();
        Alert.alert('Import failed due to an invalid private key. Please try again.');
        return null;
      }
    },
    initializeWallet: (ownProps) => async (seedPhrase) => {
      try {
        const { isImported, isNew, walletAddress } = await walletInit(seedPhrase, ownProps.accountName, ownProps.accountColor);
        let name = ownProps.accountName ? ownProps.accountName : 'My Wallet';
        let color = ownProps.accountColor ? ownProps.accountColor : 0;

        if (!ownProps.accountName && !ownProps.accountColor) {
          const localData = await loadUserDataForAddress(walletAddress);
          if (localData) {
            name = localData.searchedName;
            color = localData.searchedColor;
          }
        }

        ownProps.settingsUpdateAccountName(name);
        ownProps.settingsUpdateAccountColor(color);
        await ownProps.uniqueTokensLoadState(walletAddress);
        await ownProps.dataLoadState(walletAddress);
        return await walletInitialization(isImported, isNew, walletAddress, ownProps);
      } catch (error) {
        // TODO specify error states more granular
        ownProps.onHideSplashScreen();
        Alert.alert('Import failed due to an invalid private key. Please try again.');
        return null;
      }
    },
    initializeWalletWithProfile: (ownProps) => async (isImported, isNew, profile) => {
      try {
        saveWalletDetails(profile.name, profile.color, profile.seedPhrase, profile.privateKey, profile.address);
        ownProps.settingsUpdateAccountName(profile.name);
        ownProps.settingsUpdateAccountColor(profile.color);
        saveName(profile.name);
        await ownProps.uniqueTokensLoadState(profile.address);
        await ownProps.dataLoadState(profile.address);
        return await walletInitialization(isImported, isNew, profile.address, ownProps);
      } catch (error) {
        // TODO specify error states more granular
        ownProps.onHideSplashScreen();
        Alert.alert('Import failed due to an invalid private key. Please try again.');
        return null;
      }
    },
  }),
)(Component);
