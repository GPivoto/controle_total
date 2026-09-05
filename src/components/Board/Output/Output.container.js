import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { injectIntl, intlShape } from 'react-intl';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom'; // Ferramenta de navegação
import keycode from 'keycode';
import shortid from 'shortid';
import messages from '../Board.messages';
import { showNotification } from '../../Notifications/Notifications.actions';
import { isAndroid } from '../../../cordova-util';

import {
  cancelSpeech,
  speak
} from '../../../providers/SpeechProvider/SpeechProvider.actions';

import { changeOutput, clickOutput, changeLiveMode } from '../Board.actions';
import SymbolOutput from './SymbolOutput';

function translateOutput(output, intl) {
  const translatedOutput = output.map(value => {
    let translatedValue = { ...value };

    if (value.labelKey && intl.messages[value.labelKey]) {
      translatedValue.label = intl.formatMessage({ id: value.labelKey });
    }
    return translatedValue;
  });
  return translatedOutput;
}

export class OutputContainer extends Component {
  static propTypes = {
    intl: intlShape,
    clickOutput: PropTypes.func.isRequired,
    output: PropTypes.arrayOf(
      PropTypes.shape({
        image: PropTypes.string,
        label: PropTypes.oneOfType([PropTypes.string, PropTypes.node])
      })
    ),
    history: PropTypes.object.isRequired,
    location: PropTypes.object.isRequired
  };

  static getDerivedStateFromProps(props, state) {
    if (props.output.length !== state.translatedOutput.length) {
      const translatedOutput = translateOutput(props.output, props.intl);
      return { translatedOutput };
    }
    return null;
  }

  state = {
    translatedOutput: []
  };

  // === A MÁGICA DA VOLTA DO TECLADO ===
  processarVoltaDoTeclado = () => {
    const { location, history, changeOutput, output } = this.props;

    if (
      location &&
      location.state &&
      typeof location.state.textoFinal === 'string'
    ) {
      const { textoFinal, fraseAntiga } = location.state;

      // Limpa o "radar" do React Router imediatamente para não entrar em loop infinito
      history.replace({ ...location, state: undefined });
      const imagemInvisivel =
        'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIiB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCI+PC9zdmc+';

      // Se o usuário digitou ou apagou alguma coisa
      if (textoFinal !== fraseAntiga) {
        if (textoFinal === '') {
          // Se apagou tudo no teclado, limpa a barra
          changeOutput([]);
        } else if (textoFinal.startsWith(fraseAntiga)) {
          // Se adicionou palavras no final, isola só a palavra nova num card texto
          const textoAdicionado = textoFinal
            .substring(fraseAntiga.length)
            .trim();
          if (textoAdicionado) {
            const novoCardTexto = {
              id: shortid.generate(),
              label: textoAdicionado,
              image: imagemInvisivel,
              backgroundColor: 'rgb(255, 241, 118)' // Card Amarelinho
            };
            changeOutput([...output, novoCardTexto]);
          }
        } else {
          // Se alterou no meio da frase, junta tudo num card gigante
          const novoCardTexto = {
            id: shortid.generate(),
            label: textoFinal,
            image: imagemInvisivel,
            backgroundColor: 'rgb(255, 241, 118)'
          };
          changeOutput([novoCardTexto]);
        }
      }
    }
  };

  componentDidMount() {
    document.addEventListener('keydown', this.handleRepeatLastSpokenSentence);
    document.addEventListener('keydown', this.handleSpeakShortcut);
    this.processarVoltaDoTeclado(); // Checa na primeira vez que abre
  }

  componentDidUpdate(prevProps) {
    // Se o React atualizou a tela (veio do teclado) em vez de recarregar, nós checamos de novo!
    if (this.props.location !== prevProps.location) {
      this.processarVoltaDoTeclado();
    }
  }

  componentWillUnmount() {
    document.removeEventListener(
      'keydown',
      this.handleRepeatLastSpokenSentence
    );
    document.removeEventListener('keydown', this.handleSpeakShortcut);
  }

  outputReducer(accumulator, currentValue) {
    const actionValue =
      currentValue.action &&
      currentValue.action.startsWith('+') &&
      currentValue.action.slice(1);

    const symbolValue = currentValue.vocalization || currentValue.label;
    const value = actionValue || ` ${symbolValue}`;

    return ` ${accumulator}${value}`;
  }

  clearOutput() {
    const { changeOutput, isLiveMode } = this.props;
    const output = [];
    isLiveMode ? this.addLiveOutputTileClearOutput() : changeOutput(output);
  }

  popOutput() {
    const { changeOutput, isLiveMode } = this.props;
    const output = [...this.props.output];
    output.pop();
    isLiveMode && output.length === 0
      ? this.addLiveOutputTileClearOutput()
      : changeOutput(output);
  }

  spliceOutput(index) {
    const { changeOutput, isLiveMode } = this.props;
    const output = [...this.props.output];
    output.splice(index, 1);
    isLiveMode && output.length === 0
      ? this.addLiveOutputTileClearOutput()
      : changeOutput(output);
  }

  async speakOutput(text) {
    this.props.clickOutput(text.trim());
    return new Promise(resolve => {
      const { cancelSpeech, speak } = this.props;

      const onend = () => {
        resolve();
      };

      cancelSpeech();
      speak(text, onend);
    });
  }

  groupOutputByType() {
    const outputFrames = [[]];

    this.state.translatedOutput.forEach((value, index, arr) => {
      const prevValue = index ? arr[index - 1] : arr[0];
      let frame;

      if (Boolean(value.sound) !== Boolean(prevValue.sound)) {
        frame = [];
        outputFrames.push(frame);
      } else {
        frame = outputFrames[outputFrames.length - 1];
      }

      frame.push(value);
    });

    return outputFrames;
  }

  playAudio(src) {
    return new Promise((resolve, reject) => {
      let audio = new Audio();

      audio.onended = () => {
        resolve();
      };

      audio.src = src;
      audio.play();
    });
  }

  async asyncForEach(array, callback) {
    for (let index = 0; index < array.length; index++) {
      await callback(array[index], index, array);
    }
  }

  async play(liveText = '') {
    if (liveText) {
      await this.speakOutput(liveText);
    } else {
      const outputFrames = this.groupOutputByType();

      await this.asyncForEach(outputFrames, async frame => {
        if (!frame[0]?.sound) {
          const text = frame.reduce(this.outputReducer, '');
          await this.speakOutput(text);
        } else {
          await new Promise(resolve => {
            this.asyncForEach(frame, async ({ sound }, index) => {
              await this.playAudio(sound);

              if (frame.length - 1 === index) {
                resolve();
              }
            });
          });
        }
      });
    }
  }

  handleBackspaceClick = () => {
    const { cancelSpeech } = this.props;
    cancelSpeech();
    this.popOutput();
  };

  handleClearClick = () => {
    const { cancelSpeech } = this.props;
    cancelSpeech();
    this.clearOutput();
  };

  handlePhraseToShare = () => {
    if (this.props.output.length) {
      const labels = this.props.output.map(symbol => symbol.label);
      return labels.join(' ');
    }
    return '';
  };

  handleKeyboardClick = () => {
    const phrase = this.handlePhraseToShare();
    this.props.history.push({
      pathname: '/',
      state: {
        frasePronta: phrase,
        returnPath: this.props.location.pathname // Manda a pasta exata pros cards
      }
    });
  };

  handleCopyClick = async () => {
    const { intl, showNotification } = this.props;
    const labels = this.props.output.map(symbol => symbol.label);
    try {
      if (isAndroid()) {
        await window.cordova.plugins.clipboard.copy(labels.join(' '));
      } else {
        await navigator.clipboard.writeText(labels.join(' '));
      }
      showNotification(intl.formatMessage(messages.copyMessage));
    } catch (err) {
      showNotification(intl.formatMessage(messages.failedToCopy));
      console.log(err.message);
    }
  };

  handleRemoveClick = index => event => {
    const { cancelSpeech } = this.props;
    cancelSpeech();
    this.spliceOutput(index);
  };

  handleRepeatLastSpokenSentence = event => {
    const Z_KEY_CODE = 90;
    const Y_KEY_CODE = 89;
    const { output } = this.props;
    if (
      ((event.ctrlKey && event.shiftKey && event.keyCode === Z_KEY_CODE) ||
        (event.ctrlKey && event.keyCode === Y_KEY_CODE)) &&
      !!output.length
    ) {
      const isLastSpokenSymbol = (element, index) => {
        if (output.length === 1) return true;
        if (element.label) {
          return element.type === 'live' ? index < output.length - 1 : true;
        }
        return false;
      };

      const lastSpokenSymbol = output.findLast((element, index) =>
        isLastSpokenSymbol(element, index)
      );
      const text = lastSpokenSymbol ? lastSpokenSymbol.label : '';
      this.speakOutput(text);
    }
  };

  handleSpeakShortcut = event => {
    const target = event.target.tagName.toLowerCase();
    if (target === 'input' || target === 'textarea') return;

    if (event.key.toLowerCase() === 'f') {
      event.preventDefault();
      this.play();
    }
  };

  handleOutputClick = event => {
    const targetEl = event.target;
    const targetElLow = targetEl.tagName.toLowerCase();
    if (targetElLow === 'div' || targetElLow === 'p') {
      this.play();
    }
  };

  handleOutputKeyDown = event => {
    if (event.keyCode === keycode('enter')) {
      const targetEl = event.target;
      if (targetEl.tagName.toLowerCase() === 'div') {
        this.play();
      } else if (targetEl.tagName.toLowerCase() === 'textarea') {
        this.play(event.target.value);
        this.addLiveOutputTile();
      }
    }
  };

  defaultLiveTile = {
    backgroundColor: 'rgb(255, 241, 118)',
    image: '',
    label: '',
    labelKey: '',
    type: 'live'
  };

  addLiveOutputTile() {
    const { changeOutput } = this.props;
    this.defaultLiveTile.id = shortid.generate();
    changeOutput([...this.state.translatedOutput, this.defaultLiveTile]);
  }

  addLiveOutputTileClearOutput() {
    const { changeOutput } = this.props;
    this.setState({ translatedOutput: [] });
    this.defaultLiveTile.id = shortid.generate();
    changeOutput([this.defaultLiveTile]);
  }

  handleSwitchLiveMode = event => {
    const { changeLiveMode, isLiveMode } = this.props;

    if (!isLiveMode) {
      this.addLiveOutputTile();
    }
    changeLiveMode();
  };

  handleWriteSymbol = index => event => {
    const { changeOutput, intl } = this.props;
    const output = [...this.props.output];
    const newEl = {
      ...output[index],
      label: event.target.value
    };
    output.splice(index, 1, newEl);
    changeOutput(output);
    const translated = translateOutput(output, intl);
    this.setState({ translatedOutput: translated });
  };

  render() {
    const {
      output,
      navigationSettings,
      isLiveMode,
      increaseOutputButtons
    } = this.props;
    const tabIndex = output.length ? '0' : '-1';
    return (
      <SymbolOutput
        onBackspaceClick={this.handleBackspaceClick}
        onClearClick={this.handleClearClick}
        onCopyClick={this.handleCopyClick}
        onRemoveClick={this.handleRemoveClick}
        onClick={isLiveMode ? undefined : this.handleOutputClick}
        onKeyDown={this.handleOutputKeyDown}
        onSwitchLiveMode={this.handleSwitchLiveMode}
        onKeyboardClick={this.handleKeyboardClick}
        symbols={this.state.translatedOutput}
        isLiveMode={isLiveMode}
        tabIndex={tabIndex}
        navigationSettings={navigationSettings}
        increaseOutputButtons={increaseOutputButtons}
        phrase={this.handlePhraseToShare()}
        onWriteSymbol={this.handleWriteSymbol}
      />
    );
  }
}

const mapStateToProps = ({ board, app }) => {
  return {
    output: board.output,
    isLiveMode: board.isLiveMode,
    navigationSettings: app.navigationSettings,
    increaseOutputButtons: app.displaySettings.increaseOutputButtons
  };
};

const mapDispatchToProps = {
  cancelSpeech,
  changeOutput,
  clickOutput,
  speak,
  showNotification,
  changeLiveMode
};

export default withRouter(
  connect(
    mapStateToProps,
    mapDispatchToProps
  )(injectIntl(OutputContainer))
);
