import { makeStyles } from "@material-ui/core/styles";

// Hook para aplicar bordas arredondadas facilmente em qualquer componente
export const useRoundedStyles = makeStyles((theme) => ({
  // Containers principais
  container: {
    borderRadius: 12,
  },
  paper: {
    borderRadius: 12,
  },
  card: {
    borderRadius: 12,
  },
  
  // Formulários
  input: {
    '& .MuiOutlinedInput-root': {
      borderRadius: 12,
    },
  },
  textField: {
    '& .MuiOutlinedInput-root': {
      borderRadius: 12,
    },
  },
  
  // Botões
  button: {
    borderRadius: 12,
  },
  iconButton: {
    borderRadius: 12,
  },
  
  // Modais
  dialog: {
    '& .MuiDialog-paper': {
      borderRadius: 12,
    },
  },
  modal: {
    '& .MuiPaper-root': {
      borderRadius: 12,
    },
  },
  
  // Tabelas
  table: {
    borderRadius: 12,
    overflow: 'hidden',
    '& .MuiTableContainer-root': {
      borderRadius: 12,
    },
  },
  
  // Chat e Messages
  message: {
    borderRadius: 12,
  },
  chatBubble: {
    borderRadius: 12,
  },
  
  // Dashboard
  dashboardCard: {
    borderRadius: 12,
  },
  
  // Tickets
  ticketCard: {
    borderRadius: 12,
  },
  
  // Utility classes
  rounded: {
    borderRadius: 12,
  },
  roundedSm: {
    borderRadius: 6,
  },
  roundedLg: {
    borderRadius: 16,
  },
  roundedFull: {
    borderRadius: '50%',
  },
  roundedNone: {
    borderRadius: 0,
  },
}));

// Função helper para aplicar diretamente em componentes inline
export const roundedStyles = {
  container: { borderRadius: 12 },
  paper: { borderRadius: 12 },
  card: { borderRadius: 12 },
  button: { borderRadius: 12 },
  input: { borderRadius: 12 },
  table: { borderRadius: 12, overflow: 'hidden' },
  message: { borderRadius: 12 },
  rounded: { borderRadius: 12 },
  roundedSm: { borderRadius: 6 },
  roundedLg: { borderRadius: 16 },
  roundedFull: { borderRadius: '50%' },
  roundedNone: { borderRadius: 0 },
};

// Hook para aplicar bordas arredondadas em um elemento específico
export const useApplyRounded = (element = 'default') => {
  const styles = {
    default: { borderRadius: 12 },
    small: { borderRadius: 6 },
    large: { borderRadius: 16 },
    full: { borderRadius: '50%' },
    none: { borderRadius: 0 },
  };
  
  return styles[element] || styles.default;
};