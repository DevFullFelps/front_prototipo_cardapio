const URL_API = "https://prototipo-cardapio.onrender.com/produtos";

async function carregarCardapio() {
    const container = document.getElementById("container-cardapio");
    container.innerHTML = `<p id="loading">Carregando o cardápio... (O servidor gratuito pode levar até 2 minutos para iniciar)</p>`;
    const resposta = await fetch(URL_API);
    const produtos = await resposta.json();
    container.innerHTML = ""
    produtos.forEach(produto => {
        const cardProduto = `
            <div style="border: 1px solid #ccc; padding: 10px; margin: 10px; border-radius: 8px;">
                <h3>${produto.nome}</h3>
                <p>Preço: R$ ${produto.preco.toFixed(2)}</p>
            </div>
        `
        container.innerHTML += cardProduto
    });
}

carregarCardapio();