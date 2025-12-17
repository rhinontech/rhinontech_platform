import { PrivateAxios } from "@/helpers/PrivateAxios";

// Fetch table columns for a view
export const getTableColumns = async (view_id: number) => {
  try {
    const response = await PrivateAxios.get(
      `/crm/tables/view/${view_id}/table-columns`
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Update full table column list (bulk update)
export const updateTableColumns = async (
  view_id: number,
  table_columns: any[]
) => {
  try {
    const response = await PrivateAxios.put(
      `/crm/tables/view/${view_id}/table-columns`,
      { table_columns }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Add a new column
export const addTableColumn = async (view_id: number, column: any) => {
  try {
    const response = await PrivateAxios.post(
      `/crm/tables/view/${view_id}/table-columns`,
      column
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Delete a column by key
export const deleteTableColumn = async (view_id: number, key: string) => {
  try {
    const response = await PrivateAxios.delete(
      `/crm/tables/view/${view_id}/table-columns/${key}`
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Reorder columns
export const reorderTableColumns = async (view_id: number, columns: any[]) => {
  try {
    const response = await PrivateAxios.put(
      `/crm/tables/view/${view_id}/table-columns/reorder`,
      { columns }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Toggle visibility for a column
export const toggleColumnVisibility = async (
  view_id: number,
  key: string,
  visible: boolean
) => {
  try {
    const response = await PrivateAxios.put(
      `/crm/tables/view/${view_id}/table-columns/${key}/visibility`,
      { visible }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Rename a column
export const renameColumn = async (
  view_id: number,
  key: string,
  newLabel: string
) => {
  try {
    const response = await PrivateAxios.put(
      `/crm/tables/view/${view_id}/table-columns/${key}/rename`,
      { label: newLabel }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};
