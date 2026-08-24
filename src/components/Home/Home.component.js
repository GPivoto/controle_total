import React, { useEffect } from 'react';
import { useHistory } from 'react-router-dom';

export default function Home() {
  const history = useHistory();

  useEffect(
    () => {
      // Redireciona o Junior direto para a tela de cards instantaneamente
      history.push('/board/cards');
    },
    [history]
  );

  // Retorna um fundo da mesma cor do app só para não piscar branco durante o redirecionamento
  return <div style={{ backgroundColor: '#7cdcf4', height: '100vh' }} />;
}
