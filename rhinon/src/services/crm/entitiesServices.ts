// services/crm/entitiesServices.ts
import { PrivateAxios } from "@/helpers/PrivateAxios";

export const getPerson = async () => {
  try {
    const response = await PrivateAxios.get(`/crm/entities/people`);
    return response.data;
  } catch (error) {
    console.error("Failed to create person", error);
    throw error;
  }
};

export const getCompany = async () => {
  try {
    const response = await PrivateAxios.get(`/crm/entities/company`);
    return response.data;
  } catch (error) {
    console.error("Failed to create company", error);
    throw error;
  }
};

export const getDeal = async () => {
  try {
    const response = await PrivateAxios.get(`/crm/entities/Deal`);
    return response.data;
  } catch (error) {
    console.error("Failed to create company", error);
    throw error;
  }
};

export const createPerson = async (payload: any) => {
  try {
    const response = await PrivateAxios.post(`/crm/entities/people`, payload);
    return response.data;
  } catch (error) {
    console.error("Failed to create person", error);
    throw error;
  }
};

export const createCompany = async (payload: any) => {
  try {
    const response = await PrivateAxios.post(`/crm/entities/company`, payload);
    return response.data;
  } catch (error) {
    console.error("Failed to create company", error);
    throw error;
  }
};

export const createLead = async (payload: any) => {
  try {
    const response = await PrivateAxios.post(`/crm/entities/deal`, payload);
    return response.data;
  } catch (error) {
    console.error("Failed to create lead", error);
    throw error;
  }
};

export const updatePerson = async (id: number, payload: any) => {
  try {
    const response = await PrivateAxios.put(
      `/crm/entities/people/${id}`,
      payload
    );
    return response.data;
  } catch (error) {
    console.error("Failed to create person", error);
    throw error;
  }
};

export const updateCompany = async (id: number, payload: any) => {
  try {
    const response = await PrivateAxios.put(
      `/crm/entities/company/${id}`,
      payload
    );
    return response.data;
  } catch (error) {
    console.error("Failed to create company", error);
    throw error;
  }
};

export const updateLead = async (id: number, payload: any) => {
  try {
    const response = await PrivateAxios.put(
      `/crm/entities/deal/${id}`,
      payload
    );
    return response.data;
  } catch (error) {
    console.error("Failed to create lead", error);
    throw error;
  }
};

export const deletePerson = async (id: number) => {
  try {
    const response = await PrivateAxios.delete(`/crm/entities/people/${id}`);
    return response.data;
  } catch (error) {
    console.error("Failed to delete person", error);
    throw error;
  }
};

export const deleteCompany = async (id: number) => {
  try {
    const response = await PrivateAxios.delete(`/crm/entities/company/${id}`);
    return response.data;
  } catch (error) {
    console.error("Failed to delete company", error);
    throw error;
  }
};

export const deleteDeal = async (id: number) => {
  try {
    const response = await PrivateAxios.delete(`/crm/entities/deal/${id}`);
    return response.data;
  } catch (error) {
    console.error("Failed to delete deal", error);
    throw error;
  }
};

// ------------------------- CUSTOMERS -------------------------

export const getCustomers = async () => {
  try {
    const response = await PrivateAxios.get(`/crm/entities/customers`);
    return response.data;
  } catch (error) {
    console.error("Failed to fetch customers", error);
    throw error;
  }
};

export const getCustomer = async (id: number) => {
  try {
    const response = await PrivateAxios.get(`/crm/entities/customers/${id}`);
    return response.data;
  } catch (error) {
    console.error("Failed to fetch customer", error);
    throw error;
  }
};

export const createCustomer = async (payload: any) => {
  try {
    const response = await PrivateAxios.post(
      `/crm/entities/customers`,
      payload
    );
    return response.data;
  } catch (error) {
    console.error("Failed to create customer", error);
    throw error;
  }
};

export const updateCustomer = async (id: number, payload: any) => {
  try {
    const response = await PrivateAxios.put(
      `/crm/entities/customers/${id}`,
      payload
    );
    return response.data;
  } catch (error) {
    console.error("Failed to update customer", error);
    throw error;
  }
};

export const deleteCustomer = async (id: number) => {
  try {
    const response = await PrivateAxios.delete(`/crm/entities/customers/${id}`);
    return response.data;
  } catch (error) {
    console.error("Failed to delete customer", error);
    throw error;
  }
};
