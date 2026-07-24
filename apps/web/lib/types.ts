export interface Person {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  birthdate: string | null;
  documentType: 'CPF' | 'CNPJ';
  document: string;
  type: 'CLIENT' | 'SUPPLIER';
  active: boolean;
  street: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}
