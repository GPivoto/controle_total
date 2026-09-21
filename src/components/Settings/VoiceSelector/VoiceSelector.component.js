import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@material-ui/core';
import ArrowBackIcon from '@material-ui/icons/ArrowBack';
import VolumeUpIcon from '@material-ui/icons/VolumeUp';

import './VoiceSelector.css';

const VoiceSelector = ({ history }) => {
  const [selectedVoice, setSelectedVoice] = useState(0);
  const [systemVoices, setSystemVoices] = useState([]);

  const backRef = useRef(null);
  const voiceRefs = useRef([]);

  useEffect(() => {
    const carregarVozes = () => {
      const vozes = window.speechSynthesis.getVoices();

      setSystemVoices(vozes);

      console.log('Vozes disponíveis no sistema:');

      vozes.forEach((voice, index) => {
        console.log(index, voice.name, voice.lang);
      });
    };

    carregarVozes();

    window.speechSynthesis.onvoiceschanged = carregarVozes;

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  useEffect(
    () => {
      if (selectedVoice === 0) {
        if (backRef.current) {
          backRef.current.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        }

        return;
      }

      const card = voiceRefs.current[selectedVoice - 1];

      if (card) {
        card.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      }
    },
    [selectedVoice]
  );

  const falarAmostra = index => {
    if (!systemVoices.length) {
      console.log('Nenhuma voz disponível ainda.');
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(
      'Olá! Esta é uma amostra da minha voz.'
    );

    let vozEscolhida = null;

    if (index === 1) {
      // Voz masculina
      vozEscolhida = systemVoices.find(
        voice => voice.name === 'Microsoft Daniel - Portuguese (Brazil)'
      );

      utterance.pitch = 1;
      utterance.rate = 0.9;
    }

    if (index === 2) {
      // Voz feminina
      vozEscolhida = systemVoices.find(
        voice => voice.name === 'Microsoft Maria - Portuguese (Brazil)'
      );

      utterance.pitch = 1.25;
      utterance.rate = 1.08;
    }

    if (index === 3) {
      // Voz masculina rápida
      vozEscolhida = systemVoices.find(
        voice => voice.name === 'Microsoft Daniel - Portuguese (Brazil)'
      );

      utterance.pitch = 2.0;
      utterance.rate = 2.75;
    }

    if (index === 4) {
      // Voz feminina rápida
      vozEscolhida = systemVoices.find(
        voice => voice.name === 'Microsoft Maria - Portuguese (Brazil)'
      );

      utterance.pitch = 2.5;
      utterance.rate = 3.0;
    }

    if (vozEscolhida) {
      utterance.voice = vozEscolhida;
      utterance.lang = vozEscolhida.lang;
    } else {
      console.log('Voz não encontrada para a opção:', index);
      utterance.lang = 'pt-BR';
    }

    window.speechSynthesis.speak(utterance);
  };

  const selecionarAnterior = () => {
    setSelectedVoice(prev => {
      if (prev === 0) {
        return 4;
      }

      return prev - 1;
    });
  };

  const selecionarProximo = () => {
    setSelectedVoice(prev => {
      if (prev === 4) {
        return 0;
      }

      return prev + 1;
    });
  };

  useEffect(
    () => {
      const handleKeyDown = event => {
        if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
          event.preventDefault();
          selecionarProximo();
        }

        if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
          event.preventDefault();
          selecionarAnterior();
        }

        if (event.key === 'Enter') {
          event.preventDefault();

          if (selectedVoice === 0) {
            history.goBack();
            return;
          }

          falarAmostra(selectedVoice);
        }

        if (event.key === 'Escape') {
          history.goBack();
        }
      };

      window.addEventListener('keydown', handleKeyDown);

      return () => {
        window.removeEventListener('keydown', handleKeyDown);
      };
    },
    [selectedVoice, systemVoices, history]
  );

  const opcoes = [
    {
      nome: 'Voz masculina',
      descricao: 'Microsoft Daniel',
      emoji: '👨'
    },
    {
      nome: 'Voz feminina',
      descricao: 'Microsoft Maria',
      emoji: '👩'
    },
    {
      nome: 'Voz masculina rápida',
      descricao: 'Microsoft Daniel - velocidade diferente',
      emoji: '👨'
    },
    {
      nome: 'Voz feminina rápida',
      descricao: 'Microsoft Maria - velocidade diferente',
      emoji: '👩'
    }
  ];

  return (
    <div className="voice-selector">
      <div className="voice-header">
        <Button
          ref={backRef}
          variant="contained"
          startIcon={<ArrowBackIcon />}
          onClick={() => history.goBack()}
          className={
            selectedVoice === 0
              ? 'voice-back-button selected'
              : 'voice-back-button'
          }
        >
          Voltar
        </Button>

        <h1>Escolha uma voz</h1>
      </div>

      <div className="voice-options">
        {opcoes.map((opcao, index) => {
          const voiceIndex = index + 1;

          return (
            <div
              key={opcao.nome}
              ref={element => {
                voiceRefs.current[index] = element;
              }}
              className={
                selectedVoice === voiceIndex
                  ? 'voice-option selected'
                  : 'voice-option'
              }
              onClick={() => {
                setSelectedVoice(voiceIndex);
                falarAmostra(voiceIndex);
              }}
            >
              <VolumeUpIcon className="voice-volume-icon" />

              <div className="voice-emoji">{opcao.emoji}</div>

              <div className="voice-text">
                <h2>{opcao.nome}</h2>

                <p>{opcao.descricao}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default VoiceSelector;
