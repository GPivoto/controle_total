import React, { useState, useEffect, useRef } from 'react';
import { useHistory } from 'react-router-dom';
import { Button } from '@material-ui/core';
import KeyboardIcon from '@material-ui/icons/Keyboard';
import VolumeUpIcon from '@material-ui/icons/VolumeUp';
import './Home.css';

// Layout do teclado interativo (4 linhas)
const layoutTeclado = [
  ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'Ç'],
  ['Z', 'X', 'C', 'V', 'B', 'N', 'M', 'ESPAÇO', 'APAGAR']
];

export default function Home() {
  const history = useHistory();
  const [mostrarTeclado, setMostrarTeclado] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(0); // 0 = Teclado, 1 = Cards
  const [textoDigitado, setTextoDigitado] = useState('');

  // linhaSel: -1 representa a área superior (botões "← Voltar" e "🔊 Falar")
  // topoColSel: 0 = "← Voltar", 1 = "🔊 Falar"
  const [linhaSel, setLinhaSel] = useState(0);
  const [colSel, setColSel] = useState(0);
  const [topoColSel, setTopoColSel] = useState(0);
  const lastEnterTime = useRef(0);

  // Função para sintetizar a frase montada em áudio
  const falarFrase = texto => {
    if (!texto) return;
    window.speechSynthesis.cancel(); // Cancela falas anteriores
    const utterance = new SpeechSynthesisUtterance(texto);
    utterance.lang = 'pt-BR';
    utterance.rate = 0.9; // Leitura pausada e limpa
    window.speechSynthesis.speak(utterance);
  };

  // Escuta os eventos das teclas
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

        // --- NAVEGAÇÃO DENTRO DO TECLADO OVERLAY ---
        if (mostrarTeclado) {
          if (event.key === 'ArrowUp') {
            if (linhaSel === -1) {
              // Se está no topo (Voltar ou Falar), vai para a última linha do teclado
              const novaLinha = layoutTeclado.length - 1;
              setLinhaSel(novaLinha);
              setColSel(prev =>
                Math.min(prev, layoutTeclado[novaLinha].length - 1)
              );
            } else if (linhaSel === 0) {
              // Se está na primeira linha (1, 2, 3...), sobe para o topo
              setLinhaSel(-1);
            } else {
              const novaLinha = linhaSel - 1;
              setLinhaSel(novaLinha);
              setColSel(prev =>
                Math.min(prev, layoutTeclado[novaLinha].length - 1)
              );
            }
          } else if (event.key === 'ArrowDown') {
            if (linhaSel === -1) {
              // Se está no topo (Voltar ou Falar), desce para a primeira linha do teclado
              setLinhaSel(0);
              setColSel(prev => Math.min(prev, layoutTeclado[0].length - 1));
            } else if (linhaSel === layoutTeclado.length - 1) {
              // Se está na última linha, sobe para o topo
              setLinhaSel(-1);
            } else {
              const novaLinha = linhaSel + 1;
              setLinhaSel(novaLinha);
              setColSel(prev =>
                Math.min(prev, layoutTeclado[novaLinha].length - 1)
              );
            }
          } else if (event.key === 'ArrowLeft') {
            if (linhaSel === -1) {
              // No topo: alterna entre Falar (1) e Voltar (0)
              setTopoColSel(prev => (prev === 1 ? 0 : 1));
            } else {
              const totalColunas = layoutTeclado[linhaSel].length;
              setColSel(prev => (prev > 0 ? prev - 1 : totalColunas - 1));
            }
          } else if (event.key === 'ArrowRight') {
            if (linhaSel === -1) {
              // No topo: alterna entre Voltar (0) e Falar (1)
              setTopoColSel(prev => (prev === 0 ? 1 : 0));
            } else {
              const totalColunas = layoutTeclado[linhaSel].length;
              setColSel(prev => (prev < totalColunas - 1 ? prev + 1 : 0));
            }
          } else if (event.key === 'Enter') {
            if (linhaSel === -1) {
              if (topoColSel === 0) {
                // Enter no botão "← Voltar"
                setMostrarTeclado(false);
                setLinhaSel(0);
              } else if (topoColSel === 1) {
                // Enter no botão "🔊 Falar" -> Executa a leitura da frase
                falarFrase(textoDigitado);
              }
            } else {
              // Enter em uma tecla do teclado
              const tecla = layoutTeclado[linhaSel][colSel];
              if (tecla === 'ESPAÇO') {
                setTextoDigitado(prev => prev + ' ');
              } else if (tecla === 'APAGAR') {
                setTextoDigitado(prev => prev.slice(0, -1));
              } else {
                setTextoDigitado(prev => prev + tecla);
              }
            }
          }
          return;
        }

        // --- NAVEGAÇÃO NA TELA HOME ORIGINAL ---
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
      history
    ]
  );

  // Estilo do foco nos botões da Home
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

      {/* MODAL DO TECLADO OVERLAY */}
      {mostrarTeclado && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: '#0a2540',
            zIndex: 999999,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
        >
          {/* BOTÃO VOLTAR (linhaSel === -1 && topoColSel === 0) */}
          <button
            onClick={() => {
              setMostrarTeclado(false);
              setLinhaSel(0);
            }}
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

          <h2 style={{ marginBottom: '20px', color: '#ffffff' }}>
            Teclado Interativo
          </h2>

          {/* ÁREA DE EXIBIÇÃO DO TEXTO + BOTÃO FALAR */}
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

            {/* BOTÃO FALAR (linhaSel === -1 && topoColSel === 1) */}
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

          {/* TECLADO DE TECLAS */}
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
                      {tecla}
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
