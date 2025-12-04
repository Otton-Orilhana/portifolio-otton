/* script.js
   Validação do formulário, simulação de envio com modal, menu responsivo e tema persistente
   Comentários explicativos adicionados para facilitar leitura e correção.
*/

document.addEventListener('DOMContentLoaded', () => {
  // Remove a classe no-js adicionada no HTML para indicar que JavaScript está disponível
  document.documentElement.classList.remove('no-js');

  // Seletores utilitários: $ para querySelector e $$ para querySelectorAll (retorna array)
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  // Elementos principais do layout
  const menu = $('.menu');                 // elemento do menu de navegação
  const menuToggle = $('#menuToggle');     // botão hambúrguer para abrir/fechar menu em mobile
  const themeToggle = $('#themeToggle');   // botão para alternar tema claro/escuro
  const body = document.body;              // referência ao elemento <body>

  // Elementos do formulário de contato
  const form = $('#contactForm');          // formulário
  const nomeEl = $('#nome');               // input nome
  const emailEl = $('#email');             // input e-mail
  const msgEl = $('#mensagem');            // textarea mensagem
  const feedback = $('#formFeedback');     // elemento para mostrar mensagens de erro/sucesso
  const submitBtn = $('#submitBtn');       // botão de envio

  // Elementos do modal de confirmação
  const modal = $('#confirmModal');                        // container do modal
  const modalCloseBtn = $('#modalCloseBtn');               // botão fechar do modal
  const modalBackdrop = modal ? modal.querySelector('.modal-backdrop') : null; // backdrop clicável

  // Seletor para elementos focáveis dentro do modal (usado para trap focus)
  const focusableSelector = 'button, [href], input, textarea, select, [tabindex]:not([tabindex="-1"])';

  /* =========================
     MENU ACESSÍVEL (abre/fecha)
     - Controla a abertura do menu em telas pequenas
     - Atualiza aria-expanded para acessibilidade
     ========================= */
  if (menu && menuToggle) {
    // Função que aplica o estado aberto/fechado no menu
    const setMenuState = (open) => {
      menu.classList.toggle('open', open);                     // adiciona/ remove classe CSS
      menuToggle.setAttribute('aria-expanded', String(open));  // atualiza atributo ARIA
    };

    // Clique no botão alterna o estado do menu
    menuToggle.addEventListener('click', () => setMenuState(!menu.classList.contains('open')));

    // Permite ativar o botão com Enter ou Espaço (acessibilidade teclado)
    menuToggle.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); menuToggle.click(); }
    });

    // Fecha o menu ao clicar em qualquer link de âncora do menu
    $$('.menu a[href^="#"]').forEach(link => link.addEventListener('click', () => setMenuState(false)));

    // Fecha o menu ao pressionar ESC
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenuState(false); });

    // Fecha o menu ao clicar fora dele (click fora do menu e do botão)
    document.addEventListener('click', (e) => {
      if (!menu.contains(e.target) && !menuToggle.contains(e.target)) setMenuState(false);
    });
  }

  /* =========================
     TEMA CLARO/ESC URO (persistente)
     - Detecta preferência do sistema e salva escolha no localStorage
     - Aplica classe .dark no body para ativar estilos escuros
     ========================= */
  if (themeToggle) {
    // Detecta preferência do sistema (dark mode)
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

    // Carrega tema salvo no localStorage ou usa preferência do sistema
    const loadTheme = () => {
      try {
        const saved = localStorage.getItem('site-theme');
        return saved || (prefersDark ? 'dark' : 'light');
      } catch { return prefersDark ? 'dark' : 'light'; }
    };

    // Aplica o tema: adiciona/remova classe e atualiza texto/atributos do botão
    const applyTheme = (theme) => {
      body.classList.toggle('dark', theme === 'dark');
      themeToggle.textContent = theme === 'dark' ? 'Claro' : 'Escuro';
      themeToggle.setAttribute('aria-pressed', theme === 'dark' ? 'true' : 'false');
      themeToggle.setAttribute('title', theme === 'dark' ? 'Ativar tema claro' : 'Ativar tema escuro');
    };

    // Inicializa tema atual e aplica
    let currentTheme = loadTheme();
    applyTheme(currentTheme);

    // Alterna tema ao clicar e tenta salvar a preferência
    themeToggle.addEventListener('click', () => {
      currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
      applyTheme(currentTheme);
      try { localStorage.setItem('site-theme', currentTheme); } catch {}
    });
  }

  /* =========================
     UTIL: valida e-mail simples
     - Regex simples para checar formato básico de e-mail
     - Não substitui validação no servidor, mas é suficiente para front-end
     ========================= */
  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  /* =========================
     Mostrar feedback inline
     - Atualiza o elemento de feedback com texto e classes de estilo
     - Usa role apropriado para leitores de tela (status/alert)
     ========================= */
  const showFeedback = (text, type = 'error') => {
    if (!feedback) return;
    feedback.textContent = text;
    feedback.className = 'feedback ' + (type === 'success' ? 'success' : 'error');
    feedback.setAttribute('role', type === 'success' ? 'status' : 'alert');
  };

  /* =========================
     Modal helpers (abrir/fechar e trap focus)
     - openModal: abre o modal, guarda elemento previamente focado e foca primeiro elemento dentro do modal
     - closeModal: fecha o modal e restaura foco ao elemento anterior
     - trapFocus: impede que o foco saia do modal enquanto ele estiver aberto
     - handleModalKeydown: trata ESC e navegação com Tab dentro do modal
     ========================= */
  const openModal = () => {
    if (!modal) return;
    modal.setAttribute('aria-hidden', 'false');           // torna o modal visível para ATs
    modal._previousActive = document.activeElement;       // guarda o elemento que tinha foco antes
    const focusable = modal.querySelectorAll(focusableSelector);
    if (focusable.length) focusable[0].focus();           // foca o primeiro elemento focável do modal
    document.addEventListener('focus', trapFocus, true);  // adiciona listener para manter foco dentro do modal
    document.addEventListener('keydown', handleModalKeydown);
  };

  const closeModal = () => {
    if (!modal) return;
    modal.setAttribute('aria-hidden', 'true');            // esconde o modal para ATs
    document.removeEventListener('focus', trapFocus, true);
    document.removeEventListener('keydown', handleModalKeydown);
    if (modal._previousActive) modal._previousActive.focus(); // restaura foco ao elemento anterior
  };

  // Evita que o foco saia do modal enquanto ele estiver aberto
  const trapFocus = (e) => {
    if (!modal || modal.getAttribute('aria-hidden') === 'true') return;
    if (!modal.contains(e.target)) {
      e.stopPropagation();
      const focusable = modal.querySelectorAll(focusableSelector);
      if (focusable.length) focusable[0].focus();
    }
  };

  // Trata teclas dentro do modal: ESC para fechar e Tab para circular foco
  const handleModalKeydown = (e) => {
    if (e.key === 'Escape') closeModal();
    if (e.key === 'Tab') {
      const focusable = Array.from(modal.querySelectorAll(focusableSelector));
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  };

  // Listeners para fechar modal via botão e clique no backdrop
  if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeModal);
  if (modalBackdrop) modalBackdrop.addEventListener('click', closeModal);

  /* =========================
     FORM: validação e simulação de envio
     - Valida nome, e-mail e mensagem
     - Usa setCustomValidity/reportValidity para mostrar mensagens nativas quando possível
     - Simula envio com setTimeout, limpa o formulário e abre modal de confirmação
     ========================= */
  if (form && nomeEl && emailEl && msgEl && submitBtn) {
    let submitting = false; // flag para evitar envios duplicados

    form.addEventListener('submit', (e) => {
      e.preventDefault();           // evita envio real (não há backend)
      if (submitting) return;       // evita múltiplos envios simultâneos

      // Limpa feedback visual anterior
      feedback.textContent = '';
      feedback.className = 'feedback';

      // Lê e normaliza valores dos campos
      const nome = nomeEl.value.trim();
      const email = emailEl.value.trim();
      const mensagem = msgEl.value.trim();

      // Reseta mensagens de validação customizadas
      [nomeEl, emailEl, msgEl].forEach(el => { el.setCustomValidity(''); });

      // Validação: nome obrigatório
      if (!nome) {
        nomeEl.setCustomValidity('Informe seu nome.');
        nomeEl.reportValidity();   // mostra mensagem nativa do navegador
        nomeEl.focus();
        showFeedback('Por favor, informe seu nome.', 'error');
        return;
      }

      // Validação: e-mail obrigatório e formato básico
      if (!email || !isValidEmail(email)) {
        emailEl.setCustomValidity('E-mail inválido.');
        emailEl.reportValidity();
        emailEl.focus();
        showFeedback('Por favor, informe um e‑mail válido (ex: usuario@dominio.com).', 'error');
        return;
      }

      // Validação: mensagem com tamanho mínimo
      if (mensagem.length < 10) {
        msgEl.setCustomValidity('A mensagem deve ter pelo menos 10 caracteres.');
        msgEl.reportValidity();
        msgEl.focus();
        showFeedback('A mensagem deve ter pelo menos 10 caracteres.', 'error');
        return;
      }

      // Simulação de envio: desabilita botão, mostra estado de loading e abre modal após delay
      submitting = true;
      submitBtn.disabled = true;
      submitBtn.classList.add('loading');           // classe CSS para estilo de loading
      const originalText = submitBtn.textContent;
      submitBtn.textContent = 'Enviando...';
      showFeedback('Enviando mensagem...', 'success');

      // Simula latência de rede com setTimeout
      setTimeout(() => {
        form.reset();                                // limpa campos do formulário
        submitBtn.disabled = false;
        submitBtn.classList.remove('loading');
        submitBtn.textContent = originalText;
        openModal();                                 // abre modal de confirmação
        showFeedback('Mensagem enviada com sucesso!', 'success');
        submitting = false;
      }, 800); // 800ms de simulação
    });
  }

  /* =========================
     IntersectionObserver para link ativo no menu
     - Observa seções e marca o link correspondente como ativo quando a seção entra na viewport
     - rootMargin e threshold ajustam quando a seção é considerada visível
     ========================= */
  try {
    const sections = $$('main section[id]'); // todas as seções com id dentro do main
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const id = entry.target.id;
        const link = $(`.menu a[href="#${id}"]`);
        if (link) link.classList.toggle('active', entry.isIntersecting);
      });
    }, { root: null, rootMargin: '0px 0px -40% 0px', threshold: 0.15 });

    // Inicia observação em cada seção
    sections.forEach(s => observer.observe(s));
  } catch (err) {
    // Se o IntersectionObserver não estiver disponível, falha silenciosa (compatibilidade)
  }

  // Inserir ano atual no footer (dinamicamente)
  const anoEl = $('#ano');
  if (anoEl) anoEl.textContent = new Date().getFullYear();
});
