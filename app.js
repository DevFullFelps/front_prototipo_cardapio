// ==========================================================================
// CONFIGURAÇÕES GLOBAIS DA LOJA E DO SISTEMA
// ==========================================================================
const API_URL = "https://prototipo-cardapio-api.onrender.com";
const EMPRESA_ID = 1;

// Configuração de Horário do Cliente
const CONFIG_LOJA = {
    abre: "10:00",
    fecha: "23:59" // Formato 24h
};

// Carrega o carrinho salvo no celular do cliente (LocalStorage)
let carrinho = JSON.parse(localStorage.getItem(`carrinho_lanchonete_${EMPRESA_ID}`)) || [];

// Variáveis para o modal de observação do item
let itemTemporario = null;

// ==========================================
// 1. LÓGICA DE FUNCIONAMENTO (STATUS DA LOJA)
// ==========================================
function lojaEstaAberta() {
    const agora = new Date();
    const minutosAtuais = agora.getHours() * 60 + agora.getMinutes();

    const [hAbre, mAbre] = CONFIG_LOJA.abre.split(':').map(Number);
    const minAbre = hAbre * 60 + mAbre;

    const [hFecha, mFecha] = CONFIG_LOJA.fecha.split(':').map(Number);
    const minFecha = hFecha * 60 + mFecha;

    if (minAbre < minFecha) {
        // Ex: 10:00 às 22:00
        return minutosAtuais >= minAbre && minutosAtuais <= minFecha;
    } else {
        // Ex: 18:00 às 02:00 (Vira a madrugada)
        return minutosAtuais >= minAbre || minutosAtuais <= minFecha;
    }
}

function atualizarStatusLoja() {
    const badge = document.getElementById('badge-status');
    if (lojaEstaAberta()) {
        badge.innerHTML = `<i class="fa-solid fa-circle"></i> Aberto`;
        badge.classList.remove('status-fechado');
    } else {
        badge.innerHTML = `<i class="fa-solid fa-circle"></i> Fechado`;
        badge.classList.add('status-fechado');
    }
}

// ==========================================
// 2. CARREGAR DADOS DA LANCHONETE E PRODUTOS (DINÂMICO)
// ==========================================
async function carregarCardapio() {
    atualizarStatusLoja();
    atualizarBarraCarrinho(); // Garante que mostre o carrinho se já houver algo salvo

    try {
        const resposta = await fetch(`${API_URL}/produtos?empresa_id=${EMPRESA_ID}`);
        const produtos = await resposta.json();

        document.getElementById('nome-lanchonete').innerText = "Barraca do Lanche";

        // Remove o efeito shimmer de carregamento
        document.getElementById('loading-shimmer').classList.add('escondido');

        const containerCategoriasNav = document.getElementById('nav-categorias');
        const containerMenuConteudo = document.getElementById('menu-conteudo');

        // Descobre as categorias únicas que vieram do banco automaticamente
        // Assim, se não tiver 'porção', ele nem cria a aba!
        const categoriasUnicas = [...new Set(produtos.map(p => p.categoria))];

        if (categoriasUnicas.length > 0) {
            containerCategoriasNav.classList.remove('escondido');
        }

        categoriasUnicas.forEach(categoria => {
            // 1. Cria a pílula de navegação lá no topo
            const idSecao = `secao-${categoria.replace(/\s+/g, '-')}`;
            const nomeFormatado = categoria.charAt(0).toUpperCase() + categoria.slice(1);

            containerCategoriasNav.innerHTML += `
                <a href="#${idSecao}" class="pill-categoria">${nomeFormatado}</a>
            `;

            // 2. Cria a seção no HTML
            // Filtra os produtos dessa categoria
            const produtosDestaCategoria = produtos.filter(p => p.categoria === categoria);

            let htmlSecao = `
                <section id="${idSecao}" class="categoria-section">
                    <h2>${nomeFormatado}</h2>
                    <div class="grid-produtos">
            `;

            produtosDestaCategoria.forEach(produto => {
                const fotoPadrao = 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=200';
                const imagemExibir = produto.imagem_url ? produto.imagem_url : fotoPadrao;

                // Perceba que agora chama abrirModalItem ao invés de direto para o carrinho
                htmlSecao += `
                    <div class="card-produto">
                        <div class="produto-foto-wrapper">
                            <img src="${imagemExibir}" alt="${produto.nome}" class="produto-img">
                        </div>
                        <div class="produto-info">
                            <h3>${produto.nome}</h3>
                            <p class="produto-preco">R$ ${produto.preco.toFixed(2)}</p>
                        </div>
                        <button class="btn-adicionar" onclick="abrirModalItem(${produto.id}, '${produto.nome}', ${produto.preco})">
                            +
                        </button>
                    </div>
                `;
            });

            htmlSecao += `</div></section>`;
            containerMenuConteudo.innerHTML += htmlSecao;
        });

    } catch (erro) {
        console.error("Erro ao conectar com o back-end:", erro);
        document.getElementById('nome-lanchonete').innerText = "Erro ao carregar cardápio";
        document.getElementById('loading-shimmer').innerHTML = "<p style='text-align:center; margin-top: 20px;'>Sistema temporariamente indisponível.</p>";
    }
}

// ==========================================
// 3. LÓGICA DO CARRINHO COM OBSERVAÇÕES
// ==========================================
function abrirModalItem(id, nome, preco) {
    if (!lojaEstaAberta()) {
        alert(`Desculpe, nossa loja está fechada. Funcionamos das ${CONFIG_LOJA.abre} às ${CONFIG_LOJA.fecha}.`);
        return;
    }

    itemTemporario = { id, nome, preco };
    document.getElementById('modal-item-nome').innerText = nome;
    document.getElementById('modal-item-preco').innerText = `R$ ${preco.toFixed(2)}`;
    document.getElementById('item-obs').value = ""; // Limpa a observação anterior

    document.getElementById('modal-item').classList.remove('escondido');
}

function fecharModalItem() {
    document.getElementById('modal-item').classList.add('escondido');
    itemTemporario = null;
}

function confirmarAdicaoItem() {
    if (!itemTemporario) return;

    const obs = document.getElementById('item-obs').value.trim();

    // Cria uma chave única para o item. Se for o mesmo lanche com a mesma observação, soma a quantidade.
    // Se a observação for diferente, separa no carrinho!
    const cartKey = `${itemTemporario.id}-${obs.toLowerCase()}`;

    const itemExistente = carrinho.find(item => item.cartKey === cartKey);

    if (itemExistente) {
        itemExistente.quantidade += 1;
    } else {
        carrinho.push({
            cartKey: cartKey,
            produto_id: itemTemporario.id,
            nome: itemTemporario.nome,
            preco: itemTemporario.preco,
            observacao_item: obs,
            quantidade: 1
        });
    }

    fecharModalItem();
    atualizarBarraCarrinho();
}

function atualizarBarraCarrinho() {
    // Salva o estado atual no celular do cliente
    localStorage.setItem(`carrinho_lanchonete_${EMPRESA_ID}`, JSON.stringify(carrinho));

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
// 4. MODAL DE ENTREGA, PAGAMENTO E ENVIO
// ==========================================
function abrirModalCarrinho() {
    if (!lojaEstaAberta()) {
        alert(`Desculpe, nossa loja está fechada. Funcionamos das ${CONFIG_LOJA.abre} às ${CONFIG_LOJA.fecha}.`);
        return;
    }

    if (carrinho.length === 0) return;

    const containerItensModal = document.getElementById('itens-modal-carrinho');
    containerItensModal.innerHTML = "";

    carrinho.forEach(item => {
        // Adiciona a nota da observação embaixo do nome do lanche, se existir
        const htmlObs = item.observacao_item ? `<br><small style="color: #ef4444; font-size: 11px;">Obs: ${item.observacao_item}</small>` : '';

        containerItensModal.innerHTML += `
            <div style="font-size: 14px; margin-bottom: 8px; border-bottom: 1px dashed #f1f5f9; padding-bottom: 8px;">
                <div style="display: flex; justify-content: space-between;">
                    <span><strong>${item.quantidade}x</strong> ${item.nome}</span>
                    <span style="color: #475569;">R$ ${(item.preco * item.quantidade).toFixed(2)}</span>
                </div>
                ${htmlObs}
            </div>
        `;
    });

    // Reset padrão do Modal
    document.querySelector('input[name="tipo_envio"][value="retirada"]').checked = true;
    document.getElementById('forma-pagamento').value = "Pix";

    alternarCampos();
    alternarTroco();

    document.getElementById('modal-entrega').classList.remove('escondido');
}

function fecharModalEntrega() {
    document.getElementById('modal-entrega').classList.add('escondido');
}

function alternarCampos() {
    const tipoEnvio = document.querySelector('input[name="tipo_envio"]:checked').value;
    const blocoEndereco = document.getElementById('campos-endereco');
    const linhaTaxa = document.getElementById('linha-taxa-entrega');
    const totalModalGeral = document.getElementById('total-modal-geral');
    const totalModalItens = document.getElementById('total-modal-itens');

    const valorItens = carrinho.reduce((soma, item) => soma + (item.preco * item.quantidade), 0);
    const taxaEntrega = 7.00;

    totalModalItens.innerText = `R$ ${valorItens.toFixed(2)}`;

    if (tipoEnvio === 'entrega') {
        blocoEndereco.classList.remove('escondido');
        linhaTaxa.classList.remove('escondido');
        totalModalGeral.innerText = `R$ ${(valorItens + taxaEntrega).toFixed(2)}`;
    } else {
        blocoEndereco.classList.add('escondido');
        linhaTaxa.classList.add('escondido');
        totalModalGeral.innerText = `R$ ${valorItens.toFixed(2)}`;
    }
}

function alternarTroco() {
    const formaPgto = document.getElementById('forma-pagamento').value;
    const campoTroco = document.getElementById('campo-troco');

    if (formaPgto === 'Dinheiro') {
        campoTroco.classList.remove('escondido');
    } else {
        campoTroco.classList.add('escondido');
        document.getElementById('cliente-troco').value = ""; // Limpa se trocar de opção
    }
}

// Disparo Final
// Disparo Final
async function enviarPedidoFinal() {
    if (!lojaEstaAberta()) {
        alert("A loja fechou durante o processo. Seu pedido não pôde ser concluído.");
        return;
    }

    const tipoEnvio = document.querySelector('input[name="tipo_envio"]:checked').value;
    const formaPagamento = document.getElementById('forma-pagamento').value;
    let troco = document.getElementById('cliente-troco').value.trim();
    let obsGeral = "";

    // Tenta pegar observação geral se existir no HTML
    const campoObsGeral = document.getElementById("cliente-obs");
    if (campoObsGeral) {
        obsGeral = campoObsGeral.value.trim();
    }

    let rua = "", numero = "", bairro = "";

    if (tipoEnvio === 'entrega') {
        rua = document.getElementById('cliente-rua').value.trim();
        numero = document.getElementById('cliente-numero').value.trim();
        bairro = document.getElementById('cliente-bairro').value.trim();

        if (!rua || !numero || !bairro) {
            alert("Preencha a Rua, Número e o Bairro para realizar a entrega!");
            return;
        }
    }

    const valorItens = carrinho.reduce((soma, item) => soma + (item.preco * item.quantidade), 0);
    const taxaEntrega = tipoEnvio === 'entrega' ? 7.00 : 0.00;
    const valorTotalGeral = valorItens + taxaEntrega;

    // Payload completo conversando perfeitamente com o Pydantic do backend
    const payload = {
        itens: carrinho.map(item => ({
            produto_id: item.produto_id,
            quantidade: item.quantidade,
            observacao: item.observacao_item || null
        })),
        observacao_geral: obsGeral || null,
        metodo_pagamento: formaPagamento,
        tipo_entrega: tipoEnvio
    };

    // AQUI COMEÇA O TRY QUE ESTAVA DANDO ERRO
    try {
        const response = await fetch(`${API_URL}/pedidos?empresa_id=${EMPRESA_ID}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            const resultado = await response.json();
            fecharModalEntrega();

            // ==========================================
            // WHATSAPP
            // ==========================================
            const meuNumero = "5547984318419";
            let textoWhats = `*Novo Pedido - Barraca do Lanche (Pedido #${resultado.pedido_id})*\n\n`;

            textoWhats += `*🛒 ITENS DO PEDIDO:*\n`;
            carrinho.forEach(item => {
                textoWhats += `• ${item.quantidade}x ${item.nome} (R$ ${(item.preco * item.quantidade).toFixed(2)})\n`;
                if (item.observacao_item) {
                    textoWhats += `  _⚠️ Obs: ${item.observacao_item}_\n`;
                }
            });

            textoWhats += `\n*📦 FORMA DE ENVIO:* ${tipoEnvio === 'entrega' ? '🚚 Entrega' : '🏪 Retirada'}\n`;
            if (tipoEnvio === 'entrega') {
                textoWhats += `*📍 ENDEREÇO:*\n${rua}, Nº ${numero} - ${bairro}\n`;
            }

            if (obsGeral) textoWhats += `\n*📝 OBS GERAL:* ${obsGeral}\n`;

            textoWhats += `\n*💵 FORMA DE PAGAMENTO:* ${formaPagamento}\n`;
            if (formaPagamento === 'Dinheiro' && troco) {
                textoWhats += `*🔄 Troco para:* ${troco}\n`;
            }

            textoWhats += `\n-------------------------\n`;
            textoWhats += `• Subtotal: R$ ${valorItens.toFixed(2)}\n`;
            if (tipoEnvio === 'entrega') textoWhats += `• Entrega: R$ ${taxaEntrega.toFixed(2)}\n`;
            textoWhats += `*Total a Pagar: R$ ${valorTotalGeral.toFixed(2)}*\n\n`;

            if (formaPagamento === 'Pix') {
                textoWhats += `*🔑 CHAVE PIX:* felipeadr2@gmail.com\n_Envie seu comprovante logo abaixo!_`;
            } else {
                textoWhats += `_Aguardando confirmação do restaurante._`;
            }

            const textoCodificado = encodeURIComponent(textoWhats);

            // LIMPEZA
            carrinho = [];
            localStorage.removeItem(`carrinho_lanchonete_${EMPRESA_ID}`);
            atualizarBarraCarrinho();

            // Limpa os inputs
            const inputsLimpar = document.querySelectorAll('input[type="text"], input[type="number"]');
            inputsLimpar.forEach(input => input.value = '');

            window.location.href = `https://api.whatsapp.com/send?phone=${meuNumero}&text=${textoCodificado}`;

        } else {
            alert("Erro ao processar pedido. Tente novamente.");
            const errText = await response.text();
            console.error("Erro backend:", response.status, errText);
        }
    } catch (erro) {
        // AQUI ESTÁ O CATCH QUE FALTAVA!
        console.error("Erro conexão:", erro);
        alert("Erro na conexão com o servidor. Verifique se o backend está online.");
    }
}

// Inicializa a aplicação
carregarCardapio();