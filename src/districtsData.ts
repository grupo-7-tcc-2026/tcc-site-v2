const resposta = await fetch(`${import.meta.env.VITE_APP_URL}/distritos`);
export const SP_DISTRICTS = await resposta.json();
localStorage.setItem('distritos', JSON.stringify(SP_DISTRICTS));