# Cadastro de Pessoa

## Referência Visual

A imagem cadastro-pessoa-listagem.png representa a tela de referência utilizada durante o levantamento funcional.

Ela deve ser utilizada apenas como inspiração para:

- organização visual;
- posicionamento dos componentes;
- hierarquia das informações;
- experiência do usuário (UX).

A implementação não precisa copiar o layout exatamente, mas deve manter os mesmos conceitos de usabilidade descritos neste documento.

![Cadastro Pessoa](./cadastro-pessoa-listagem.png)

# Cadastro de Pessoa - Especificação Funcional

## Objetivo

A rotina de Cadastro de Pessoa será a primeira implementação do módulo de listagens do sistema e servirá como referência para as demais entidades.

Todas as funcionalidades genéricas identificadas nesta rotina deverão ser implementadas como componentes reutilizáveis para futuras listagens.

---

# Estrutura da tela

A tela deverá possuir:

- Cabeçalho com título da rotina;
- Botões de ação (Adicionar, Editar e Excluir);
- Toolbar da listagem;
- Grid de dados;
- Paginação.

O clique em uma linha apenas seleciona o registro.

A navegação para edição ocorre apenas através do botão Editar.

---

# Toolbar (Componente Compartilhado)

A toolbar não pertence ao Cadastro de Pessoa.

Ela deverá ser um componente reutilizável utilizado em todas as listagens do sistema.

Ela deverá conter:

- Pesquisa Global;
- Exportação;
- Personalização de Colunas;
- Atualizar;
- Filtros Avançados.

## Pesquisa

- Pesquisa incremental;
- Atualização automática dos resultados;
- Botão para limpar pesquisa;
- Deve funcionar em conjunto com filtros e ordenação.

## Atualizar

O botão Atualizar deverá apenas recarregar os dados.

Não deverá limpar:

- Pesquisa;
- Ordenação;
- Filtros;
- Paginação;
- Seleção (caso possível).

## Exportação

Permitir escolher:

- quais colunas exportar;
- ordem das colunas.

A exportação deverá utilizar como base a configuração atual da grid, permitindo alterações antes da geração do arquivo.

## Personalização

Permitir:

- Mostrar/Ocultar colunas;
- Reordenar colunas;
- Restaurar configuração padrão.

As preferências deverão ser persistidas por usuário.

## Filtros

Filtros avançados deverão abrir em painel lateral.

Cada rotina poderá definir seus próprios campos.

O componente deverá ser reutilizável.

---

# Grid

A grid será composta por componentes reutilizáveis.

Cada coluna deverá suportar:

- Ordenação;
- Filtro individual.

## Ordenação

Cada coluna deverá possuir três estados:

- Crescente;
- Decrescente;
- Sem ordenação.

## Filtro por coluna

O tipo do filtro dependerá do tipo do dado:

Texto

Booleano

Enum

Data

Número

etc.

O componente deverá identificar automaticamente o tipo do campo.

---

# Seleção

Selecionar uma linha apenas marca o registro.

Editar:

Apenas um registro.

Excluir:

Um ou vários registros.

Caso exista limite para operações em lote, ele deverá ser configurável.

---

# Paginação

A paginação deverá ser um componente reutilizável.

A implementação poderá evoluir futuramente para:

- tamanho variável da página;
- navegação direta;
- paginação infinita.

---

# Componentes Compartilhados

A implementação deverá extrair componentes reutilizáveis para todo o sistema.

Exemplos:

- ToolbarList
- DataTable
- ColumnHeader
- ColumnFilter
- FilterDrawer
- ExportModal
- GridCustomizationModal
- Pagination
- SearchInput
- EmptyState
- LoadingState
- ContextMenu

---

# Componentes Específicos da rotina Pessoa

A rotina Pessoa deverá implementar apenas:

- colunas;
- filtros específicos;
- ações do menu contextual;
- regras próprias da entidade.

Todo o restante deverá utilizar componentes compartilhados.

---

# Objetivo arquitetural

O Cadastro de Pessoa será a primeira implementação da infraestrutura de listagens.

As próximas rotinas deverão reutilizar praticamente toda a estrutura desenvolvida, alterando apenas:

- entidade;
- colunas;
- filtros;
- regras de negócio;
- ações específicas.