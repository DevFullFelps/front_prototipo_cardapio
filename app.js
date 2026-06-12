// ==========================================================================
// CONFIGURAÇÕES GLOBAIS
// ==========================================================================
const API_URL = "https://prototipo-cardapio-api.onrender.com";
const EMPRESA_ID = 1;

let carrinho = [];

// ==========================================
// 1. CARREGAR DADOS DA LANCHONETE E PRODUTOS
// ==========================================
async function carregarCardapio() {
    try {
        const resposta = await fetch(`${API_URL}/produtos?empresa_id=${EMPRESA_ID}`);
        const produtos = await resposta.json();

        document.getElementById('nome-lanchonete').innerText = "Barraca do Lanche";

        const containerLanches = document.getElementById('lista-lanches');
        const containerBebidas = document.getElementById('lista-bebidas');

        containerLanches.innerHTML = "";
        containerBebidas.innerHTML = "";

        produtos.forEach(produto => {
            const fotoPadrao = produto.categoria === 'lanche'
                ? 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=200'
                : 'https://images.unsplash.com/photo-1497534446932-c925b458314e?q=80&w=200';

            const imagemExibir = produto.imagem_url ? produto.imagem_url : fotoPadrao;

            const cardHtml = `
                <div class="card-produto">
                    <div class="produto-foto-wrapper">
                        <img src="${imagemExibir}" alt="${produto.nome}" class="produto-img">
                    </div>
                    <div class="produto-info">
                        <h3>${produto.nome}</h3>
                        <p class="produto-preco">R$ ${produto.preco.toFixed(2)}</p>
                    </div>
                    <button class="btn-adicionar" onclick="adicionarAoCarrinho(${produto.id}, '${produto.nome}', ${produto.preco})">
                        +
                    </button>
                </div>
            `;

            if (produto.categoria === 'lanche') {
                containerLanches.innerHTML += cardHtml;
            } else if (produto.categoria === 'bebida') {
                containerBebidas.innerHTML += cardHtml;
            }
        });

    } catch (erro) {
        console.error("Erro ao conectar com o back-end:", erro);
        document.getElementById('nome-lanchonete').innerText = "Erro ao carregar o servidor 😢";
    }
}

// ==========================================
// 2. LÓGICA DO CARRINHO DE COMPRAS (RODAPÉ)
// ==========================================
function adicionarAoCarrinho(id, nome, preco) {
    const itemExistente = carrinho.find(item => item.produto_id === id);

    if (itemExistente) {
        itemExistente.quantidade += 1;
    } else {
        carrinho.push({
            produto_id: id,
            nome: nome,
            preco: preco,
            quantidade: 1
        });
    }
    atualizarBarraCarrinho();
}

function atualizarBarraCarrinho() {
    const barra = document.getElementById('barra-carrinho');
    const qtdTexto = document.getElementById('qtd-itens-carrinho');
    const totalTexto = document.getElementById('total-carrinho');

    if (carrinho.length === 0) {
        barra.classList.add('escondido');
        return;
    }

    barra.classList.remove('escondido');

    const totalItens = carrinho.reduce((soma, item) => soma + item.quantidade, 0);
    const valorTotal = carrinho.reduce((soma, item) => soma + (item.preco * item.quantidade), 0);

    qtdTexto.innerText = `${totalItens} ${totalItens === 1 ? 'item' : 'itens'}`;
    totalTexto.innerText = `R$ ${valorTotal.toFixed(2)}`;
}

// ==========================================
// 3. NOVO MODAL: EXIBIR ITENS E ALTERNAR ENVIO
// ==========================================
function abrirModalCarrinho() {
    if (carrinho.length === 0) return;

    const containerItensModal = document.getElementById('itens-modal-carrinho');
    const totalModalItens = document.getElementById('total-modal-itens');
    const totalModalGeral = document.getElementById('total-modal-geral');

    containerItensModal.innerHTML = "";

    // Lista os itens no Modal
    carrinho.forEach(item => {
        containerItensModal.innerHTML += `
            <div style="display: flex; justify-content: space-between; font-size: 14px; margin-bottom: 6px; border-bottom: 1px dashed #f1f5f9; padding-bottom: 4px;">
                <span><strong>${item.quantidade}x</strong> ${item.nome}</span>
                <span style="color: #475569;">R$ ${(item.preco * item.quantidade).toFixed(2)}</span>
            </div>
        `;
    });

    // Calcula o valor base (itens)
    const valorItens = carrinho.reduce((soma, item) => soma + (item.preco * item.quantidade), 0);

    totalModalItens.innerText = `R$ ${valorItens.toFixed(2)}`;
    totalModalGeral.innerText = `R$ ${valorItens.toFixed(2)}`; // Inicialmente igual, pois começa em "Retirada"

    // Garante que comece com "Retirada" marcado e a taxa/endereços sumidos ao reabrir
    document.querySelector('input[name="tipo_envio"][value="retirada"]').checked = true;
    document.getElementById('campos-endereco').classList.add('escondido');
    document.getElementById('linha-taxa-entrega').classList.add('escondido');

    // Abre o modal na tela
    document.getElementById('modal-entrega').classList.remove('escondido');
}

function fecharModalEntrega() {
    document.getElementById('modal-entrega').classList.add('escondido');
}

// Mostra ou esconde as caixas de texto dependendo da escolha (Retirada ou Entrega)
function alternarCamposEndereco() {
    const tipoEnvio = document.querySelector('input[name="tipo_envio"]:checked').value;
    const blocoEndereco = document.getElementById('campos-endereco');
    const linhaTaxa = document.getElementById('linha-taxa-entrega');
    const totalModalGeral = document.getElementById('total-modal-geral');

    // Recupera o valor atual dos itens dinamicamente
    const valorItens = carrinho.reduce((soma, item) => soma + (item.preco * item.quantidade), 0);
    const taxaEntrega = 7.00;

    if (tipoEnvio === 'entrega') {
        blocoEndereco.classList.remove('escondido'); // Mostra Bairro, Rua, Número...
        linhaTaxa.classList.remove('escondido');    // Mostra a linha "Taxa de entrega: R$ 7,00"

        // Atualiza o total geral somando a taxa
        const novoTotal = valorItens + taxaEntrega;
        totalModalGeral.innerText = `R$ ${novoTotal.toFixed(2)}`;
    } else {
        blocoEndereco.classList.add('escondido');    // Esconde o endereço
        linhaTaxa.classList.add('escondido');       // Esconde a taxa

        // Volta o total geral para o valor original dos lanches
        totalModalGeral.innerText = `R$ ${valorItens.toFixed(2)}`;
    }
}

// ==========================================
// 4. DISPARO FINAL DO PEDIDO (BANCO + WHATSAPP)
// ==========================================
async function enviarPedidoFinal() {
    const tipoEnvio = document.querySelector('input[name="tipo_envio"]:checked').value;

    let rua = "";
    let numero = "";
    let bairro = "";
    let observacao = document.getElementById('cliente-obs').value.trim();

    // Se for entrega, valida obrigatoriamente as caixas separadas
    if (tipoEnvio === 'entrega') {
        rua = document.getElementById('cliente-rua').value.trim();
        numero = document.getElementById('cliente-numero').value.trim();
        bairro = document.getElementById('cliente-bairro').value.trim();

        if (!rua || !numero || !bairro) {
            alert("Por favor, preencha a Rua, Número e o Bairro para realizar a entrega!");
            return;
        }
    }

    const valorItens = carrinho.reduce((soma, item) => soma + (item.preco * item.quantidade), 0);
    const taxaEntrega = tipoEnvio === 'entrega' ? 7.00 : 0.00;
    const valorTotalGeral = valorItens + taxaEntrega;

    const dadosPedido = carrinho.map(item => ({
        produto_id: item.produto_id,
        quantidade: item.quantidade
    }));

    try {
        // 1. Envia para o seu Python salvar no banco de dados
        const response = await fetch(`${API_URL}/pedidos?empresa_id=${EMPRESA_ID}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(dadosPedido)
        });

        if (response.ok) {
            const resultado = await response.json();

            alert(`🎉 Pedido enviado com sucesso!\nID: #${resultado.pedido_id}`);
            fecharModalEntrega();

            // ==========================================
            // 🚀 ESTRUTURAÇÃO DO RELATÓRIO DO WHATSAPP
            // ==========================================
            const meuNumero = "5547984318419";

            let textoWhats = `*Novo Pedido - Barraca do Lanche (Pedido #${resultado.pedido_id})*\n\n`;

            textoWhats += `*🛒 ITENS DO PEDIDO:*\n`;
            carrinho.forEach(item => {
                textoWhats += `• ${item.quantidade}x ${item.nome} (R$ ${item.preco.toFixed(2)} cada)\n`;
            });

            textoWhats += `\n*FORMA DE ENVIO:* ${tipoEnvio === 'entrega' ? '🚚 Entrega' : '🏪 Retirada na Loja'}\n`;

            if (tipoEnvio === 'entrega') {
                textoWhats += `\n*📍 ENDEREÇO DE ENTREGA:*\n`;
                textoWhats += `• *Rua:* ${rua}, Nº ${numero}\n`;
                textoWhats += `• *Bairro:* ${bairro}\n`;
            }

            if (observacao) {
                textoWhats += `• *Obs:* ${observacao}\n`;
            }

            textoWhats += `\n-------------------------\n`;
            textoWhats += `• Subtotal Itens: R$ ${valorItens.toFixed(2)}\n`;
            if (tipoEnvio === 'entrega') {
                textoWhats += `• Taxa de Entrega: R$ ${taxaEntrega.toFixed(2)}\n`;
            }
            textoWhats += `*Total a Pagar: R$ ${valorTotalGeral.toFixed(2)}*\n\n`;

            // ==========================================
            // 💰 INFORMAÇÕES DE PAGAMENTO (PIX)
            // ==========================================
            textoWhats += `*🔑 CHAVE PIX:* felipeadr2@gmail.com\n\n`;
            textoWhats += `_⚠️ Envie seu comprovante para finalizar a compra_`;

            // Converte com segurança para URL sem quebrar nada no chat
            const textoCodificado = encodeURIComponent(textoWhats);

            // Limpeza geral de estado e inputs
            carrinho = [];
            atualizarBarraCarrinho();
            
            // Tratamento preventivo caso os campos não existam na árvore DOM na hora de limpar
            if(document.getElementById('cliente-rua')) document.getElementById('cliente-rua').value = "";
            if(document.getElementById('cliente-numero')) document.getElementById('cliente-numero').value = "";
            if(document.getElementById('cliente-bairro')) document.getElementById('cliente-bairro').value = "";
            if(document.getElementById('cliente-obs')) document.getElementById('cliente-obs').value = "";

            // URL Universal que dispara o App do celular ou o Web no PC
            const urlFinal = `https://api.whatsapp.com/send?phone=${meuNumero}&text=${textoCodificado}`;
            
            // Redireciona na mesma aba eliminando o bloqueio de pop-up do mobile
            window.location.href = urlFinal;

        } else {
            alert("Erro ao processar o pedido no servidor Python.");
        }
    } catch (erro) {
        console.error(erro);
        alert("Erro na conexão com o servidor.");
    }
}

// Inicializa o cardápio automaticamente
carregarCardapio();