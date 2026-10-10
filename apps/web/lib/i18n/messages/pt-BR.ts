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
