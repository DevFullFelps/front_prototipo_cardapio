const URL_API = "http://127.0.0.1:8000";

let produtosCarregados = [];
let carrinho = [];

async function CarregarCardapio() {
    try{
        const resposta = await fetch(`${URL_API}/produtos`);
        produtosCarregados = await resposta.json();

        const divCardapio = document.getElementById("cardapio");
        divCardapio.innerHTML = ""

        produtosCarregados.forEach(produto => {
            divCardapio.innerHTML += `
                <div class="item-produto">
                    <div>
                        <strong>${produto.nome}</strong> (${produto.categoria})<br>
                        <span style="color: #28a745;">R$ ${produto.preco.toFixed(2)}</span>
                    </div>
                    <button class="btn-add" onclick="adicionarAoCarrinho(${produto.id})">Adicionar</button>
                </div>
            `;
        });
    } catch (erro) {
        document.getElementById("cardapio").innerHTML = "Erro ao carregar cardápio. O servidor está ligado?"
    }
}

function adicionarAoCarrinho(produtoId){
    const itemExistente = carrinho.find(item => item.produto_id === produtoId);

    if (itemExistente){
        itemExistente.quantidade += 1;
    } else{
        carrinho.push({ produto_id: produtoId, quantidade: 1});
    }
    atualizarInterfaceCarrinho();
}

function atualizarInterfaceCarrinho() {
    const divItens = document.getElementById("itens-carrinho");
    const spanTotal = document.getElementById("total-carrinho");

    if (carrinho.length === 0){
        divItens.innerHTML = '<p style="color: #666;">Seu carrinho está vazio.</p>';
        spanTotal.innerText = "0.00";
        return;
    }


    divItens.innerHTML = "";
    let valorTotalGeral = 0;

    carrinho.forEach(item =>{
        const dadosProduto = produtosCarregados.find(p => p.id === item.produto_id);
        const subtotal = dadosProduto.preco * item.quantidade;
        valorTotalGeral += subtotal;
        divItens.innerHTML += `
            <div class="item-carrinho">
                <span>${dadosProduto.nome} (x${item.quantidade})</span>
                <span>R$ ${subtotal.toFixed(2)}</span>
            </div>
        `;
    });
    spanTotal.innerText = valorTotalGeral.toFixed(2)

}



async function enviarPedido(){
    if (carrinho.length === 0){
        alert("Adicione pelo menos um item ao carrinho antes de finalizar!");
        return;
    }

    try{
        const resposta = await fetch(`${URL_API}/pedidos`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(carrinho)
        });

        const resultado = await resposta.json();

        if (resposta.ok){
            alert(`Pedido #${resultado.pedido_id} realizado com sucesso! Total: R$ ${resultado.total.toFixed(2)}`);
            carrinho = []
            atualizarInterfaceCarrinho();
        } else {
            alert("Erro ao processar pedido: " + resultado.erro);
        }

    } catch (erro){
        alert("Não foi possível conectar ao servidor.")
    }
}

CarregarCardapio()