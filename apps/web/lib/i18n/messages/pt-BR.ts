import type { Messages } from './en';

/** Brazilian Portuguese. Typed against `en.ts`: the two always have the same keys. */
export const ptBR: Messages = {
  common: {
    appName: 'Oliveira',
    skipToContent: 'Pular para o conteúdo',
    language: 'Idioma',
    notAvailable: '—',
    notifications: 'Notificações',
    close: 'Fechar',
    cancel: 'Cancelar',
    save: 'Salvar',
    back: 'Voltar',
  },

  breadcrumb: {
    new: 'Novo',
    edit: 'Editar',
    details: 'Detalhes',
  },

  auth: {
    builtAs: 'Criado como um portfólio de automação de QA.',
    copyright: '© {year} Oliveira',
    panel: {
      signIn: { headline: 'Uma conta para todos os produtos Oliveira.' },
      register: { headline: 'Comece pela sua conta. Sua empresa vem depois.' },
      products: {
        platform: 'Empresa, membros e acesso aos produtos',
        erp: 'Retaguarda de obras',
        fsm: 'Em breve',
      },
      steps: {
        account: { title: 'Sua conta', body: 'Nome, e-mail e senha' },
        company: { title: 'Sua empresa', body: 'Adicionado por um admin da empresa' },
        access: { title: 'Acesso aos produtos', body: 'Liberado por um admin da empresa' },
      },
    },
    fields: {
      email: 'E-mail',
      workEmail: 'E-mail de trabalho',
      emailPlaceholder: 'nome@empresa.com',
      password: 'Senha',
      fullName: 'Nome completo',
      fullNamePlaceholder: 'Ana Oliveira',
      birthDate: 'Data de nascimento',
      showPassword: 'Mostrar senha',
      hidePassword: 'Ocultar senha',
    },
    signIn: {
      title: 'Entrar',
      lead: 'Use sua conta Oliveira para acessar os produtos da sua empresa.',
      forgot: 'Esqueci a senha',
      remember: 'Lembrar de mim',
      submit: 'Entrar',
      submitting: 'Entrando…',
      notImplemented: 'Não implementado',
      newHere: 'Novo na Oliveira?',
      createAccount: 'Criar uma conta',
      failedTitle: 'Não foi possível entrar',
      failedBody: 'Confira seus dados e tente novamente.',
    },
    register: {
      title: 'Crie sua conta',
      lead: 'Uma conta para todos os produtos Oliveira.',
      submit: 'Criar conta',
      submitting: 'Criando conta…',
      haveAccount: 'Já tem uma conta?',
      signIn: 'Entrar',
      takenTitle: 'Este endereço já tem uma conta',
      takenBody: 'Entre com ele ou use outro endereço.',
    },
  },

  nav: {
    platform: {
      home: 'Início',
      companyAdmin: 'Administração da empresa',
      company: 'Empresa',
      members: 'Membros',
      productAccess: 'Acesso ao produto',
    },
    erp: {
      overview: 'Visão geral',
      records: 'Cadastros',
      people: 'Pessoas',
      access: 'Acesso',
      accessControl: 'Controle de acesso',
      settings: 'Configurações',
      accessProfiles: 'Perfis de acesso',
      users: 'Usuários',
    },
  },

  access: {
    badge: {
      granted: 'Acesso liberado',
      none: 'Sem acesso',
      soon: 'Em breve',
    },
  },

  home: {
    greeting: 'Olá, {name}.',
    role: { admin: 'Admin', member: 'Membro' },
    lead: {
      company: 'Os produtos Oliveira que sua empresa usa e o seu acesso a cada um.',
      noCompany:
        'Sua conta está pronta. Para usar os produtos Oliveira, você precisa primeiro fazer parte de uma empresa.',
    },
    products: {
      heading: 'Produtos',
      note: 'O acesso é liberado pelos admins da empresa. O que você pode fazer dentro de cada produto é definido pelo próprio produto.',
    },
    card: {
      erp: {
        kind: 'Gestão empresarial',
        description: 'Retaguarda para construção: pessoas, cadastros e perfis de acesso.',
      },
      fsm: {
        kind: 'Gestão de serviços de campo',
        description: 'Em desenvolvimento. Ainda não disponível para nenhuma empresa.',
      },
      open: 'Abrir {product}',
      askAdmin: 'Peça a um admin da empresa',
      noAccessChip: 'Sem acesso',
      soonChip: 'Em breve',
      noAccessReason: 'Você não tem acesso ao {product}. Peça a um admin da empresa para liberar.',
      soonReason: 'O {product} está em desenvolvimento e ainda não está disponível.',
    },
    strip: {
      members: 'Membros',
      access: 'Acesso ao {product}',
      ofLimit: '{used} de {limit}',
    },
    noCompany: {
      join: {
        title: 'Entrar em uma empresa existente',
        body: 'Peça a um admin da empresa para adicionar você usando este e-mail. Depois disso, sua empresa e os produtos dela aparecem aqui.',
      },
      note: 'Criar uma conta não concede acesso a nenhum produto. O acesso ao produto é sempre concedido por um admin da empresa.',
    },
  },

  guard: {
    backToHome: 'Voltar ao início',
    noAccess: {
      overline: 'Acesso ao produto',
      title: 'Você não tem acesso ao {product}',
      withCompany:
        'Sua conta Oliveira e seu vínculo com {company} estão ativos, mas o {product} não foi habilitado para você. O acesso ao produto é concedido por um administrador da empresa.',
      noCompany:
        'Sua conta ainda não está vinculada a uma empresa. Peça a um administrador da empresa que adicione você e depois conceda o acesso ao {product}.',
    },
    noPermission: {
      overline: 'Permissão',
      title: 'Você não pode ver {screen}',
      body: 'Seu perfil de acesso no {product} não inclui a permissão de Visualizar para esta tela. O que você pode fazer dentro do {product} é definido pelo seu perfil de acesso lá.',
      note: 'Isto é diferente de acesso ao produto: você pode abrir o {product}, mas não esta tela.',
      back: 'Voltar ao {product}',
    },
  },

  fsm: {
    overline: 'Gestão de serviços em campo',
    soon: 'Em breve',
    body: 'Em desenvolvimento. Ainda não disponível para nenhuma empresa.',
  },

  errors: {
    boundary: {
      overline: 'Algo deu errado',
      title: 'Não foi possível carregar esta página',
      fallback: 'A requisição não voltou. Verifique se a API está em execução e tente de novo.',
      retry: 'Tentar de novo',
      reference: 'Referência {digest}',
    },
    notFound: {
      title: 'Não há nada neste endereço',
      body: 'A página pode ter sido renomeada, ou o registro para o qual ela apontava foi excluído.',
    },
  },

  api: {
    generic: {
      invalidData: 'Dados inválidos',
      unauthorized: 'Não autorizado',
      forbidden: 'Acesso negado',
      serverError: 'Algo deu errado do nosso lado. Tente novamente.',
      routeNotFound: 'Rota não encontrada',
      networkError:
        'Não foi possível acessar o servidor. Verifique se a API está em execução e tente novamente.',
      malformedResponse: 'O servidor enviou uma resposta que o aplicativo não conseguiu ler.',
    },
    validation: {
      nameRequired: 'O nome é obrigatório',
      typeRequired: 'Informe ao menos um tipo',
      invalidEmail: 'E-mail inválido',
      emailRequired: 'Informe um e-mail válido',
      passwordRequired: 'A senha é obrigatória',
      fullNameRequired: 'O nome completo é obrigatório',
      birthDateRequired: 'A data de nascimento é obrigatória',
      documentRequired: 'O documento é obrigatório',
      documentTypeRequired: 'O tipo de documento é obrigatório',
      invalidDocumentFormat: 'Formato de documento inválido',
      idRequired: 'Informe ao menos um identificador',
      personRequired: 'A pessoa é obrigatória',
      updateFieldRequired: 'Informe ao menos um campo para atualizar',
      columnRequired: 'Mantenha ao menos uma coluna',
      invalidGridKey: 'Chave de grade inválida',
      unknownProduct: 'Produto desconhecido',
    },
    auth: {
      missingFields: 'Preencha o e-mail e a senha',
      invalidEmailFormat: 'Formato de e-mail inválido',
      invalidCredentials: 'E-mail ou senha inválidos',
      loginSuccess: 'Login realizado com sucesso',
      registerMissingFields: 'Preencha todos os campos obrigatórios',
      emailTaken: 'Este e-mail já está em uso',
      registerSuccess: 'Usuário criado com sucesso',
      registered: 'Cadastro realizado com sucesso',
      personHasAccount: 'Esta pessoa já tem uma conta',
    },
    access: {
      noAccess: 'Sem acesso ao {product}',
      accountNoAccess: 'Esta conta não tem acesso ao {product}',
      noContract: 'Sua empresa não tem contrato ativo do {product}',
      noLicenses:
        'Não há licenças disponíveis do {product}. Fale com a Oliveira para ampliar o limite.',
      memberInactive: 'Este membro está inativo',
      multipleCompanies: 'Esta conta pertence a mais de uma empresa',
    },
    notFound: {
      member: 'Membro não encontrado',
      account: 'Conta não encontrada',
      company: 'Empresa não encontrada',
      person: 'Pessoa não encontrada',
      people: 'Uma ou mais pessoas não foram encontradas',
      profile: 'Perfil não encontrado',
    },
    guard: {
      lastCompanyAdmin: 'A empresa precisa manter pelo menos um administrador',
      lastProfileManager: 'Pelo menos um membro precisa manter a permissão de gerenciar perfis',
      lastSuperAdmin: 'Não é possível remover o último super admin ativo',
      ownSuperAdmin: 'Um super admin não pode remover o próprio acesso',
      protectedProfile: 'Este perfil é protegido e não pode ser excluído',
    },
    done: {
      personCreated: 'Pessoa criada com sucesso',
      personUpdated: 'Pessoa atualizada com sucesso',
      personDeleted: 'Pessoa excluída',
      peopleDeleted: '{count, plural, one {# pessoa excluída} other {# pessoas excluídas}}',
      profileDeleted: 'Perfil excluído',
      profilesDeleted: '{count, plural, one {# perfil excluído} other {# perfis excluídos}}',
    },
  },

  shell: {
    nav: { label: 'Principal' },
    products: {
      heading: 'Produtos',
      switch: 'Trocar de produto. Atual: {product}',
      current: 'Produto atual',
      access: 'Acesso',
      noAccess: 'Sem acesso',
      soon: 'Em breve',
    },
    account: {
      menuFor: 'Menu da conta de {name}',
      signOut: 'Sair',
    },
    search: {
      label: 'Buscar telas',
      placeholder: 'Buscar telas…',
      empty: 'Nenhuma tela encontrada.',
      prompt: 'Comece a digitar para buscar…',
      screen: 'Tela',
      openNewTab: 'Abrir em nova aba',
      favorite: 'Adicionar aos favoritos',
      unfavorite: 'Remover dos favoritos',
      open: 'Buscar',
      close: 'Fechar busca',
    },
    drawer: {
      open: 'Abrir menu',
      close: 'Fechar menu',
      title: 'Menu',
      description: 'Empresa, produtos, navegação e idioma',
    },
  },
};
