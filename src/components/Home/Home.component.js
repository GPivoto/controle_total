import React, { useState, useEffect, useRef } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { Button } from '@material-ui/core';
import KeyboardIcon from '@material-ui/icons/Keyboard';
import VolumeUpIcon from '@material-ui/icons/VolumeUp';
import './Home.css';

const layoutTeclado = [
  ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'Ç'],
  ['CAPS', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'ESPAÇO', 'APAGAR']
];

export default function Home() {
  const history = useHistory();
  const location = useLocation();

  const [mostrarTeclado, setMostrarTeclado] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [textoDigitado, setTextoDigitado] = useState('');
  const [isCapslock, setIsCapslock] = useState(false);

  // === NOVAS MEMÓRIAS ===
  const [veioDosCards, setVeioDosCards] = useState(false);
  const [fraseOriginal, setFraseOriginal] = useState('');
  const [caminhoDeVolta, setCaminhoDeVolta] = useState('/board/main');

  useEffect(
    () => {
      if (location.state && typeof location.state.frasePronta === 'string') {
        const textoInicial = location.state.frasePronta
          ? location.state.frasePronta + ' '
          : '';

        setFraseOriginal(location.state.frasePronta); // Salva a original sem o espaço extra
        setCaminhoDeVolta(location.state.returnPath || '/board/main'); // Salva de qual pasta ele veio
        setTextoDigitado(textoInicial);
        setMostrarTeclado(true);
        setVeioDosCards(true);

        history.replace({ ...location, state: undefined });
      }
    },
    [location, history]
  );

  const falarFrase = texto => {
    if (!texto) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(texto);
    utterance.lang = 'pt-BR';
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  };

  // === A MÁGICA DE VOLTAR COM O TEXTO ===
  const fecharTeclado = () => {
    if (veioDosCards) {
      // Força a volta enviando o que ele digitou a mais!
      history.push({
        pathname: caminhoDeVolta,
        state: {
          textoFinal: textoDigitado.trim(),
          fraseAntiga: fraseOriginal.trim()
        }
      });
    } else {
      setMostrarTeclado(false);
      setLinhaSel(0);
    }
  };

  const [linhaSel, setLinhaSel] = useState(0);
  const [colSel, setColSel] = useState(0);
  const [topoColSel, setTopoColSel] = useState(0);
  const lastEnterTime = useRef(0);

  useEffect(
    () => {
      const handleKeyDown = event => {
        if (
          ['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp', 'Enter'].includes(
            event.key
          )
        ) {
          event.preventDefault();
        }

        if (mostrarTeclado) {
          if (event.key === 'ArrowUp') {
            if (linhaSel === -1) {
              if (topoColSel === 1) {
                setTopoColSel(0);
              } else {
                const novaLinha = layoutTeclado.length - 1;
                setLinhaSel(novaLinha);
                setColSel(prev =>
                  Math.min(prev, layoutTeclado[novaLinha].length - 1)
                );
              }
            } else if (linhaSel === 0) {
              setLinhaSel(-1);
              setTopoColSel(1);
            } else {
              const novaLinha = linhaSel - 1;
              setLinhaSel(novaLinha);
              setColSel(prev =>
                Math.min(prev, layoutTeclado[novaLinha].length - 1)
              );
            }
          } else if (event.key === 'ArrowDown') {
            if (linhaSel === -1) {
              if (topoColSel === 0) {
                setTopoColSel(1);
              } else {
                setLinhaSel(0);
                setColSel(prev => Math.min(prev, layoutTeclado[0].length - 1));
              }
            } else if (linhaSel === layoutTeclado.length - 1) {
              setLinhaSel(-1);
              setTopoColSel(0);
            } else {
              const novaLinha = linhaSel + 1;
              setLinhaSel(novaLinha);
              setColSel(prev =>
                Math.min(prev, layoutTeclado[novaLinha].length - 1)
              );
            }
          } else if (event.key === 'ArrowLeft') {
            if (linhaSel === -1) {
              setTopoColSel(prev => (prev === 1 ? 0 : 1));
            } else {
              const totalColunas = layoutTeclado[linhaSel].length;
              setColSel(prev => (prev > 0 ? prev - 1 : totalColunas - 1));
            }
          } else if (event.key === 'ArrowRight') {
            if (linhaSel === -1) {
              setTopoColSel(prev => (prev === 0 ? 1 : 0));
            } else {
              const totalColunas = layoutTeclado[linhaSel].length;
              setColSel(prev => (prev < totalColunas - 1 ? prev + 1 : 0));
            }
          } else if (event.key === 'Enter') {
            if (linhaSel === -1) {
              if (topoColSel === 0) {
                fecharTeclado();
              } else if (topoColSel === 1) {
                falarFrase(textoDigitado);
              }
            } else {
              const tecla = layoutTeclado[linhaSel][colSel];

              if (tecla === 'CAPS') {
                setIsCapslock(prev => !prev);
              } else if (tecla === 'ESPAÇO') {
                setTextoDigitado(prev => prev + ' ');
              } else if (tecla === 'APAGAR') {
                setTextoDigitado(prev => prev.slice(0, -1));
              } else {
                const caractere =
                  !isCapslock && /^[A-ZÇ]$/.test(tecla)
                    ? tecla.toLowerCase()
                    : tecla;
                setTextoDigitado(prev => prev + caractere);
              }
            }
          }
          return;
        }

        if (event.key === 'Enter') {
          const agora = Date.now();
          if (agora - lastEnterTime.current < 400) return;
          lastEnterTime.current = agora;

          if (focusedIndex === 0) {
            setMostrarTeclado(true);
            setLinhaSel(0);
            setColSel(0);
            setTopoColSel(0);
          } else if (focusedIndex === 1) {
            history.push('/board/cards');
          }
        } else if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
          setFocusedIndex(prevIndex => (prevIndex === 0 ? 1 : 0));
        }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    },
    [
      mostrarTeclado,
      focusedIndex,
      linhaSel,
      colSel,
      topoColSel,
      textoDigitado,
      history,
      isCapslock,
      veioDosCards,
      fraseOriginal,
      caminhoDeVolta
    ]
  );

  const getButtonStyle = index => {
    const isFocused = focusedIndex === index;
    return isFocused
      ? {
          outline: '6px solid #0055ff',
          outlineOffset: '4px',
          borderRadius: '5px',
          transform: 'scale(1.05)',
          transition: '0.2s',
          zIndex: 10
        }
      : { transition: '0.2s' };
  };

  return (
    <div className="home-container">
      <h1 className="home-title">Controle Total</h1>
      <div className="home-button-group">
        <Button
          variant="contained"
          className="home-button"
          startIcon={<KeyboardIcon />}
          onClick={() => {
            setMostrarTeclado(true);
            setLinhaSel(0);
            setColSel(0);
            setTopoColSel(0);
          }}
          style={getButtonStyle(0)}
        >
          Teclado
        </Button>
        <Button
          variant="contained"
          className="home-button"
          startIcon={<VolumeUpIcon />}
          onClick={() => history.push('/board/cards')}
          style={getButtonStyle(1)}
        >
          Cards
        </Button>
      </div>

      {mostrarTeclado && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'linear-gradient(180deg, #a2e9f3 0%, #76d7e5 100%)',
            zIndex: 999999,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
        >
          <button
            onClick={fecharTeclado}
            style={{
              position: 'absolute',
              top: '20px',
              left: '20px',
              padding: '12px 24px',
              fontSize: '16px',
              cursor: 'pointer',
              borderRadius: '6px',
              border:
                linhaSel === -1 && topoColSel === 0
                  ? '4px solid #ffcc00'
                  : 'none',
              backgroundColor:
                linhaSel === -1 && topoColSel === 0 ? '#0056b3' : '#ffffff',
              color:
                linhaSel === -1 && topoColSel === 0 ? '#ffffff' : '#0a2540',
              transform:
                linhaSel === -1 && topoColSel === 0
                  ? 'scale(1.15)'
                  : 'scale(1)',
              transition: 'all 0.1s ease',
              fontWeight: 'bold'
            }}
          >
            ← Voltar
          </button>
          <h2
            style={{
              marginBottom: '20px',
              color: '#0a2540', // Azul escuro para dar contraste
              fontSize: '32px', // Um pouquinho maior
              fontWeight: '900', // Bem gordinho/destacado
              textShadow: '1px 1px 3px rgba(0,0,0,0.15)' // Sombra sutil para descolar do fundo
            }}
          >
            Teclado Interativo
          </h2>
          <div
            style={{
              display: 'flex',
              gap: '12px',
              width: '90%',
              maxWidth: '800px',
              marginBottom: '25px',
              alignItems: 'center'
            }}
          >
            <div
              style={{
                flex: 1,
                backgroundColor: '#ffffff',
                color: '#000000',
                fontSize: '28px',
                padding: '15px',
                borderRadius: '8px',
                minHeight: '50px',
                textAlign: 'center',
                wordBreak: 'break-word'
              }}
            >
              {textoDigitado || (
                <span style={{ color: '#aaaaaa', fontSize: '20px' }}>
                  Use as setas para navegar e Enter para digitar...
                </span>
              )}
            </div>
            <button
              onClick={() => falarFrase(textoDigitado)}
              style={{
                padding: '15px 25px',
                fontSize: '20px',
                cursor: 'pointer',
                borderRadius: '8px',
                border:
                  linhaSel === -1 && topoColSel === 1
                    ? '4px solid #ffcc00'
                    : '2px solid transparent',
                backgroundColor:
                  linhaSel === -1 && topoColSel === 1 ? '#0056b3' : '#28a745',
                color: '#ffffff',
                transform:
                  linhaSel === -1 && topoColSel === 1
                    ? 'scale(1.15)'
                    : 'scale(1)',
                transition: 'all 0.1s ease',
                fontWeight: 'bold',
                whiteSpace: 'nowrap'
              }}
            >
              🔊 Falar
            </button>
          </div>
          <div
            style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}
          >
            {layoutTeclado.map((linha, lIndex) => (
              <div
                key={lIndex}
                style={{
                  display: 'flex',
                  gap: '8px',
                  justifyContent: 'center'
                }}
              >
                {linha.map((tecla, cIndex) => {
                  const estaSelecionada =
                    linhaSel === lIndex && colSel === cIndex;
                  let labelTecla = tecla;
                  if (tecla === 'CAPS')
                    labelTecla = isCapslock ? '⬆ MAIÚS' : '⬇ minús';
                  else if (!isCapslock && /^[A-ZÇ]$/.test(tecla))
                    labelTecla = tecla.toLowerCase();
                  return (
                    <button
                      key={cIndex}
                      style={{
                        padding: '12px 18px',
                        fontSize: '18px',
                        borderRadius: '6px',
                        border: estaSelecionada
                          ? '4px solid #ffcc00'
                          : '2px solid transparent',
                        backgroundColor: estaSelecionada
                          ? '#0056b3'
                          : '#ffffff',
                        color: estaSelecionada ? '#ffffff' : '#000000',
                        transform: estaSelecionada ? 'scale(1.15)' : 'scale(1)',
                        transition: 'all 0.1s ease',
                        fontWeight: estaSelecionada ? 'bold' : 'normal'
                      }}
                    >
                      {labelTecla}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
