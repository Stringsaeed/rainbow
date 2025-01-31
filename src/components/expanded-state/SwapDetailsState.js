import PropTypes from 'prop-types';
import React, { useEffect } from 'react';
import { useNavigation } from 'react-navigation-hooks';
import { colors, padding, position } from '../../styles';
import { TouchableScale } from '../animations';
import { FloatingEmojis, FloatingEmojisTapHandler } from '../floating-emojis';
import {
  ColumnWithMargins,
  KeyboardFixedOpenLayout,
  Row,
  RowWithMargins,
} from '../layout';
import { Emoji, Text } from '../text';
import TouchableBackdrop from '../TouchableBackdrop';
import { AssetPanel } from './asset-panel';
import FloatingPanels from './FloatingPanels';

const DetailsRow = ({ label, value, ...props }) => (
  <Row {...props} align="center" justify="space-between">
    <Text flex={0} size="lmedium">
      {label}
    </Text>
    <Text
      align="right"
      color={colors.alpha(colors.dark, 0.6)}
      letterSpacing="roundedTight"
      size="lmedium"
    >
      {value}
    </Text>
  </Row>
);

const SwapDetailsState = ({
  inputCurrencySymbol,
  inputExecutionRate,
  inputNativePrice,
  onRefocusInput,
  outputCurrencySymbol,
  outputExecutionRate,
  outputNativePrice,
}) => {
  const { goBack } = useNavigation();
  useEffect(() => () => onRefocusInput(), [onRefocusInput]);

  let emoji = 'unicorn_face';
  if ([inputCurrencySymbol, outputCurrencySymbol].includes('FAME')) {
    emoji = 'prayer_beads';
  } else if ([inputCurrencySymbol, outputCurrencySymbol].includes('SOCKS')) {
    emoji = 'socks';
  }

  return (
    <KeyboardFixedOpenLayout>
      <TouchableBackdrop onPress={goBack} />
      <FloatingPanels maxWidth={275} width={275}>
        <FloatingEmojis
          distance={350}
          duration={2000}
          emoji={emoji}
          size={36}
          wiggleFactor={1}
        >
          {({ onNewEmoji }) => (
            <FloatingEmojisTapHandler onNewEmoji={onNewEmoji}>
              <TouchableScale activeScale={1.01}>
                <AssetPanel overflow="visible" radius={20}>
                  <ColumnWithMargins
                    {...position.centeredAsObject}
                    css={padding(24, 19)}
                    margin={24}
                  >
                    {inputCurrencySymbol && inputExecutionRate && (
                      <DetailsRow
                        label={`1 ${inputCurrencySymbol}`}
                        value={`${inputExecutionRate} ${outputCurrencySymbol}`}
                      />
                    )}
                    {outputCurrencySymbol && outputExecutionRate && (
                      <DetailsRow
                        label={`1 ${outputCurrencySymbol}`}
                        value={`${outputExecutionRate} ${inputCurrencySymbol}`}
                      />
                    )}
                    {inputCurrencySymbol && inputNativePrice && (
                      <DetailsRow
                        label={inputCurrencySymbol}
                        value={inputNativePrice}
                      />
                    )}
                    {outputCurrencySymbol && outputNativePrice && (
                      <DetailsRow
                        label={outputCurrencySymbol}
                        value={outputNativePrice}
                      />
                    )}
                    <Row align="center" justify="space-between">
                      <Text size="lmedium">Exchange</Text>
                      <RowWithMargins align="center" margin={2}>
                        <Emoji
                          lineHeight="none"
                          name="unicorn_face"
                          size="lmedium"
                          weight="medium"
                        />
                        <Text
                          align="right"
                          color="#E540F1"
                          letterSpacing="roundedTight"
                          size="lmedium"
                          weight="semibold"
                        >
                          Uniswap
                        </Text>
                      </RowWithMargins>
                    </Row>
                  </ColumnWithMargins>
                </AssetPanel>
              </TouchableScale>
            </FloatingEmojisTapHandler>
          )}
        </FloatingEmojis>
      </FloatingPanels>
    </KeyboardFixedOpenLayout>
  );
};

SwapDetailsState.propTypes = {
  inputCurrencySymbol: PropTypes.string,
  inputExecutionRate: PropTypes.string,
  inputNativePrice: PropTypes.string,
  outputCurrencySymbol: PropTypes.string,
  outputExecutionRate: PropTypes.string,
  outputNativePrice: PropTypes.string,
};

export default React.memo(SwapDetailsState);
