/* script.js
   Validação do formulário, simulação de envio com modal,
   menu responsivo e alternância de tema com persistência.
   Comentários explicativos adicionados para facilitar manutenção.
*/

document.addEventListener('DOMContentLoaded', () => {
  // Remove a classe que indica ausência de JS (melhora estilos quando JS está ativo)
  document.documentElement.classList.remove('no-js');

  // Pequenas utilidades para selecionar elementos
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  // Elementos principais do layout
  const menu = $('.menu');
  const menuToggle = $('#menuToggle');
  const themeToggle = $('#themeToggle');
  const body = document.body;

  // Elementos do formulário de contato
  const form = $('#contactForm');
  const nomeEl = $('#nome');
  const emailEl = $('#email');
  const msgEl = $('#mensagem');
  const feedback = $('#formFeedback');
  const submitBtn = $('#submitBtn');

  // Elementos do modal de confirmação
  const modal = $('#confirmModal');
  const modalCloseBtn = $('#modalCloseBtn');
  const modalBackdrop = modal ? modal.querySelector('.modal-backdrop') : null;

  // Seletor para elementos focáveis (usado no trap focus do modal)
  const focusableSelector = 'button, [href], input, textarea, select, [tabindex]:not([tabindex="-1"])';

  /* =========================
     MENU (acessível e responsivo)
     - Abre/fecha o menu em telas pequenas
     - Atualiza aria-expanded para leitores de tela
  ========================= */
  if (menu && menuToggle) {
    const setMenuState = (open) => {
      // Adiciona/Remove classe CSS que controla a exibição do menu
      menu.classList.toggle('open', open);
      // Atualiza atributo ARIA para indicar estado do botão
      menuToggle.setAttribute('aria-expanded', String(open));
    };

    // Alterna estado ao clicar
    menuToggle.addEventListener('click', () => setMenuState(!menu.classList.contains('open')));

    // Permite ativar o botão com Enter ou Espaço (acessibilidade teclado)
    menuToggle.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        menuToggle.click();
      }
    });

    // Fecha o menu ao clicar em um link de âncora
    $$('.menu a[href^="#"]').forEach(link => link.addEventListener('click', () => setMenuState(false)));

    // Fecha o menu ao pressionar ESC
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenuState(false); });

    // Fecha o menu ao clicar fora dele (exceto quando o clique é no botão do menu)
    document.addEventListener('click', (e) => {
      if (!menu.contains(e.target) && !menuToggle.contains(e.target)) setMenuState(false);
    });
  }

  /* =========================
     TEMA (claro / escuro)
     - Detecta preferência do sistema
     - Carrega tema salvo no localStorage
     - Aplica classe .dark no body para ativar estilos escuros
     - Atualiza texto do botão e atributos ARIA
  ========================= */
  if (themeToggle) {
    // Detecta preferência do sistema (true se o usuário prefere dark)
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

    // Carrega tema salvo (chave 'site-theme') ou usa preferência do sistema
    const loadTheme = () => {
      try {
        const saved = localStorage.getItem('site-theme'); // 'dark' | 'light' | null
        return saved ? saved : (prefersDark ? 'dark' : 'light');
      } catch (e) {
        // Se localStorage não estiver disponível, usa preferência do sistema
        return prefersDark ? 'dark' : 'light';
      }
    };

    // Aplica o tema: adiciona/remova classe e atualiza o botão
    const applyTheme = (theme) => {
      if (body) body.classList.toggle('dark', theme === 'dark');

      // Atualiza o texto do botão para indicar a ação que o clique fará
      // Ex.: quando está em 'dark', o botão mostra 'Claro' (clicando ativa o claro)
      if (themeToggle && themeToggle instanceof Element) {
        themeToggle.textContent = theme === 'dark' ? 'Claro' : 'Escuro';
        themeToggle.setAttribute('aria-pressed', theme === 'dark' ? 'true' : 'false');
        themeToggle.setAttribute('title', theme === 'dark' ? 'Ativar tema claro' : 'Ativar tema escuro');
      }
    };

    // Inicializa tema atual e aplica
    let currentTheme = loadTheme();
    applyTheme(currentTheme);

    // Alterna tema ao clicar e persiste a escolha
    themeToggle.addEventListener('click', () => {
      currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
      applyTheme(currentTheme);
      try { localStorage.setItem('site-theme', currentTheme); } catch (e) { /* ignorar se indisponível */ }
    });

    // Suporte de teclado para o toggle (Enter / Espaço)
    themeToggle.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        themeToggle.click();
      }
    });
  }

  /* =========================
     UTIL: valida e-mail simples
     - Regex básica para checar formato (não substitui validação no servidor)
  ========================= */
  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  /* =========================
     Feedback visual do formulário
     - Atualiza texto, classe e role para leitores de tela
  ========================= */
  const showFeedback = (text, type = 'error') => {
    if (!feedback) return;
    feedback.textContent = text;
    feedback.className = 'feedback ' + (type === 'success' ? 'success' : 'error');
    feedback.setAttribute('role', type === 'success' ? 'status' : 'alert');
  };

  /* =========================
     Modal helpers (abrir / fechar / trap focus)
     - openModal: mostra o modal e foca o primeiro elemento focável
     - closeModal: esconde o modal e restaura foco ao elemento anterior
     - trapFocus: impede que o foco saia do modal enquanto aberto
  ========================= */
  const openModal = () => {
    if (!modal) return;
    modal.setAttribute('aria-hidden', 'false'); // torna visível para ATs
    modal._previousActive = document.activeElement; // guarda elemento previamente focado
    const focusable = modal.querySelectorAll(focusableSelector);
    if (focusable.length) focusable[0].focus();
    document.addEventListener('focus', trapFocus, true);
    document.addEventListener('keydown', handleModalKeydown);
  };

  const closeModal = () => {
    if (!modal) return;
    modal.setAttribute('aria-hidden', 'true'); // esconde para ATs
    document.removeEventListener('focus', trapFocus, true);
    document.removeEventListener('keydown', handleModalKeydown);
    if (modal._previousActive) modal._previousActive.focus(); // restaura foco
  };

  // Mantém foco dentro do modal enquanto ele estiver aberto
  const trapFocus = (e) => {
    if (!modal || modal.getAttribute('aria-hidden') === 'true') return;
    if (!modal.contains(e.target)) {
      e.stopPropagation();
      const focusable = modal.querySelectorAll(focusableSelector);
      if (focusable.length) focusable[0].focus();
    }
  };

  // Trata ESC e navegação com Tab dentro do modal
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
     - Simula envio com setTimeout, limpa o formulário e abre modal
  ========================= */
  if (form && nomeEl && emailEl && msgEl && submitBtn) {
    let submitting = false; // flag para evitar envios duplicados

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (submitting) return;

      // Limpa feedback anterior
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
        nomeEl.reportValidity();
        nomeEl.focus();
        showFeedback('Por favor, informe seu nome.', 'error');
        return;
      }

      // Validação: e-mail obrigatório e formato básico
      if (!email || !isValidEmail(email)) {
        emailEl.setCustomValidity('E-mail inválido.');
        emailEl.reportValidity();
        emailEl.focus();
        showFeedback('Por favor, informe um email válido (ex: usuario@dominio.com).', 'error');
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

      // Simulação de envio: desabilita botão, mostra loading e abre modal após delay
      submitting = true;
      submitBtn.disabled = true;
      submitBtn.classList.add('loading'); // classe para estilo de loading
      const originalText = submitBtn.textContent;
      submitBtn.textContent = 'Enviando...';
      showFeedback('Enviando mensagem...', 'success');

      setTimeout(() => {
        form.reset(); // limpa campos
        submitBtn.disabled = false;
        submitBtn.classList.remove('loading');
        submitBtn.textContent = originalText;
        openModal(); // abre modal de confirmação
        showFeedback('Mensagem enviada com sucesso!', 'success');
        submitting = false;
      }, 800); // simula latência de rede
    });
  }

  /* =========================
     IntersectionObserver para link ativo no menu
     - Observa seções e marca o link correspondente como ativo
  ========================= */
  try {
    const sections = $$('main section[id]');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const id = entry.target.id;
        const link = $(`.menu a[href="#${id}"]`);
        if (link) link.classList.toggle('active', entry.isIntersecting);
      });
    }, { root: null, rootMargin: '0px 0px -40% 0px', threshold: 0.15 });

    sections.forEach(s => observer.observe(s));
  } catch (err) {
    // Se IntersectionObserver não estiver disponível, falha silenciosa (compatibilidade)
  }

  /* =========================
     Inserir ano atual no footer
  ========================= */
  const anoEl = $('#ano');
  if (anoEl) anoEl.textContent = new Date().getFullYear();
});
